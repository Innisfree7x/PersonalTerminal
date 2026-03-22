import { describe, expect, it } from 'vitest';
import { buildOpportunityCompanyLens } from '@/lib/career/opportunityCompanyLens';
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
  cvTargetTracks: ['M&A', 'TS'],
  llm: {
    enabled: true,
    maxDailyUnits: 50,
    usedUnits: 1,
    remainingUnits: 49,
    enrichedThisRequest: 1,
  },
};

function makeItem(overrides: Partial<OpportunitySearchItem> = {}): OpportunitySearchItem {
  return {
    id: 'opp_1',
    title: 'Intern M&A Advisory',
    company: 'Rothenstein Partners',
    city: 'Frankfurt',
    country: 'DE',
    track: 'M&A',
    fitScore: 82,
    band: 'realistic',
    topReasons: ['Direkter Track-Match zu M&A'],
    topGaps: ['Interview case speed'],
    sourceLabels: ['Campus Board', 'Employer Feed'],
    targetFirm: true,
    nextAction: 'CV auf DCF-Projekte zuspitzen und dann direkt einreichen.',
    ...overrides,
  };
}

describe('buildOpportunityCompanyLens', () => {
  it('creates a branded company lens for known target-firm clusters', () => {
    const lens = buildOpportunityCompanyLens(makeItem(), 'M&A', baseMeta);

    expect(lens.title).toContain('Boutique M&A');
    expect(lens.summary).toContain('Rothenstein Partners');
    expect(lens.chips.some((chip) => chip.label === 'Track aligned')).toBe(true);
  });

  it('falls back to a generic company lens for unknown firms', () => {
    const lens = buildOpportunityCompanyLens(
      makeItem({
        company: 'Unknown Student Ventures AG',
        targetFirm: false,
      }),
      'M&A',
      baseMeta
    );

    expect(lens.title).toContain('Company Lens');
    expect(lens.summary).toContain('operativer M&A-Lead');
  });
});
