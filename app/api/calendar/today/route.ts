import { NextRequest, NextResponse } from 'next/server';
import { fetchTodayEvents } from '@/lib/google/calendar';
import { requireApiAuth } from '@/lib/api/auth';

/**
 * GET /api/calendar/today - Fetch today's events from Google Calendar
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

  try {
    const events = await fetchTodayEvents(accessToken, refreshToken, expiresAt);

    // Update access token cookie if it was refreshed
    // Note: This is a simplified approach. In production, you might want to
    // handle token refresh in middleware or return new token in response.

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
