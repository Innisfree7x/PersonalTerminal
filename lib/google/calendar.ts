import { CalendarEvent, EventType } from '@/lib/data/mockEvents';

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  description?: string;
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<string> {
  const { GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret } = await import('@/lib/env').then(m => m.serverEnv);

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Token refresh failed: ${errorData}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Get valid access token (refresh if needed)
 */
async function getValidAccessToken(
  accessToken: string | undefined,
  refreshToken: string | undefined,
  expiresAt: string | undefined
): Promise<string | null> {
  if (!accessToken) {
    return null;
  }

  // Check if token is expired
  if (expiresAt) {
    const expires = new Date(expiresAt);
    const now = new Date();

    // Refresh if token expires in less than 5 minutes
    if (expires.getTime() - now.getTime() < 5 * 60 * 1000) {
      if (refreshToken) {
        try {
          return await refreshAccessToken(refreshToken);
        } catch (error) {
          console.error('Failed to refresh token:', error);
          return null;
        }
      }
      return null;
    }
  }

  return accessToken;
}

/**
 * Map Google Calendar event to our CalendarEvent format
 */
function mapGoogleEventToCalendarEvent(event: GoogleCalendarEvent): CalendarEvent {
  const startTime = event.start?.dateTime
    ? new Date(event.start.dateTime)
    : event.start?.date
    ? new Date(event.start.date + 'T00:00:00')
    : new Date();

  const endTime = event.end?.dateTime
    ? new Date(event.end.dateTime)
    : event.end?.date
    ? new Date(event.end.date + 'T23:59:59')
    : new Date(startTime.getTime() + 60 * 60 * 1000); // Default 1 hour

  // Infer event type from title/description
  const title = event.summary || 'Untitled Event';
  const titleLower = title.toLowerCase();
  let type: EventType = 'meeting';

  if (titleLower.includes('break') || titleLower.includes('lunch') || titleLower.includes('coffee')) {
    type = 'break';
  } else if (
    titleLower.includes('task') ||
    titleLower.includes('todo') ||
    titleLower.includes('work on')
  ) {
    type = 'task';
  }

  const calendarEvent: any = {
    id: event.id,
    title,
    startTime,
    endTime,
    type,
  };
  if (event.description) {
    calendarEvent.description = event.description;
  }
  return calendarEvent;
}

/**
 * Fetch today's events from Google Calendar
 */
export async function fetchTodayEvents(
  accessToken: string,
  refreshToken?: string,
  expiresAt?: string
): Promise<CalendarEvent[]> {
  // Get valid access token (refresh if needed)
  const validToken = await getValidAccessToken(accessToken, refreshToken, expiresAt);

  if (!validToken) {
    throw new Error('No valid access token available');
  }

  // Get today's date range (00:00 - 23:59 in user's timezone)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  // Convert to ISO strings for Google Calendar API
  const timeMin = todayStart.toISOString();
  const timeMax = todayEnd.toISOString();

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${validToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid
      throw new Error('UNAUTHORIZED');
    }
    const errorData = await response.text();
    throw new Error(`Google Calendar API error: ${errorData}`);
  }

  const data = await response.json();
  const events: GoogleCalendarEvent[] = data.items || [];

  return events.map(mapGoogleEventToCalendarEvent);
}

/**
 * Fetch week's events from Google Calendar (Monday to Sunday)
 */
export async function fetchWeekEvents(
  weekStart: Date, // Monday of the week
  accessToken: string,
  refreshToken?: string,
  expiresAt?: string
): Promise<CalendarEvent[]> {
  // Get valid access token (refresh if needed)
  const validToken = await getValidAccessToken(accessToken, refreshToken, expiresAt);

  if (!validToken) {
    throw new Error('No valid access token available');
  }

  // Calculate week end (Sunday 23:59:59)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6); // Add 6 days to get Sunday
  weekEnd.setHours(23, 59, 59, 999);

  // Convert to ISO strings for Google Calendar API
  const timeMin = weekStart.toISOString();
  const timeMax = weekEnd.toISOString();

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${validToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid
      throw new Error('UNAUTHORIZED');
    }
    const errorData = await response.text();
    throw new Error(`Google Calendar API error: ${errorData}`);
  }

  const data = await response.json();
  const events: GoogleCalendarEvent[] = data.items || [];

  return events.map(mapGoogleEventToCalendarEvent);
}
