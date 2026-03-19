import { describe, expect, it } from 'vitest';
import { buildOpportunityFitReadout, toDisplayFitIndex } from '@/lib/career/opportunityReadout';
import type { OpportunitySearchItem, OpportunitySearchResponse } from '@/lib/schemas/opportunity-radar.schema';

const baseMeta: OpportunitySearchResponse['meta'] = {
  query: '',
  priorityTrack: 'M&A',
  totalBeforeLimit: 0,
  sourcesQueried: 3,
  liveSourceConfigured: true,
  liveSourceHealthy: true,
  liveSourceContributed: true,
  cvProfileApplied: true,
  cvRankTier: 'strong',
  cvTargetTracks: ['M&A', 'TS'],
  llm: {
    enabled: false,
    maxDailyUnits: 50,
    usedUnits: 0,
    remainingUnits: 50,
    enrichedThisRequest: 0,
  },
};

function buildItem(overrides: Partial<OpportunitySearchItem> = {}): OpportunitySearchItem {
  return {
    id: 'opp-1',
    title: 'Intern M&A Advisory',
    company: 'Rothenstein Partners',
    city: 'Frankfurt',
    country: 'DE',
    track: 'M&A',
    fitScore: 82,
    band: 'realistic',
    topReasons: ['Starker M&A-Fit'],
    topGaps: ['Mehr Live-Deal-Referenzen'],
    sourceLabels: ['Campus Board', 'Adzuna'],
    ...overrides,
  };
}

describe('opportunityReadout', () => {
  it('compresses raw score into displayed fit index', () => {
    expect(toDisplayFitIndex(82)).toBe('8.2');
    expect(toDisplayFitIndex(99)).toBe('8.9');
  });

  it('builds a strong readout for direct realistic matches', () => {
    const readout = buildOpportunityFitReadout(buildItem(), 'M&A', baseMeta);

    expect(readout.confidenceLabel).toContain('Umsetzbarkeit');
    expect(readout.signals.find((signal) => signal.label === 'Track-Fit')?.value).toBe('direkt');
    expect(readout.signals.find((signal) => signal.label === 'Markt-Signal')?.value).toContain('2 Quellen');
    expect(readout.summary).toContain('kein Blind Shot');
  });

  it('downgrades confidence for stretch roles', () => {
    const readout = buildOpportunityFitReadout(
      buildItem({ band: 'stretch', track: 'Audit', sourceLabels: ['Employer Feed'] }),
      'M&A',
      baseMeta
    );

    expect(readout.confidenceTone).toBe('error');
    expect(readout.signals.find((signal) => signal.label === 'Gap-Druck')?.value).toBe('hoch');
    expect(readout.summary).toContain('Upside');
  });
});
