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
});
