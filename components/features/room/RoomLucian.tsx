'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { LucianSpriteAnimator, type LucianAnimation } from
  '@/components/features/lucian/LucianSpriteAnimator';
import type { RoomState } from '@/lib/room/roomState';
import type { LucianOutfit } from '@/lib/lucian/outfits';

interface RoomLucianProps {
  pose: RoomState['lucianPose'];
  size?: number | undefined;
  outfit?: LucianOutfit | undefined;
}

const POSE_TO_ANIMATION: Record<RoomState['lucianPose'], LucianAnimation> = {
  sleeping: 'meditate',
  idle: 'idle',
  working: 'idle',
  celebrating: 'victory',
};

export default function RoomLucian({ pose, size = 80, outfit }: RoomLucianProps) {
  const prefersReduced = useReducedMotion();
  const animation = POSE_TO_ANIMATION[pose];
  const shouldBob = !prefersReduced && (pose === 'idle' || pose === 'working');

  const sprite = <LucianSpriteAnimator animation={animation} size={size} outfit={outfit} />;

  if (shouldBob) {
    return (
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: size, height: size }}
      >
        {sprite}
      </motion.div>
    );
  }

  return <div style={{ width: size, height: size }}>{sprite}</div>;
}
