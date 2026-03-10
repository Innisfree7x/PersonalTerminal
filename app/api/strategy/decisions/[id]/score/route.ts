import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import {
  getStrategyDecisionById,
  listStrategyOptionsByDecision,
  updateStrategyDecisionScore,
} from '@/lib/supabase/strategy';
import { scoreStrategyOptions } from '@/lib/strategy/scoring';

interface Params {
  params: {
    id: string;
  };
}

export async function POST(_request: NextRequest, { params }: Params) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const decision = await getStrategyDecisionById(user.id, params.id);
    if (!decision) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Strategy decision not found' } }, { status: 404 });
    }

    const options = await listStrategyOptionsByDecision(user.id, params.id);
    if (options.length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Add at least one option before scoring' } },
        { status: 400 }
      );
    }

    const { scoredOptions, winner } = scoreStrategyOptions(
      options.map((option) => ({
        id: option.id,
        title: option.title,
        impactPotential: option.impactPotential,
        confidenceLevel: option.confidenceLevel,
        strategicFit: option.strategicFit,
        effortCost: option.effortCost,
        downsideRisk: option.downsideRisk,
        timeToValueWeeks: option.timeToValueWeeks,
      }))
    );

    const persisted = await updateStrategyDecisionScore(user.id, params.id, winner?.total ?? 0, winner?.optionId ?? null);

    return NextResponse.json({
      decision: persisted,
      winner,
      scoredOptions,
    });
  } catch (error) {
    return handleRouteError(error, 'Failed to score strategy decision', 'Error scoring strategy decision');
  }
}
