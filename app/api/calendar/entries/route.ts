import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError, apiErrorResponse } from '@/lib/api/server-errors';
import { enforceTrustedMutationOrigin } from '@/lib/api/csrf';
import { createClient } from '@/lib/auth/server';
import {
  listCalendarEntriesInRange,
  createCalendarEntry,
} from '@/lib/supabase/calendarEntries';
import type { CalendarEntry, CalendarEntryKind } from '@/lib/supabase/calendarEntries';
import { fetchGoogleEventsInRange } from '@/lib/google/calendar';
import type { CalendarEvent } from '@/lib/types/calendar';

function googleEventKindToCalendarEntryKind(event: CalendarEvent): CalendarEntryKind {
  if (event.type === 'task') return 'deadline';
  if (event.type === 'break') return 'personal';
  return 'meeting';
}

function googleEventToCalendarEntry(event: CalendarEvent): CalendarEntry {
  return {
    id: `google-${event.id}`,
    source: 'google',
    title: event.title,
    description: event.description ?? null,
    location: event.location ?? null,
    startsAt: event.startTime.toISOString(),
    endsAt: event.endTime.toISOString(),
    allDay: event.allDay ?? false,
    kind: googleEventKindToCalendarEntryKind(event),
  };
}

async function loadGoogleEntries(
  request: NextRequest,
  fromIso: string,
  toIso: string
): Promise<CalendarEntry[]> {
  const accessToken = request.cookies.get('google_access_token')?.value;
  const refreshToken = request.cookies.get('google_refresh_token')?.value;
  const expiresAt = request.cookies.get('google_token_expires_at')?.value;

  if (!accessToken && !refreshToken) return [];

  try {
    const events = await fetchGoogleEventsInRange(
      fromIso,
      toIso,
      accessToken,
      refreshToken,
      expiresAt
    );
    return events.map(googleEventToCalendarEntry);
  } catch (error) {
    console.error('Google calendar fetch failed:', error);
    return [];
  }
}

const kindEnum = z.enum([
  'lecture',
  'exercise',
  'tutorial',
  'exam',
  'interview',
  'meeting',
  'deadline',
  'personal',
  'custom',
]);

const createEntrySchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).nullable().optional(),
    location: z.string().max(200).nullable().optional(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    allDay: z.boolean().optional(),
    kind: kindEnum.optional(),
  })
  .refine((data) => new Date(data.endsAt) >= new Date(data.startsAt), {
    message: 'endsAt must be greater than or equal to startsAt',
    path: ['endsAt'],
  });

export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return apiErrorResponse(
        400,
        'BAD_REQUEST',
        'Query parameters "from" and "to" (ISO datetimes) are required'
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return apiErrorResponse(400, 'BAD_REQUEST', 'Invalid ISO datetime in "from" or "to"');
    }
    if (toDate < fromDate) {
      return apiErrorResponse(400, 'BAD_REQUEST', '"to" must be greater than or equal to "from"');
    }

    const supabase = createClient();
    const fromIso = fromDate.toISOString();
    const toIso = toDate.toISOString();
    const [localEntriesResult, googleEntries] = await Promise.all([
      listCalendarEntriesInRange(supabase, user.id, fromIso, toIso).catch((err) => {
        console.warn('Failed to load local database calendar entries:', err);
        return [] as CalendarEntry[];
      }),
      loadGoogleEntries(request, fromIso, toIso),
    ]);
    const localEntries = localEntriesResult ?? [];

    const entries = [...localEntries, ...googleEntries].sort((a, b) =>
      a.startsAt.localeCompare(b.startsAt)
    );

    const { applyPrivateSWRPolicy } = await import('@/lib/api/responsePolicy');
    return applyPrivateSWRPolicy(NextResponse.json({ entries }), {
      maxAgeSeconds: 10,
      staleWhileRevalidateSeconds: 30,
    });
  } catch (error) {
    return handleRouteError(
      error,
      'Failed to fetch calendar entries',
      'Error fetching calendar entries'
    );
  }
}

export async function POST(request: NextRequest) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const input = createEntrySchema.parse(body);

    const accessToken = request.cookies.get('google_access_token')?.value;
    const refreshToken = request.cookies.get('google_refresh_token')?.value;
    const expiresAt = request.cookies.get('google_token_expires_at')?.value;

    let googleEventId: string | null = null;
    if (body.syncWithGoogle && (accessToken || refreshToken)) {
      try {
        const { createGoogleCalendarEvent } = await import('@/lib/google/calendar');
        const googleEvent = await createGoogleCalendarEvent(
          {
            title: input.title,
            description: input.description ?? null,
            location: input.location ?? null,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            allDay: input.allDay,
          },
          accessToken || '',
          refreshToken,
          expiresAt
        );
        googleEventId = googleEvent.id;
      } catch (syncErr) {
        console.warn('Failed to push event directly to Google Calendar:', syncErr);
      }
    }

    const supabase = createClient();
    const entry = await createCalendarEntry(supabase, user.id, {
      title: input.title,
      description: input.description ?? null,
      location: input.location ?? null,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      allDay: input.allDay ?? false,
      kind: input.kind ?? 'custom',
    });

    return NextResponse.json({ ...entry, googleEventId }, { status: 201 });
  } catch (error) {
    return handleRouteError(
      error,
      'Failed to create calendar entry',
      'Error creating calendar entry'
    );
  }
}
