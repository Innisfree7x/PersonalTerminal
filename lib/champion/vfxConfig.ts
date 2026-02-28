export type ChampionAbilityKey = 'q' | 'w' | 'e' | 'r';
export type ChampionCastAnimation = 'cast_q' | 'cast_w' | 'cast_e' | 'cast_r';
export type ChampionReactionAnimation = 'victory' | 'recall' | 'cast_r' | 'panic' | 'meditate';
export type ChampionVfxPreset = 'performance' | 'balanced' | 'cinematic';

export interface ChampionVfxPresetProfile {
  label: string;
  effectTtlMultiplier: number;
  qSparkCount: number;
  dashGhostCount: number;
  rBulletCount: number;
  auraOpacityMultiplier: number;
  auraScaleMultiplier: number;
  ambientAbilityFlashes: boolean;
  showSecondaryHalo: boolean;
}

export interface ChampionVfxConfig {
  abilityCooldownSeconds: Record<ChampionAbilityKey, number>;
  castAnimations: Record<ChampionAbilityKey, ChampionCastAnimation>;
  castAnimationLockMs: Record<ChampionAbilityKey, number>;
  reactionAnimationDurationMs: Record<ChampionReactionAnimation, number>;
  presets: Record<ChampionVfxPreset, ChampionVfxPresetProfile>;
}

/**
 * Canonical Lucian VFX timing contract consumed by Core and UI layers.
 * UI can style around this contract, but should not mutate state transitions.
 */
export const CHAMPION_VFX_CONFIG: ChampionVfxConfig = {
  abilityCooldownSeconds: {
    q: 8,
    w: 15,
    e: 5,
    r: 60,
  },
  castAnimations: {
    q: 'cast_q',
    w: 'cast_w',
    e: 'cast_e',
    r: 'cast_r',
  },
  castAnimationLockMs: {
    q: 320,
    w: 320,
    e: 220,
    r: 1000,
  },
  reactionAnimationDurationMs: {
    victory: 900,
    recall: 900,
    cast_r: 700,
    panic: 900,
    meditate: 1200,
  },
  presets: {
    performance: {
      label: 'Performance',
      effectTtlMultiplier: 0.75,
      qSparkCount: 3,
      dashGhostCount: 2,
      rBulletCount: 16,
      auraOpacityMultiplier: 0.65,
      auraScaleMultiplier: 0.92,
      ambientAbilityFlashes: false,
      showSecondaryHalo: false,
    },
    balanced: {
      label: 'Balanced',
      effectTtlMultiplier: 1,
      qSparkCount: 6,
      dashGhostCount: 4,
      rBulletCount: 30,
      auraOpacityMultiplier: 1,
      auraScaleMultiplier: 1,
      ambientAbilityFlashes: true,
      showSecondaryHalo: true,
    },
    cinematic: {
      label: 'Cinematic',
      effectTtlMultiplier: 1.2,
      qSparkCount: 9,
      dashGhostCount: 6,
      rBulletCount: 40,
      auraOpacityMultiplier: 1.2,
      auraScaleMultiplier: 1.08,
      ambientAbilityFlashes: true,
      showSecondaryHalo: true,
    },
  },
};
