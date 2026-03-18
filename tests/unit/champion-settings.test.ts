import { describe, expect, it } from 'vitest';
import { DEFAULT_CHAMPION_SETTINGS, sanitizeChampionSettings } from '@/lib/champion/settings';

describe('sanitizeChampionSettings', () => {
  it('falls back to safe defaults for invalid persisted values', () => {
    const settings = sanitizeChampionSettings({
      champion: 'broken' as never,
      renderScale: 'huge' as never,
      passiveBehavior: 'sleep' as never,
      eventReactions: 'partial' as never,
      vfxPreset: 'ultra' as never,
      rangeRadius: 9999,
      showCooldowns: 'yes' as never,
    });

    expect(settings).toEqual({
      ...DEFAULT_CHAMPION_SETTINGS,
      rangeRadius: 500,
    });
  });

  it('preserves valid user settings', () => {
    const settings = sanitizeChampionSettings({
      enabled: false,
      champion: 'aphelios',
      renderScale: 'large',
      passiveBehavior: 'idle-only',
      eventReactions: 'none',
      vfxPreset: 'cinematic',
      rangeRadius: 420,
      showCooldowns: false,
      soundsEnabled: false,
    });

    expect(settings).toEqual({
      enabled: false,
      champion: 'aphelios',
      renderScale: 'large',
      passiveBehavior: 'idle-only',
      eventReactions: 'none',
      vfxPreset: 'cinematic',
      rangeRadius: 420,
      showCooldowns: false,
      soundsEnabled: false,
    });
  });
});
