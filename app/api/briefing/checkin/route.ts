import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError, apiErrorResponse } from '@/lib/api/server-errors';
import { enforceTrustedMutationOrigin } from '@/lib/api/csrf';
import { createClient } from '@/lib/auth/server';
import { getCheckin, upsertCheckin } from '@/lib/supabase/dailyBriefing';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const responsesSchema = z
  .object({
    studied: z.boolean().optional(),
    clean: z.boolean().optional(),
    gamblingRisk: z.number().int().min(1).max(5).optional(),
    gym: z.boolean().optional(),
    sleep: z.number().int().min(1).max(3).optional(),
    focus: z.number().int().min(1).max(3).optional(),
    morningIntent: z.string().max(500).optional(),
  })
  .strict()
  .optional();

const putSchema = z.object({
  date: z.string().regex(DATE_RE, 'date must be YYYY-MM-DD'),
  type: z.enum(['morning', 'evening']),
  energy: z.number().int().min(1).max(3).nullable().optional(),
  journalText: z.string().max(4000).nullable().optional(),
  responses: responsesSchema,
});

export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const type = searchParams.get('type');
    if (!date || !DATE_RE.test(date)) {
      return apiErrorResponse(400, 'BAD_REQUEST', 'Query parameter "date" (YYYY-MM-DD) is required');
    }
    if (type !== 'morning' && type !== 'evening') {
      return apiErrorResponse(400, 'BAD_REQUEST', 'Query parameter "type" must be morning|evening');
    }

    const supabase = createClient();
    const checkin = await getCheckin(supabase, user.id, date, type);
    return NextResponse.json({ checkin });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch check-in', 'Error fetching check-in');
  }
}

export async function PUT(request: NextRequest) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const input = putSchema.parse(body);

    const supabase = createClient();
    const checkin = await upsertCheckin(supabase, user.id, {
      date: input.date,
      type: input.type,
      energy: input.energy ?? null,
      journalText: input.journalText ?? null,
      ...(input.responses ? { responses: input.responses } : {}),
    });

    return NextResponse.json(checkin);
  } catch (error) {
    return handleRouteError(error, 'Failed to save check-in', 'Error saving check-in');
  }
}
