import { describe, expect, it } from 'vitest';
import { resolveSampleSrcForEvent } from '@/components/providers/SoundProvider';

describe('sound sample resolution', () => {
  it('uses teams kit samples for notification, swoosh and click', () => {
    expect(resolveSampleSrcForEvent('pop', 'teams-default')).toBe('/sounds/teams-default.mp3');
    expect(resolveSampleSrcForEvent('swoosh', 'teams-default')).toBe('/sounds/teams-swoosh.mp3');
    expect(resolveSampleSrcForEvent('click', 'teams-default')).toBe('/sounds/teams-click.mp3');
  });

  it('falls back to synth for classic preset', () => {
    expect(resolveSampleSrcForEvent('pop', 'classic')).toBeNull();
    expect(resolveSampleSrcForEvent('swoosh', 'classic')).toBeNull();
    expect(resolveSampleSrcForEvent('click', 'classic')).toBeNull();
  });

  it('does not map champion events to teams samples', () => {
    expect(resolveSampleSrcForEvent('champ-q', 'teams-default')).toBeNull();
    expect(resolveSampleSrcForEvent('champ-focus', 'teams-default')).toBeNull();
  });
});
