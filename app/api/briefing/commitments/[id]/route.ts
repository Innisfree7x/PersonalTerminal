import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { enforceTrustedMutationOrigin } from '@/lib/api/csrf';
import { createClient } from '@/lib/auth/server';
import { setCommitmentStatus, deleteCommitment } from '@/lib/supabase/dailyBriefing';

const patchSchema = z.object({
  status: z.enum(['pending', 'done', 'missed']),
  missedReason: z.string().trim().max(500).nullable().optional(),
});

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const input = patchSchema.parse(body);

    const supabase = createClient();
    const commitment = await setCommitmentStatus(
      supabase,
      user.id,
      params.id,
      input.status,
      input.missedReason ?? null
    );

    return NextResponse.json(commitment);
  } catch (error) {
    return handleRouteError(error, 'Failed to update commitment', 'Error updating commitment');
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const supabase = createClient();
    await deleteCommitment(supabase, user.id, params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, 'Failed to delete commitment', 'Error deleting commitment');
  }
}
