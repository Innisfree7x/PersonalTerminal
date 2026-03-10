import { describe, expect, it } from 'vitest';
import { computeStrategyOptionScore, scoreStrategyOptions } from '@/lib/strategy/scoring';

describe('strategy scoring', () => {
  it('computes deterministic total and sub-scores', () => {
    const result = computeStrategyOptionScore({
      id: 'opt-a',
      title: 'Option A',
      impactPotential: 8,
      confidenceLevel: 7,
      strategicFit: 9,
      effortCost: 4,
      downsideRisk: 3,
      timeToValueWeeks: 6,
    });

    expect(result.optionId).toBe('opt-a');
    expect(result.total).toBeGreaterThan(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.breakdown.impact).toBeGreaterThan(result.breakdown.effortPenalty);
    expect(result.breakdown.fit).toBeGreaterThan(0);
  });

  it('ranks higher-value option first', () => {
    const scored = scoreStrategyOptions([
      {
        id: 'opt-low',
        title: 'Low option',
        impactPotential: 4,
        confidenceLevel: 4,
        strategicFit: 4,
        effortCost: 8,
        downsideRisk: 8,
        timeToValueWeeks: 24,
      },
      {
        id: 'opt-high',
        title: 'High option',
        impactPotential: 9,
        confidenceLevel: 8,
        strategicFit: 9,
        effortCost: 3,
        downsideRisk: 2,
        timeToValueWeeks: 4,
      },
    ]);

    expect(scored.winner?.optionId).toBe('opt-high');
    expect(scored.scoredOptions[0]?.total).toBeGreaterThan(scored.scoredOptions[1]?.total ?? 0);
  });
});
