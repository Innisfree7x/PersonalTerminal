import { NextRequest, NextResponse } from 'next/server';
import { createFocusSession, fetchFocusSessions } from '@/lib/supabase/focusSessions';
import { createFocusSessionSchema } from '@/lib/schemas/focusSession.schema';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';

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
    if (limitStr) options.limit = parseInt(limitStr);

    const sessions = await fetchFocusSessions(options);
    return NextResponse.json(sessions);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch focus sessions', 'Error fetching focus sessions');
  }
}

/**
 * POST /api/focus-sessions - Save a completed focus session
 */
export async function POST(request: NextRequest) {
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
