import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { enforceTrustedMutationOrigin } from '@/lib/api/csrf';
import { createStrategyOptionSchema } from '@/lib/schemas/strategy.schema';
import { createStrategyOption, getStrategyDecisionById } from '@/lib/supabase/strategy';

export async function POST(request: NextRequest) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const parsed = createStrategyOptionSchema.parse(body);

    const decision = await getStrategyDecisionById(user.id, parsed.decisionId);
    if (!decision) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Strategy decision not found' } }, { status: 404 });
    }

    const option = await createStrategyOption(user.id, parsed);
    return NextResponse.json(option, { status: 201 });
  } catch (error) {
    return handleRouteError(error, 'Failed to create strategy option', 'Error creating strategy option');
  }
}
