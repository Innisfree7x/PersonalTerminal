'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAnimationSuspended } from '@/lib/hooks/usePageVisibility';
import { OUTFITS, type LucianOutfit } from '@/lib/lucian/outfits';

export type LucianAnimation = 'idle' | 'walk' | 'victory' | 'panic' | 'meditate';

const DEFAULT_SIZE = 72;
const SHEET_COLUMNS = 8;
const SHEET_ROWS = 10;
const SPRITE_SHEET_PATH = '/sprites/lucian-sprites-v3.svg';

interface LucianSpriteAnimatorProps {
  animation: LucianAnimation;
  size?: number | undefined;
  outfit?: LucianOutfit | undefined;
}

function animationRow(animation: LucianAnimation): number {
  switch (animation) {
    case 'idle':     return 0;
    case 'walk':     return 1;
    case 'victory':  return 6;
    case 'panic':    return 7;
    case 'meditate': return 8;
    default:         return 0;
  }
}

function frameCount(animation: LucianAnimation): number {
  switch (animation) {
    case 'walk':
    case 'victory': return 6;
    default:        return 4;
  }
}

function frameDuration(animation: LucianAnimation): number {
  switch (animation) {
    case 'walk':     return 100;
    case 'victory':
    case 'panic':    return 150;
    case 'meditate': return 200;
    default:         return 200;
  }
}

export function LucianSpriteAnimator({ animation, size = DEFAULT_SIZE, outfit }: LucianSpriteAnimatorProps) {
  const [frame, setFrame] = useState(0);
  const animationsSuspended = useAnimationSuspended();
  const [sheetPath, setSheetPath] = useState(SPRITE_SHEET_PATH);

  useEffect(() => {
    if (!outfit || outfit === 'default') {
      setSheetPath(SPRITE_SHEET_PATH);
      return;
    }
    const def = OUTFITS[outfit];
    if (!def) {
      setSheetPath(SPRITE_SHEET_PATH);
      return;
    }
    setSheetPath(def.spriteSheet);
  }, [outfit]);

  const handleImageError = useCallback(() => {
    setSheetPath(SPRITE_SHEET_PATH);
  }, []);

  // Preload outfit sprite sheet to detect load errors
  useEffect(() => {
    if (sheetPath === SPRITE_SHEET_PATH) return;
    const img = new Image();
    img.onerror = handleImageError;
    img.src = sheetPath;
  }, [sheetPath, handleImageError]);

  useEffect(() => {
    const count = frameCount(animation);
    setFrame(0);
    if (animationsSuspended) return;

    const duration = frameDuration(animation);
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % count);
    }, duration);

    return () => clearInterval(interval);
  }, [animation, animationsSuspended]);

  const row = animationRow(animation);

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundImage: `url('${sheetPath}')`,
        backgroundSize: `${SHEET_COLUMNS * size}px ${SHEET_ROWS * size}px`,
        backgroundPosition: `-${frame * size}px -${row * size}px`,
        imageRendering: 'pixelated',
        flexShrink: 0,
      }}
      aria-hidden="true"
    />
  );
}
