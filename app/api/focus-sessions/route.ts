import { NextRequest, NextResponse } from 'next/server';
import { createFocusSession, fetchFocusSessions } from '@/lib/supabase/focusSessions';
import { createFocusSessionSchema } from '@/lib/schemas/focusSession.schema';
import { requireApiAuth } from '@/lib/api/auth';

/**
 * GET /api/focus-sessions - Fetch focus sessions
 * Query params: from, to (ISO dates), category, limit
 */
export async function GET(request: NextRequest) {
  const { errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const options: { from?: string; to?: string; category?: string; limit?: number } = {};
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
    console.error('Error fetching focus sessions:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch focus sessions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/focus-sessions - Save a completed focus session
 */
export async function POST(request: NextRequest) {
  const { errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const validatedData = createFocusSessionSchema.parse(body);
    const session = await createFocusSession(validatedData);
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating focus session:', error);

    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { message: 'Validation error', errors: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create focus session' },
      { status: 500 }
    );
  }
}
