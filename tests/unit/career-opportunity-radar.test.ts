import { describe, expect, it } from 'vitest';
import { scoreToBand, searchRadarOpportunities } from '@/lib/career/opportunityRadar';

describe('opportunity radar scoring', () => {
  it('uses gate-aligned reach bands', () => {
    expect(scoreToBand(72)).toBe('realistic');
    expect(scoreToBand(71)).toBe('target');
    expect(scoreToBand(58)).toBe('target');
    expect(scoreToBand(57)).toBe('stretch');
  });

  it('deduplicates opportunities from multiple sources', async () => {
    const { items, sourcesQueried } = await searchRadarOpportunities({
      query: 'intern m&a',
      priorityTrack: 'M&A',
      locations: ['DE', 'AT', 'CH'],
      bands: ['realistic', 'target', 'stretch'],
      limit: 12,
    });

    expect(sourcesQueried).toBeGreaterThanOrEqual(2);

    const maRole = items.find((item) => item.company === 'Rothenstein Partners');
    expect(maRole).toBeTruthy();
    expect(maRole?.sourceLabels.length).toBeGreaterThan(1);
  });

  it('classifies audit role at 72 as realistic for gate repro', async () => {
    const { items } = await searchRadarOpportunities({
      query: 'audit',
      priorityTrack: 'M&A',
      locations: ['DE', 'AT', 'CH'],
      bands: ['realistic', 'target', 'stretch'],
      limit: 12,
    });

    const auditRole = items.find((item) => item.title === 'Audit & Deals Internship');
    expect(auditRole?.fitScore).toBe(72);
    expect(auditRole?.band).toBe('realistic');
  });
});
