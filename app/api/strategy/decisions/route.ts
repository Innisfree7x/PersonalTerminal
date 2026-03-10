import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { enforceTrustedMutationOrigin } from '@/lib/api/csrf';
import { createStrategyDecisionSchema } from '@/lib/schemas/strategy.schema';
import { createStrategyDecision, listStrategyDecisionBundles } from '@/lib/supabase/strategy';

export async function GET() {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const decisions = await listStrategyDecisionBundles(user.id);
    return NextResponse.json({ decisions });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch strategy decisions', 'Error fetching strategy decisions');
  }
}

export async function POST(request: NextRequest) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const parsed = createStrategyDecisionSchema.parse(body);
    const decision = await createStrategyDecision(user.id, parsed);
    return NextResponse.json(decision, { status: 201 });
  } catch (error) {
    return handleRouteError(error, 'Failed to create strategy decision', 'Error creating strategy decision');
  }
}
