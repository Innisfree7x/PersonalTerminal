'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export type LucianAnimation = 'idle' | 'walk' | 'victory' | 'panic' | 'meditate';

const DEFAULT_SIZE = 72;
const SHEET_COLUMNS = 8;
const SHEET_ROWS = 10;
const SPRITE_SHEET_PATH = '/sprites/lucian-sprites-v2.svg';

interface LucianSpriteAnimatorProps {
  animation: LucianAnimation;
  size?: number;
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

export function LucianSpriteAnimator({ animation, size = DEFAULT_SIZE }: LucianSpriteAnimatorProps) {
  const [frame, setFrame] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const count = frameCount(animation);
    setFrame(0);
    if (prefersReducedMotion) return;

    const duration = frameDuration(animation);
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % count);
    }, duration);

    return () => clearInterval(interval);
  }, [animation, prefersReducedMotion]);

  const row = animationRow(animation);

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundImage: `url('${SPRITE_SHEET_PATH}')`,
        backgroundSize: `${SHEET_COLUMNS * size}px ${SHEET_ROWS * size}px`,
        backgroundPosition: `-${frame * size}px -${row * size}px`,
        imageRendering: 'pixelated',
        flexShrink: 0,
      }}
      aria-hidden="true"
    />
  );
}
