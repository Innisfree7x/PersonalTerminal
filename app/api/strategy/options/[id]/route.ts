import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { enforceTrustedMutationOrigin } from '@/lib/api/csrf';
import { updateStrategyOptionSchema } from '@/lib/schemas/strategy.schema';
import { deleteStrategyOption, getStrategyOptionById, updateStrategyOption } from '@/lib/supabase/strategy';

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
    const parsed = updateStrategyOptionSchema.parse(body);

    if (Object.keys(parsed).length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'No option fields provided' } },
        { status: 400 }
      );
    }

    const updated = await updateStrategyOption(user.id, params.id, parsed);
    return NextResponse.json(updated);
  } catch (error) {
    return handleRouteError(error, 'Failed to update strategy option', 'Error updating strategy option');
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const existing = await getStrategyOptionById(user.id, params.id);
    if (!existing) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Strategy option not found' } }, { status: 404 });
    }

    await deleteStrategyOption(user.id, params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, 'Failed to delete strategy option', 'Error deleting strategy option');
  }
}
