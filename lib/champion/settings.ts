import type { ChampionId } from '@/lib/champion/config';
import type { ChampionVfxPreset } from '@/lib/champion/vfxConfig';

export type ChampionScale = 'small' | 'normal' | 'large';
export type EventReactionMode = 'all' | 'none';
export type PassiveBehavior = 'active' | 'idle-only';

export interface ChampionSettings {
  enabled: boolean;
  champion: ChampionId;
  vfxPreset: ChampionVfxPreset;
  renderScale: ChampionScale;
  passiveBehavior: PassiveBehavior;
  eventReactions: EventReactionMode;
  rangeRadius: number;
  showCooldowns: boolean;
  soundsEnabled: boolean;
}

export const DEFAULT_CHAMPION_SETTINGS: ChampionSettings = {
  enabled: true,
  champion: 'lucian',
  vfxPreset: 'balanced',
  renderScale: 'normal',
  passiveBehavior: 'active',
  eventReactions: 'all',
  rangeRadius: 300,
  showCooldowns: true,
  soundsEnabled: true,
};

function isChampionId(value: unknown): value is ChampionId {
  return value === 'lucian' || value === 'aphelios';
}

function isChampionScale(value: unknown): value is ChampionScale {
  return value === 'small' || value === 'normal' || value === 'large';
}

function isPassiveBehavior(value: unknown): value is PassiveBehavior {
  return value === 'active' || value === 'idle-only';
}

function isEventReactionMode(value: unknown): value is EventReactionMode {
  return value === 'all' || value === 'none';
}

function isChampionVfxPreset(value: unknown): value is ChampionVfxPreset {
  return value === 'performance' || value === 'balanced' || value === 'cinematic';
}

function sanitizeRangeRadius(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_CHAMPION_SETTINGS.rangeRadius;
  }
  return Math.min(500, Math.max(180, Math.round(value / 10) * 10));
}

export function sanitizeChampionSettings(raw: Partial<ChampionSettings> | null | undefined): ChampionSettings {
  return {
    enabled:
      typeof raw?.enabled === 'boolean'
        ? raw.enabled
        : DEFAULT_CHAMPION_SETTINGS.enabled,
    champion: isChampionId(raw?.champion)
      ? raw.champion
      : DEFAULT_CHAMPION_SETTINGS.champion,
    vfxPreset: isChampionVfxPreset(raw?.vfxPreset)
      ? raw.vfxPreset
      : DEFAULT_CHAMPION_SETTINGS.vfxPreset,
    renderScale: isChampionScale(raw?.renderScale)
      ? raw.renderScale
      : DEFAULT_CHAMPION_SETTINGS.renderScale,
    passiveBehavior: isPassiveBehavior(raw?.passiveBehavior)
      ? raw.passiveBehavior
      : DEFAULT_CHAMPION_SETTINGS.passiveBehavior,
    eventReactions: isEventReactionMode(raw?.eventReactions)
      ? raw.eventReactions
      : DEFAULT_CHAMPION_SETTINGS.eventReactions,
    rangeRadius: sanitizeRangeRadius(raw?.rangeRadius),
    showCooldowns:
      typeof raw?.showCooldowns === 'boolean'
        ? raw.showCooldowns
        : DEFAULT_CHAMPION_SETTINGS.showCooldowns,
    soundsEnabled:
      typeof raw?.soundsEnabled === 'boolean'
        ? raw.soundsEnabled
        : DEFAULT_CHAMPION_SETTINGS.soundsEnabled,
  };
}
