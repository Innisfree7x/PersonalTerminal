import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError, apiErrorResponse } from '@/lib/api/server-errors';
import { enforceTrustedMutationOrigin } from '@/lib/api/csrf';
import { createClient } from '@/lib/auth/server';
import {
  updateCalendarEntry,
  deleteCalendarEntry,
  type UpdateCalendarEntryInput,
} from '@/lib/supabase/calendarEntries';
import { updateGoogleCalendarEvent, deleteGoogleCalendarEvent } from '@/lib/google/calendar';

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

const updateEntrySchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    location: z.string().max(200).nullable().optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    allDay: z.boolean().optional(),
    kind: kindEnum.optional(),
  })
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return new Date(data.endsAt) >= new Date(data.startsAt);
      }
      return true;
    },
    { message: 'endsAt must be greater than or equal to startsAt', path: ['endsAt'] }
  );

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    if (params.id.startsWith('google-')) {
      const googleEventId = params.id.replace(/^google-/, '');
      const accessToken = request.cookies.get('google_access_token')?.value;
      const refreshToken = request.cookies.get('google_refresh_token')?.value;
      const expiresAt = request.cookies.get('google_token_expires_at')?.value;

      if (!accessToken && !refreshToken) {
        return apiErrorResponse(401, 'UNAUTHORIZED', 'Google account not connected');
      }

      const body = await request.json();
      const validated = updateEntrySchema.parse(body);

      const updated = await updateGoogleCalendarEvent(
        googleEventId,
        {
          title: validated.title,
          description: validated.description,
          location: validated.location,
          startsAt: validated.startsAt,
          endsAt: validated.endsAt,
          allDay: validated.allDay,
        },
        accessToken,
        refreshToken,
        expiresAt
      );
      return NextResponse.json(updated);
    }

    if (!isUuid(params.id)) {
      return apiErrorResponse(400, 'BAD_REQUEST', 'Invalid entry id');
    }

    const body = await request.json();
    const validated = updateEntrySchema.parse(body);

    const patch: UpdateCalendarEntryInput = {};
    if (validated.title !== undefined) patch.title = validated.title;
    if (validated.description !== undefined) patch.description = validated.description;
    if (validated.location !== undefined) patch.location = validated.location;
    if (validated.startsAt !== undefined) patch.startsAt = validated.startsAt;
    if (validated.endsAt !== undefined) patch.endsAt = validated.endsAt;
    if (validated.allDay !== undefined) patch.allDay = validated.allDay;
    if (validated.kind !== undefined) patch.kind = validated.kind;

    if (Object.keys(patch).length === 0) {
      return apiErrorResponse(400, 'BAD_REQUEST', 'No fields to update');
    }

    const supabase = createClient();
    const entry = await updateCalendarEntry(supabase, user.id, params.id, patch);
    return NextResponse.json(entry);
  } catch (error) {
    return handleRouteError(
      error,
      'Failed to update calendar entry',
      'Error updating calendar entry'
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    if (params.id.startsWith('google-')) {
      const googleEventId = params.id.replace(/^google-/, '');
      const accessToken = request.cookies.get('google_access_token')?.value;
      const refreshToken = request.cookies.get('google_refresh_token')?.value;
      const expiresAt = request.cookies.get('google_token_expires_at')?.value;

      if (!accessToken && !refreshToken) {
        return apiErrorResponse(401, 'UNAUTHORIZED', 'Google account not connected');
      }

      await deleteGoogleCalendarEvent(
        googleEventId,
        accessToken,
        refreshToken,
        expiresAt
      );
      return NextResponse.json({ message: 'Google Calendar event deleted' }, { status: 200 });
    }

    if (!isUuid(params.id)) {
      return apiErrorResponse(400, 'BAD_REQUEST', 'Invalid entry id');
    }

    const supabase = createClient();
    await deleteCalendarEntry(supabase, user.id, params.id);
    return NextResponse.json({ message: 'Calendar entry deleted' }, { status: 200 });
  } catch (error) {
    return handleRouteError(
      error,
      'Failed to delete calendar entry',
      'Error deleting calendar entry'
    );
  }
}
