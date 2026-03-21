import { describe, expect, it } from 'vitest';
import { buildOpportunityDossier } from '@/lib/career/opportunityDossier';
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
    topGaps: ['Mehrfach gefunden: Campus Board + Employer Feed'],
    sourceLabels: ['Campus Board', 'Employer Feed'],
    targetFirm: true,
    nextAction: 'CV auf DCF-Projekte zuspitzen und dann direkt einreichen.',
    ...overrides,
  };
}

describe('buildOpportunityDossier', () => {
  it('builds a success dossier with metrics and target-firm chip', () => {
    const result = buildOpportunityDossier(makeItem(), 'M&A', baseMeta);

    expect(result.tone).toBe('success');
    expect(result.chips.some((chip) => chip.label === 'Target Firm')).toBe(true);
    expect(result.metrics).toHaveLength(4);
    expect(result.metrics[0]).toMatchObject({ label: 'Track-Fit', value: 'direkt', tone: 'success' });
    expect(result.bullets.some((bullet) => bullet.includes('Operativer Move'))).toBe(true);
    expect(result.actionStack).toHaveLength(3);
    expect(result.actionStack[0]).toMatchObject({ label: 'Jetzt', tone: 'success' });
  });

  it('adds a cv-track mismatch bullet when item track differs from cv focus', () => {
    const result = buildOpportunityDossier(
      makeItem({
        track: 'Audit',
        band: 'stretch',
        fitScore: 54,
      }),
      'Audit',
      baseMeta
    );

    expect(result.tone).toBe('error');
    expect(result.bullets.some((bullet) => bullet.includes('Dein CV spielt aktuell stärker'))).toBe(true);
  });
});
