import { describe, expect, it } from 'vitest';
import { buildOpportunityStrategyHref, buildOpportunityTrajectoryHref } from '@/lib/career/opportunityActions';
import type { OpportunitySearchItem } from '@/lib/schemas/opportunity-radar.schema';

function makeItem(overrides: Partial<OpportunitySearchItem> = {}): OpportunitySearchItem {
  return {
    id: 'opp_1',
    title: 'TS Internship Financial Due Diligence',
    company: 'Kern Advisory',
    city: 'Hamburg',
    country: 'DE',
    track: 'TS',
    fitScore: 78,
    band: 'target',
    topReasons: ['Direkter Track-Fit'],
    topGaps: ['Industry accounting edge cases'],
    sourceLabels: ['Adzuna'],
    targetFirm: false,
    targetFirmReasons: [],
    nextAction: 'Gap zuerst schliessen',
    ...overrides,
  };
}

describe('opportunityActions', () => {
  it('builds a trajectory prefill href from the primary gap', () => {
    const href = buildOpportunityTrajectoryHref(makeItem());
    expect(href).toBeTruthy();

    const url = new URL(href!, 'https://innis.local');
    expect(url.pathname).toBe('/trajectory');
    expect(url.searchParams.get('prefillTitle')).toBe('TS Prep: Industry accounting edge cases');
    expect(url.searchParams.get('prefillCategory')).toBe('internship');
    expect(url.searchParams.get('prefillEffortHours')).toBe('18');
    expect(url.searchParams.get('prefillBufferWeeks')).toBe('1');
    expect(url.searchParams.get('source')).toBe('career_gap_bridge');
    expect(url.searchParams.get('prefillDueDate')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns null when no gap exists', () => {
    const href = buildOpportunityTrajectoryHref(makeItem({ topGaps: [] }));
    expect(href).toBeNull();
  });

  it('builds a strategy prefill href for the selected opportunity', () => {
    const href = buildOpportunityStrategyHref(makeItem());
    const url = new URL(href, 'https://innis.local');

    expect(url.pathname).toBe('/strategy');
    expect(url.searchParams.get('source')).toBe('career_strategy_bridge');
    expect(url.searchParams.get('prefillDecisionTitle')).toBe('Kern Advisory jetzt priorisieren?');
    expect(url.searchParams.get('prefillOptionTitle')).toBe('Kern Advisory aktiv verfolgen');
    expect(url.searchParams.get('prefillOptionSummary')).toContain('TS Internship Financial Due Diligence');
    expect(url.searchParams.get('prefillImpactPotential')).toBe('8');
    expect(url.searchParams.get('prefillConfidenceLevel')).toBe('6');
    expect(url.searchParams.get('prefillStrategicFit')).toBe('7');
    expect(url.searchParams.get('prefillEffortCost')).toBe('6');
    expect(url.searchParams.get('prefillDownsideRisk')).toBe('5');
    expect(url.searchParams.get('prefillTimeToValueWeeks')).toBe('4');
  });
});
