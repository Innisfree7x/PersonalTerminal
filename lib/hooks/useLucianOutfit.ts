'use client';

import { useState, useEffect, useCallback } from 'react';
import { OUTFITS, isValidOutfit, getAvailableOutfits, type LucianOutfit, type OutfitDef } from '@/lib/lucian/outfits';
import { useAchievements } from '@/lib/hooks/useAchievements';

const STORAGE_KEY = 'innis:lucian-outfit:v1';

export function useLucianOutfit() {
  const { unlockedKeys } = useAchievements();
  const [outfit, setOutfitState] = useState<LucianOutfit>('default');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && isValidOutfit(stored)) {
        setOutfitState(stored);
      }
    } catch { /* ignore */ }
  }, []);

  const availableOutfits: OutfitDef[] = getAvailableOutfits(unlockedKeys);
  const allOutfits: OutfitDef[] = Object.values(OUTFITS);

  const setOutfit = useCallback((next: LucianOutfit) => {
    setOutfitState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch { /* quota */ }
  }, []);

  return { outfit, setOutfit, availableOutfits, allOutfits };
}
