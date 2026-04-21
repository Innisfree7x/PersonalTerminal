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
    const entries = await listCalendarEntriesInRange(
      supabase,
      user.id,
      fromDate.toISOString(),
      toDate.toISOString()
    );

    return NextResponse.json({ entries });
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

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return handleRouteError(
      error,
      'Failed to create calendar entry',
      'Error creating calendar entry'
    );
  }
}
