import { describe, expect, it } from 'vitest';
import { buildOpportunityRecoveryPlan } from '@/lib/career/opportunityRecovery';
import type { OpportunitySearchItem, OpportunitySearchResponse } from '@/lib/schemas/opportunity-radar.schema';

const baseMeta: OpportunitySearchResponse['meta'] = {
  query: '',
  priorityTrack: 'M&A',
  totalBeforeLimit: 1,
  sourcesQueried: 3,
  liveSourceConfigured: true,
  liveSourceHealthy: true,
  liveSourceContributed: true,
  cvProfileApplied: true,
  cvRankTier: 'strong',
  cvTargetTracks: ['TS'],
  llm: {
    enabled: true,
    maxDailyUnits: 50,
    usedUnits: 1,
    remainingUnits: 49,
    enrichedThisRequest: 1,
  },
};

const baseItem: OpportunitySearchItem = {
  id: 'opp_1',
  title: 'TS Internship Financial Due Diligence',
  company: 'Kern Advisory',
  city: 'Hamburg',
  country: 'DE',
  track: 'TS',
  fitScore: 63,
  band: 'target',
  topReasons: ['Track-Nähe zu M&A'],
  topGaps: ['Industry accounting edge cases'],
  sourceLabels: ['Adzuna'],
  nextAction: 'Transaction-Cases wiederholen und TS-Bezug im CV schärfen.',
};

describe('buildOpportunityRecoveryPlan', () => {
  it('builds an empty-state recovery playbook', () => {
    const plan = buildOpportunityRecoveryPlan([], baseMeta, 'M&A', 'goldman');

    expect(plan.title).toContain('Recovery Playbook');
    expect(plan.summary).toContain('goldman');
    expect(plan.bullets).toHaveLength(3);
  });

  it('builds a weak-match recovery mode for best visible lead', () => {
    const plan = buildOpportunityRecoveryPlan([baseItem], baseMeta, 'M&A', '');

    expect(plan.title).toContain('Recovery mode');
    expect(plan.summary).toContain('Kern Advisory');
    expect(plan.bullets[1]).toContain('Transaction-Cases');
  });
});
