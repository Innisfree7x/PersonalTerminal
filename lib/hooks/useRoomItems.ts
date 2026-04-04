'use client';

import { useMemo } from 'react';
import { useAchievements } from '@/lib/hooks/useAchievements';
import type { ActiveRoomItems } from '@/lib/room/roomState';

export function useRoomItems(): ActiveRoomItems {
  const { unlockedKeys } = useAchievements();

  return useMemo(() => {
    const keys = new Set(unlockedKeys);
    return {
      hasLegendaryFlameStand: keys.has('hundred_streak'),
      hasFullBookshelf: keys.has('five_modules'),
      hasDeskPlantLarge: keys.has('trajectory_green'),
    };
  }, [unlockedKeys]);
}
