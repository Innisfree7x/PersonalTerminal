'use client';

import { useEffect, useState } from 'react';

export type LucianAnimation = 'idle' | 'walk' | 'victory' | 'panic' | 'meditate';

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

export function LucianSpriteAnimator({ animation, size = 64 }: LucianSpriteAnimatorProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const count = frameCount(animation);
    const duration = frameDuration(animation);
    setFrame(0);

    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % count);
    }, duration);

    return () => clearInterval(interval);
  }, [animation]);

  const row = animationRow(animation);

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundImage: `url('/sprites/lucian-sprites.svg')`,
        backgroundSize: `${8 * size}px ${10 * size}px`,
        backgroundPosition: `-${frame * size}px -${row * size}px`,
        imageRendering: 'pixelated',
        flexShrink: 0,
      }}
      aria-hidden="true"
    />
  );
}
