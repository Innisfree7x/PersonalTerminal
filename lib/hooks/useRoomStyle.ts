'use client';

import { useState, useEffect, useCallback } from 'react';

export type RoomStyle = 'cozy' | 'minimal' | 'neon' | 'library';

export interface RoomStyleDef {
  label: string;
  description: string;
  preview: string;
  wallColor: string;
  floorColor: string;
  deskColor: string;
  deskLegColor: string;
  shelfColor: string;
  shelfBracketColor: string;
  bookPalette: string[];
  monitorFrameColor: string;
  monitorScreenColor: string;
  monitorScreenGlow: string;
  monitorCodeLine1: string;
  monitorCodeLine2: string;
  ambientColor: string;
  ambientGlowOnWall: string | null;
  notebookColor: string;
  mugColor: string;
  windowTint: string | null;
  accentColor: string;
}

export const ROOM_STYLES: Record<RoomStyle, RoomStyleDef> = {
  cozy: {
    label: 'Cozy',
    description: 'Warm, holzig, gemütlich',
    preview: '🪵',
    wallColor: '#120d08',
    floorColor: '#0e0a06',
    deskColor: '#2d1a0a',
    deskLegColor: '#1e1006',
    shelfColor: '#2a1a0a',
    shelfBracketColor: '#3d2810',
    bookPalette: ['#92400e', '#78350f', '#7c2d12', '#a16207', '#854d0e'],
    monitorFrameColor: '#1c1008',
    monitorScreenColor: '#0a0804',
    monitorScreenGlow: 'rgba(180,83,9,0.15)',
    monitorCodeLine1: 'rgba(180,83,9,0.35)',
    monitorCodeLine2: 'rgba(120,53,15,0.25)',
    ambientColor: 'rgba(180,83,9,0.14)',
    ambientGlowOnWall: 'rgba(180,83,9,0.06)',
    notebookColor: '#2d1a0a',
    mugColor: '#3d2010',
    windowTint: 'rgba(120,53,15,0.08)',
    accentColor: '#b45309',
  },
  minimal: {
    label: 'Minimal',
    description: 'Clean, dunkel, fokussiert',
    preview: '◼',
    wallColor: '#0c0c14',
    floorColor: '#09090f',
    deskColor: '#12121e',
    deskLegColor: '#0d0d18',
    shelfColor: '#12121e',
    shelfBracketColor: '#1a1a28',
    bookPalette: ['#1e1b4b', '#1e3a5f', '#1a2e1a', '#2d1a3d', '#1a1a1a'],
    monitorFrameColor: '#0d0d18',
    monitorScreenColor: '#06060f',
    monitorScreenGlow: 'rgba(99,102,241,0.12)',
    monitorCodeLine1: 'rgba(99,102,241,0.25)',
    monitorCodeLine2: 'rgba(67,56,202,0.2)',
    ambientColor: 'rgba(99,102,241,0.07)',
    ambientGlowOnWall: null,
    notebookColor: '#12121e',
    mugColor: '#1a1a28',
    windowTint: null,
    accentColor: '#6366f1',
  },
  neon: {
    label: 'Neon',
    description: 'Cyberpunk, elektrisch',
    preview: '⚡',
    wallColor: '#04040f',
    floorColor: '#020208',
    deskColor: '#080820',
    deskLegColor: '#050514',
    shelfColor: '#060618',
    shelfBracketColor: '#0c0c28',
    bookPalette: ['#0e7490', '#0c4a6e', '#4c1d95', '#06402b', '#7c2d12'],
    monitorFrameColor: '#060618',
    monitorScreenColor: '#030310',
    monitorScreenGlow: 'rgba(6,182,212,0.25)',
    monitorCodeLine1: 'rgba(6,182,212,0.4)',
    monitorCodeLine2: 'rgba(139,92,246,0.3)',
    ambientColor: 'rgba(6,182,212,0.1)',
    ambientGlowOnWall: 'rgba(6,182,212,0.08)',
    notebookColor: '#0c0c28',
    mugColor: '#0e0e30',
    windowTint: 'rgba(6,182,212,0.06)',
    accentColor: '#06b6d4',
  },
  library: {
    label: 'Library',
    description: 'Akademisch, klassisch',
    preview: '📚',
    wallColor: '#0a0c0a',
    floorColor: '#080a06',
    deskColor: '#1a1206',
    deskLegColor: '#120d04',
    shelfColor: '#1e1608',
    shelfBracketColor: '#2d2010',
    bookPalette: ['#14532d', '#1e3a5f', '#78350f', '#3b1f12', '#1a2e1a'],
    monitorFrameColor: '#140e04',
    monitorScreenColor: '#080a06',
    monitorScreenGlow: 'rgba(4,120,87,0.15)',
    monitorCodeLine1: 'rgba(4,120,87,0.3)',
    monitorCodeLine2: 'rgba(16,85,30,0.2)',
    ambientColor: 'rgba(4,120,87,0.1)',
    ambientGlowOnWall: 'rgba(4,120,87,0.06)',
    notebookColor: '#1a1206',
    mugColor: '#2d1a08',
    windowTint: 'rgba(4,120,87,0.04)',
    accentColor: '#047857',
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
