import { createClient } from '@/lib/auth/server';
import { fetchWeekEvents } from '@/lib/google/calendar';
import type { CalendarEvent, CalendarEventKind, EventType } from '@/lib/types/calendar';

interface GoogleCalendarAuth {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  expiresAt: string | undefined;
}

function getWeekEnd(weekStart: Date) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  weekEnd.setHours(0, 0, 0, 0);
  return weekEnd;
}

function mapKitKindToEventType(kind: CalendarEventKind): EventType {
  if (kind === 'exam' || kind === 'deadline') {
    return 'task';
  }

  return 'meeting';
}

function tryCreateCalendarClient() {
  try {
    return createClient();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('outside a request scope')
    ) {
      return null;
    }

    throw error;
  }
}

export async function fetchKitWeekEvents(weekStart: Date): Promise<CalendarEvent[]> {
  const client = tryCreateCalendarClient();
  if (!client) {
    return [];
  }

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return [];
  }

  const weekEnd = getWeekEnd(weekStart);
  const { data, error } = await client
    .from('kit_campus_events')
    .select('id, title, description, location, starts_at, ends_at, kind')
    .eq('user_id', user.id)
    .gte('starts_at', weekStart.toISOString())
    .lt('starts_at', weekEnd.toISOString())
    .order('starts_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch KIT calendar events:', error);
    return [];
  }

  return (data ?? []).map((event) => {
    const startTime = new Date(event.starts_at);
    const fallbackEndTime = new Date(startTime.getTime() + 90 * 60 * 1000);

    return {
      id: `kit-${event.id}`,
      title: event.title,
      startTime,
      endTime: event.ends_at ? new Date(event.ends_at) : fallbackEndTime,
      type: mapKitKindToEventType(event.kind),
      source: 'kit',
      kind: event.kind,
      ...(event.description ? { description: event.description } : {}),
      ...(event.location ? { location: event.location } : {}),
    } satisfies CalendarEvent;
  });
}

async function fetchGoogleWeekEvents(
  weekStart: Date,
  auth: GoogleCalendarAuth
): Promise<{ events: CalendarEvent[]; error: Error | null }> {
  if (!auth.accessToken) {
    return { events: [], error: null };
  }

  try {
    return {
      events: await fetchWeekEvents(weekStart, auth.accessToken, auth.refreshToken, auth.expiresAt),
      error: null,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return { events: [], error };
    }

    return {
      events: [],
      error: error instanceof Error ? error : new Error('Failed to fetch Google calendar events'),
    };
  }
}

export async function fetchMergedWeekCalendarEvents(
  weekStart: Date,
  auth: GoogleCalendarAuth
): Promise<CalendarEvent[]> {
  const [kitEvents, googleResult] = await Promise.all([
    fetchKitWeekEvents(weekStart),
    fetchGoogleWeekEvents(weekStart, auth),
  ]);

  if (googleResult.error && kitEvents.length === 0) {
    throw googleResult.error;
  }

  return [...kitEvents, ...googleResult.events].sort(
    (left, right) => left.startTime.getTime() - right.startTime.getTime()
  );
}
