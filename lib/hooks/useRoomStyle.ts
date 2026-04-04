'use client';

import { useState, useEffect, useCallback } from 'react';

export type RoomStyle = 'cozy' | 'minimal' | 'neon' | 'library';

export interface RoomStyleDef {
  label: string;
  description: string;
  wallColor: string;
  floorColor: string;
  accentColor: string;
  preview: string;
}

export const ROOM_STYLES: Record<RoomStyle, RoomStyleDef> = {
  cozy: {
    label: 'Cozy',
    description: 'Warm, holzig, gemütlich',
    wallColor: '#12100a',
    floorColor: '#0e0c08',
    accentColor: '#b45309',
    preview: '🪵',
  },
  minimal: {
    label: 'Minimal',
    description: 'Clean, dunkel, fokussiert',
    wallColor: '#0d0d12',
    floorColor: '#0b0b14',
    accentColor: '#6366f1',
    preview: '◼',
  },
  neon: {
    label: 'Neon',
    description: 'Cyberpunk, elektrisch',
    wallColor: '#050510',
    floorColor: '#030308',
    accentColor: '#06b6d4',
    preview: '⚡',
  },
  library: {
    label: 'Library',
    description: 'Akademisch, klassisch',
    wallColor: '#0a0c10',
    floorColor: '#080a0d',
    accentColor: '#047857',
    preview: '📚',
  },
};

const STORAGE_KEY = 'innis:room-style:v1';
const VALID_STYLES = new Set<string>(Object.keys(ROOM_STYLES));

function applyStyleVars(style: RoomStyle) {
  const def = ROOM_STYLES[style];
  const root = document.documentElement;
  root.style.setProperty('--room-wall', def.wallColor);
  root.style.setProperty('--room-floor', def.floorColor);
  root.style.setProperty('--room-accent', def.accentColor);
}

export function useRoomStyle() {
  const [style, setStyleState] = useState<RoomStyle>('minimal');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && VALID_STYLES.has(stored)) {
        const validated = stored as RoomStyle;
        setStyleState(validated);
        applyStyleVars(validated);
      } else {
        applyStyleVars('minimal');
      }
    } catch {
      applyStyleVars('minimal');
    }
  }, []);

  const setStyle = useCallback((next: RoomStyle) => {
    setStyleState(next);
    applyStyleVars(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch { /* quota */ }
  }, []);

  return { style, setStyle };
}
