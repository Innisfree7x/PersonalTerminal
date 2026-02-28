export type ChampionAbilityKey = 'q' | 'w' | 'e' | 'r';
export type ChampionCastAnimation = 'cast_q' | 'cast_w' | 'cast_e' | 'cast_r';
export type ChampionReactionAnimation = 'victory' | 'recall' | 'cast_r' | 'panic' | 'meditate';

export interface ChampionVfxConfig {
  abilityCooldownSeconds: Record<ChampionAbilityKey, number>;
  castAnimations: Record<ChampionAbilityKey, ChampionCastAnimation>;
  castAnimationLockMs: Record<ChampionAbilityKey, number>;
  reactionAnimationDurationMs: Record<ChampionReactionAnimation, number>;
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
};
