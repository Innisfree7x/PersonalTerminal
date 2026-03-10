import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { enforceTrustedMutationOrigin } from '@/lib/api/csrf';
import { updateStrategyDecisionSchema } from '@/lib/schemas/strategy.schema';
import { deleteStrategyDecision, getStrategyDecisionById, updateStrategyDecision } from '@/lib/supabase/strategy';

interface Params {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const parsed = updateStrategyDecisionSchema.parse(body);

    if (Object.keys(parsed).length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'No decision fields provided' } },
        { status: 400 }
      );
    }

    const updated = await updateStrategyDecision(user.id, params.id, parsed);
    return NextResponse.json(updated);
  } catch (error) {
    return handleRouteError(error, 'Failed to update strategy decision', 'Error updating strategy decision');
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const existing = await getStrategyDecisionById(user.id, params.id);
    if (!existing) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Strategy decision not found' } }, { status: 404 });
    }

    await deleteStrategyDecision(user.id, params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, 'Failed to delete strategy decision', 'Error deleting strategy decision');
  }
}
