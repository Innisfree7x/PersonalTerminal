'use server';

import { cookies } from 'next/headers';
import { fetchTodayEvents } from '@/lib/google/calendar';
import { fetchMergedWeekCalendarEvents } from '@/lib/calendar/weekEvents';
import { getCurrentUser } from '@/lib/auth/server';
import type { CalendarEvent, EventType, CalendarEventKind, CalendarEventSource } from '@/lib/types/calendar';

export interface CalendarEventActionDTO {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  allDay?: boolean;
  type: EventType;
  description?: string;
  location?: string;
  source?: CalendarEventSource;
  kind?: CalendarEventKind;
}

function getCalendarAuthCookies() {
  const cookieStore = cookies();
  return {
    accessToken: cookieStore.get('google_access_token')?.value,
    refreshToken: cookieStore.get('google_refresh_token')?.value,
    expiresAt: cookieStore.get('google_token_expires_at')?.value,
  };
}

async function requireCalendarActionAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

function serializeEvents(events: CalendarEvent[]): CalendarEventActionDTO[] {
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    startTime: event.startTime.toISOString(),
    endTime: event.endTime.toISOString(),
    ...(event.allDay !== undefined ? { allDay: event.allDay } : {}),
    type: event.type,
    ...(event.description ? { description: event.description } : {}),
    ...(event.location ? { location: event.location } : {}),
    ...(event.source ? { source: event.source } : {}),
    ...(event.kind ? { kind: event.kind } : {}),
  }));
}

export async function checkGoogleCalendarConnectionAction(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const { accessToken, refreshToken, expiresAt } = getCalendarAuthCookies();
  if (!accessToken) return false;

  try {
    await fetchTodayEvents(accessToken, refreshToken, expiresAt);
    return true;
  } catch {
    return false;
  }
}

export async function fetchTodayCalendarEventsAction(): Promise<CalendarEventActionDTO[]> {
  await requireCalendarActionAuth();
  const { accessToken, refreshToken, expiresAt } = getCalendarAuthCookies();
  if (!accessToken) {
    throw new Error('UNAUTHORIZED');
  }

  const events = await fetchTodayEvents(accessToken, refreshToken, expiresAt);
  return serializeEvents(events);
}

export async function fetchWeekCalendarEventsAction(
  weekStartIso: string
): Promise<CalendarEventActionDTO[]> {
  await requireCalendarActionAuth();
  const { accessToken, refreshToken, expiresAt } = getCalendarAuthCookies();

  const weekStart = new Date(weekStartIso);
  if (Number.isNaN(weekStart.getTime())) {
    throw new Error('Invalid weekStart');
  }

  const events = await fetchMergedWeekCalendarEvents(weekStart, {
    accessToken,
    refreshToken,
    expiresAt,
  });
  return serializeEvents(events);
}

export async function disconnectGoogleCalendarAction(): Promise<void> {
  await requireCalendarActionAuth();
  const cookieStore = cookies();
  cookieStore.delete('google_access_token');
  cookieStore.delete('google_refresh_token');
  cookieStore.delete('google_token_expires_at');
}
