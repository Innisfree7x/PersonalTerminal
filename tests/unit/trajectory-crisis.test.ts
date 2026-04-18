import { describe, expect, it } from 'vitest';
import { detectCrises } from '@/lib/trajectory/crisis';

describe('detectCrises', () => {
  it('returns empty report when no goals', () => {
    const report = detectCrises({ goals: [], today: '2026-04-19' });
    expect(report.collisions).toEqual([]);
    expect(report.hasCrisis).toBe(false);
  });
});
