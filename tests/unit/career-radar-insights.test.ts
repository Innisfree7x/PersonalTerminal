import { describe, expect, it } from 'vitest';
import { buildOpportunityRadarInsight } from '@/lib/career/radarInsights';
import type { OpportunitySearchResponse } from '@/lib/schemas/opportunity-radar.schema';

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
  queryRelaxedUsed: false,
  bandRelaxedUsed: false,
};

describe('buildOpportunityRadarInsight', () => {
  it('returns null for empty results', () => {
    expect(buildOpportunityRadarInsight([], baseMeta, 'M&A')).toBeNull();
  });

  it('builds a success insight when realistic hits exist', () => {
    const result = buildOpportunityRadarInsight(
      [
        {
          id: '1',
          title: 'Intern M&A',
          company: 'Rothenstein Partners',
          city: 'Frankfurt',
          country: 'DE',
          track: 'M&A',
          fitScore: 82,
          band: 'realistic',
          topReasons: ['test'],
          topGaps: ['gap'],
          sourceLabels: ['Campus'],
          nextAction: 'CV auf DCF-Projekte zuspitzen.',
        },
      ],
      baseMeta,
      'M&A'
    );

    expect(result?.tone).toBe('success');
    expect(result?.title).toContain('Reach');
    expect(result?.chips.some((chip) => chip.label.includes('realistic'))).toBe(true);
  });
});
