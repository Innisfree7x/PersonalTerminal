'use client';

import { useAppSound } from '@/lib/hooks/useAppSound';

export function useSoundPack() {
  const { settings, setSoundPack } = useAppSound();
  return { soundPack: settings.soundPack, setSoundPack };
}
