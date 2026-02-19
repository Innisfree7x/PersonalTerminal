import { NextRequest, NextResponse } from 'next/server';
import { fetchWeekEvents } from '@/lib/google/calendar';
import { requireApiAuth } from '@/lib/api/auth';

/**
 * GET /api/calendar/week - Fetch week's events from Google Calendar
 * Query params: weekStart (ISO date string for Monday)
 */
export async function GET(request: NextRequest) {
  const { errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  const accessToken = request.cookies.get('google_access_token')?.value;
  const refreshToken = request.cookies.get('google_refresh_token')?.value;
  const expiresAt = request.cookies.get('google_token_expires_at')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { message: 'Not authenticated. Please connect Google Calendar.' },
      { status: 401 }
    );
  }

  // Get week start from query params (defaults to current week)
  const weekStartParam = request.nextUrl.searchParams.get('weekStart');
  let weekStart: Date;

  if (weekStartParam) {
    weekStart = new Date(weekStartParam);
  } else {
    // Calculate current week's Monday
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
  }

  try {
    const events = await fetchWeekEvents(weekStart, accessToken, refreshToken, expiresAt);

    return NextResponse.json(events, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);

    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { message: 'Token expired. Please reconnect Google Calendar.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Failed to fetch calendar events',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
