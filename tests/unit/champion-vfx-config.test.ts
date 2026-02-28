import { describe, expect, it } from 'vitest';
import { CHAMPION_VFX_CONFIG } from '@/lib/champion/vfxConfig';

describe('CHAMPION_VFX_CONFIG', () => {
  it('defines cooldowns for all abilities', () => {
    expect(CHAMPION_VFX_CONFIG.abilityCooldownSeconds).toEqual({
      q: expect.any(Number),
      w: expect.any(Number),
      e: expect.any(Number),
      r: expect.any(Number),
    });
    expect(CHAMPION_VFX_CONFIG.abilityCooldownSeconds.r).toBeGreaterThan(
      CHAMPION_VFX_CONFIG.abilityCooldownSeconds.q
    );
  });

  it('defines cast locks and cast animations consistently', () => {
    expect(CHAMPION_VFX_CONFIG.castAnimations).toEqual({
      q: 'cast_q',
      w: 'cast_w',
      e: 'cast_e',
      r: 'cast_r',
    });
    expect(CHAMPION_VFX_CONFIG.castAnimationLockMs.q).toBeGreaterThan(0);
    expect(CHAMPION_VFX_CONFIG.castAnimationLockMs.w).toBeGreaterThan(0);
    expect(CHAMPION_VFX_CONFIG.castAnimationLockMs.e).toBeGreaterThan(0);
    expect(CHAMPION_VFX_CONFIG.castAnimationLockMs.r).toBeGreaterThan(0);
  });

  it('defines preset profiles with expected performance-to-cinematic scaling', () => {
    const { performance, balanced, cinematic } = CHAMPION_VFX_CONFIG.presets;

    expect(performance.qSparkCount).toBeLessThan(balanced.qSparkCount);
    expect(balanced.qSparkCount).toBeLessThan(cinematic.qSparkCount);

    expect(performance.rBulletCount).toBeLessThan(balanced.rBulletCount);
    expect(balanced.rBulletCount).toBeLessThan(cinematic.rBulletCount);

    expect(performance.effectTtlMultiplier).toBeLessThanOrEqual(1);
    expect(cinematic.effectTtlMultiplier).toBeGreaterThanOrEqual(1);
  });
});
