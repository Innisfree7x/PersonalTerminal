import { describe, expect, it } from 'vitest';
import { matchTargetFirmSignal } from '@/lib/career/targetFirms';

describe('target firm signal', () => {
  it('matches known firms and boosts aligned tracks strongly', () => {
    const signal = matchTargetFirmSignal('Deloitte GmbH', 'TS');
    expect(signal.matched).toBe(true);
    expect(signal.isTrackAligned).toBe(true);
    expect(signal.boost).toBeGreaterThanOrEqual(8);
    expect(signal.reason).toBeTruthy();
  });

  it('keeps a smaller boost for non-aligned tracks', () => {
    const signal = matchTargetFirmSignal('RSM Deutschland', 'M&A');
    expect(signal.matched).toBe(true);
    expect(signal.isTrackAligned).toBe(false);
    expect(signal.boost).toBeLessThan(7);
    expect(signal.boost).toBeGreaterThanOrEqual(2);
  });

  it('returns no boost for unknown firms', () => {
    const signal = matchTargetFirmSignal('Unknown Student Ventures AG', 'M&A');
    expect(signal.matched).toBe(false);
    expect(signal.boost).toBe(0);
    expect(signal.reason).toBeUndefined();
  });
});

