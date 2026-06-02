import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError, apiErrorResponse } from '@/lib/api/server-errors';
import { enforceTrustedMutationOrigin } from '@/lib/api/csrf';
import { createClient } from '@/lib/auth/server';
import {
  listCommitments,
  getCommitmentsInRange,
  countCommitmentsForDate,
  createCommitment,
} from '@/lib/supabase/dailyBriefing';
import {
  computeFulfillment,
  computeCommitmentStreak,
  toCommitmentDays,
  MAX_COMMITMENTS_PER_DAY,
} from '@/lib/dashboard/briefing';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const createSchema = z.object({
  date: z.string().regex(DATE_RE, 'date must be YYYY-MM-DD'),
  title: z.string().trim().min(1).max(200),
});

function shiftDate(date: string, deltaDays: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() + deltaDays);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    if (!date || !DATE_RE.test(date)) {
      return apiErrorResponse(400, 'BAD_REQUEST', 'Query parameter "date" (YYYY-MM-DD) is required');
    }

    const supabase = createClient();
    const fromDate = shiftDate(date, -30);
    const [commitments, history] = await Promise.all([
      listCommitments(supabase, user.id, date),
      getCommitmentsInRange(supabase, user.id, fromDate, date),
    ]);

    const fulfillment = computeFulfillment(commitments);
    const streak = computeCommitmentStreak(toCommitmentDays(history), date);

    return NextResponse.json({ commitments, fulfillment, streak });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch commitments', 'Error fetching commitments');
  }
}

export async function POST(request: NextRequest) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const input = createSchema.parse(body);

    const supabase = createClient();
    const existing = await countCommitmentsForDate(supabase, user.id, input.date);
    if (existing >= MAX_COMMITMENTS_PER_DAY) {
      return apiErrorResponse(
        409,
        'LIMIT_REACHED',
        `Maximal ${MAX_COMMITMENTS_PER_DAY} Commitments pro Tag`
      );
    }

    const commitment = await createCommitment(supabase, user.id, {
      date: input.date,
      title: input.title,
      sortOrder: existing,
    });

    return NextResponse.json(commitment, { status: 201 });
  } catch (error) {
    return handleRouteError(error, 'Failed to create commitment', 'Error creating commitment');
  }
}
