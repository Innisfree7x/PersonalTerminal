import { describe, expect, it } from 'vitest';
import { analyzeCvText } from '@/lib/career/cvAnalysis';

describe('analyzeCvText', () => {
  it('returns stable rank/tier with finance-heavy signals', () => {
    const text = `
      Bachelor in Business Administration.
      Internship in M&A with DCF, comps and valuation model updates.
      Worked in due diligence data room and prepared PowerPoint deck for client.
      Strong Excel skills with pivot and xlookup.
    `;

    const result = analyzeCvText(text, ['M&A']);
    expect(result.cvRank).toBeGreaterThanOrEqual(60);
    expect(['strong', 'top']).toContain(result.rankTier);
    expect(result.topStrengths.length).toBeGreaterThan(0);
    expect(result.topGaps.length).toBeGreaterThan(0);
    expect(result.detectedSkills.length).toBeGreaterThan(0);
  });

  it('flags weak/short profiles with clear gaps', () => {
    const text = `Student profile. Looking for internship.`;
    const result = analyzeCvText(text, ['TS']);
    expect(result.cvRank).toBeLessThanOrEqual(55);
    expect(['developing', 'early']).toContain(result.rankTier);
    expect(
      result.topGaps.some(
        (gap) =>
          gap.toLowerCase().includes('transaktionsnahe') || gap.toLowerCase().includes('excel')
      )
    ).toBe(true);
  });
});
