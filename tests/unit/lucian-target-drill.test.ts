import { describe, expect, test } from 'vitest';
import {
  createTarget,
  nextComboOnHit,
  pruneExpiredTargets,
  resetComboOnMiss,
  scoreForHit,
} from '@/lib/lucian/game/targetDrill';

describe('lucian target drill', () => {
  test('scores increase with combo', () => {
    expect(scoreForHit(0)).toBe(90);
    expect(scoreForHit(3)).toBe(135);
    expect(scoreForHit(8)).toBeGreaterThan(scoreForHit(2));
  });

  test('combo increments on hit and caps at 99', () => {
    expect(nextComboOnHit(0)).toBe(1);
    expect(nextComboOnHit(11)).toBe(12);
    expect(nextComboOnHit(99)).toBe(99);
  });

  test('combo resets on miss', () => {
    expect(resetComboOnMiss()).toBe(0);
  });

  test('target spawns within bounds', () => {
    const target = createTarget(
      1_000,
      { width: 1200, height: 800, padding: 50, minRadius: 20, maxRadius: 20 },
      1500,
      () => 0.5,
    );

    expect(target.radius).toBe(20);
    expect(target.x).toBeGreaterThanOrEqual(70);
    expect(target.x).toBeLessThanOrEqual(1130);
    expect(target.y).toBeGreaterThanOrEqual(70);
    expect(target.y).toBeLessThanOrEqual(730);
    expect(target.expiresAt).toBe(2_500);
  });

  test('expired targets are pruned', () => {
    const now = 10_000;
    const activeTarget = { id: 'a', x: 0, y: 0, radius: 20, bornAt: 9_000, expiresAt: 10_500 };
    const expiredTargetA = { id: 'b', x: 0, y: 0, radius: 20, bornAt: 8_000, expiresAt: 9_900 };
    const expiredTargetB = { id: 'c', x: 0, y: 0, radius: 20, bornAt: 8_100, expiresAt: 10_000 };

    const result = pruneExpiredTargets([activeTarget, expiredTargetA, expiredTargetB], now);

    expect(result.active).toHaveLength(1);
    expect(result.active[0]?.id).toBe('a');
    expect(result.expired).toBe(2);
  });
});

