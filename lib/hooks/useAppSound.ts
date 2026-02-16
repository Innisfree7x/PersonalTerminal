'use client';

import { useContext } from 'react';
import { SoundContext, SoundContextType } from '@/components/providers/SoundProvider';

export function useAppSound(): SoundContextType {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error('useAppSound must be used within SoundProvider');
  return ctx;
}
