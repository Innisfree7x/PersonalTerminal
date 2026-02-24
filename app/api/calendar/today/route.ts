import { NextRequest, NextResponse } from 'next/server';
import { fetchTodayEvents } from '@/lib/google/calendar';
import { requireApiAuth } from '@/lib/api/auth';
import { createApiTraceContext, withApiTraceHeaders } from '@/lib/api/observability';

/**
 * GET /api/calendar/today - Fetch today's events from Google Calendar
 */
export async function GET(request: NextRequest) {
  const trace = createApiTraceContext(request, '/api/calendar/today');
  const { errorResponse } = await requireApiAuth();
  if (errorResponse) return withApiTraceHeaders(errorResponse, trace, { metricName: 'calendar_today' });

  const accessToken = request.cookies.get('google_access_token')?.value;
  const refreshToken = request.cookies.get('google_refresh_token')?.value;
  const expiresAt = request.cookies.get('google_token_expires_at')?.value;

  if (!accessToken) {
    const response = NextResponse.json(
      { message: 'Not authenticated. Please connect Google Calendar.' },
      { status: 401 }
    );
    return withApiTraceHeaders(response, trace, { metricName: 'calendar_today' });
  }

  try {
    const events = await fetchTodayEvents(accessToken, refreshToken, expiresAt);

    // Update access token cookie if it was refreshed
    // Note: This is a simplified approach. In production, you might want to
    // handle token refresh in middleware or return new token in response.

    const response = NextResponse.json(events, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
    return withApiTraceHeaders(response, trace, { metricName: 'calendar_today' });
  } catch (error) {
    console.error('Error fetching calendar events:', error);

    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      const response = NextResponse.json(
        { message: 'Token expired. Please reconnect Google Calendar.' },
        { status: 401 }
      );
      return withApiTraceHeaders(response, trace, { metricName: 'calendar_today' });
    }

    const response = NextResponse.json(
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
    return withApiTraceHeaders(response, trace, { metricName: 'calendar_today' });
  }
}
