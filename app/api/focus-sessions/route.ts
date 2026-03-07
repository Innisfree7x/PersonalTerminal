import { NextRequest, NextResponse } from 'next/server';
import { createFocusSession, fetchFocusSessions } from '@/lib/supabase/focusSessions';
import { createFocusSessionSchema } from '@/lib/schemas/focusSession.schema';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { applyPrivateSWRPolicy } from '@/lib/api/responsePolicy';
import { enforceTrustedMutationOrigin } from '@/lib/api/csrf';

/**
 * GET /api/focus-sessions - Fetch focus sessions
 * Query params: from, to (ISO dates), category, limit
 */
export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const options: { userId: string; from?: string; to?: string; category?: string; limit?: number } = { userId: user.id };
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const category = searchParams.get('category');
    const limitStr = searchParams.get('limit');
    if (from) options.from = from;
    if (to) options.to = to;
    if (category) options.category = category;
    if (limitStr) {
      const parsedLimit = Number.parseInt(limitStr, 10);
      if (Number.isFinite(parsedLimit)) {
        options.limit = Math.max(1, Math.min(200, parsedLimit));
      }
    }

    const sessions = await fetchFocusSessions(options);
    return applyPrivateSWRPolicy(NextResponse.json(sessions), {
      maxAgeSeconds: 20,
      staleWhileRevalidateSeconds: 60,
    });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch focus sessions', 'Error fetching focus sessions');
  }
}

/**
 * POST /api/focus-sessions - Save a completed focus session
 */
export async function POST(request: NextRequest) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const validatedData = createFocusSessionSchema.parse(body);
    const session = await createFocusSession(user.id, validatedData);
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    return handleRouteError(error, 'Failed to create focus session', 'Error creating focus session');
  }
}
