import type { SoundEvent } from '@/components/providers/SoundProvider';

export type SoundPack = 'default' | 'lofi' | 'nature' | 'silent';

export interface SoundPackDef {
  key: SoundPack;
  label: string;
  description: string;
  emoji: string;
  overrides: Partial<Record<SoundEvent, string>>;
}

export const SOUND_PACKS: Record<SoundPack, SoundPackDef> = {
  default: {
    key: 'default',
    label: 'Standard',
    description: 'Die originalen INNIS Sounds',
    emoji: '🔊',
    overrides: {},
  },
  lofi: {
    key: 'lofi',
    label: 'Lo-Fi',
    description: 'Weiche, gedämpfte Töne',
    emoji: '🎵',
    overrides: {
      'task-completed': 'lofi/task-done.mp3',
      pop: 'lofi/pop.mp3',
      click: 'lofi/click.mp3',
      'goal-completed': 'lofi/goal-done.mp3',
      'streak-milestone': 'lofi/milestone.mp3',
    },
  },
  nature: {
    key: 'nature',
    label: 'Natur',
    description: 'Organische Naturklänge',
    emoji: '🌿',
    overrides: {
      'task-completed': 'nature/chime.mp3',
      pop: 'nature/drop.mp3',
      click: 'nature/leaf.mp3',
      'goal-completed': 'nature/birds.mp3',
      'streak-milestone': 'nature/wind.mp3',
      error: 'nature/thud.mp3',
    },
  },
  silent: {
    key: 'silent',
    label: 'Silent',
    description: 'Keine Sounds',
    emoji: '🔇',
    overrides: {},
  },
};

const VALID_PACKS = new Set<string>(Object.keys(SOUND_PACKS));

export function isValidSoundPack(v: unknown): v is SoundPack {
  return typeof v === 'string' && VALID_PACKS.has(v);
}

export function resolvePackSoundPath(
  pack: SoundPack,
  event: SoundEvent
): string | null {
  if (pack === 'default' || pack === 'silent') return null;
  const override = SOUND_PACKS[pack].overrides[event];
  return override ? `/sounds/${override}` : null;
}
