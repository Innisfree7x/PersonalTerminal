'use client';

import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { useMemo } from 'react';

export interface MomentumPulseProps {
  score: number;
  trend: 'up' | 'flat' | 'down';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

type BucketTone = {
  stroke: string;
  ring: string;
  glow: string;
  textAccent: string;
};

function bucketFor(score: number): BucketTone {
  if (score >= 70) {
    return {
      stroke: '#38bdf8',
      ring: 'rgba(56, 189, 248, 0.15)',
      glow: 'rgba(56, 189, 248, 0.28)',
      textAccent: 'text-sky-200',
    };
  }
  if (score >= 40) {
    return {
      stroke: '#fbbf24',
      ring: 'rgba(251, 191, 36, 0.15)',
      glow: 'rgba(251, 191, 36, 0.22)',
      textAccent: 'text-amber-200',
    };
  }
  return {
    stroke: '#f87171',
    ring: 'rgba(248, 113, 113, 0.15)',
    glow: 'rgba(248, 113, 113, 0.22)',
    textAccent: 'text-rose-200',
  };
}

const SIZE_PX: Record<NonNullable<MomentumPulseProps['size']>, number> = {
  sm: 140,
  md: 180,
  lg: 220,
};

export default function MomentumPulse({
  score,
  trend,
  label = 'Momentum',
  size = 'md',
}: MomentumPulseProps) {
  const px = SIZE_PX[size];
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const tone = useMemo(() => bucketFor(clamped), [clamped]);

  const strokeWidth = size === 'sm' ? 10 : size === 'lg' ? 16 : 12;
  const radius = (px - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (clamped / 100) * circumference;

  const trendIcon =
    trend === 'up' ? (
      <ArrowUp className="h-3.5 w-3.5 text-emerald-300" />
    ) : trend === 'down' ? (
      <ArrowDown className="h-3.5 w-3.5 text-rose-300" />
    ) : (
      <Minus className="h-3.5 w-3.5 text-text-tertiary" />
    );

  const trendLabel = trend === 'up' ? 'steigend' : trend === 'down' ? 'fallend' : 'stabil';

  return (
    <motion.div
      className="card-surface relative flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] px-5 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.05)]"
      animate={{ scale: [1, 1.015, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      data-testid="momentum-pulse"
      role="img"
      aria-label={`${label}: ${clamped} von 100, Trend ${trendLabel}`}
      style={{ width: px + 40 }}
    >
      <div className="relative" style={{ width: px, height: px }}>
        <svg
          width={px}
          height={px}
          viewBox={`0 0 ${px} ${px}`}
          className="-rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={px / 2}
            cy={px / 2}
            r={radius}
            stroke={tone.ring}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <motion.circle
            cx={px / 2}
            cy={px / 2}
            r={radius}
            stroke={tone.stroke}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - filled }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              filter: `drop-shadow(0 0 8px ${tone.glow})`,
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`text-4xl font-bold tabular-nums ${tone.textAccent}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
          >
            {clamped}
          </motion.span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.24em] text-text-tertiary">
            {label}
          </span>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-text-secondary">
            {trendIcon}
            <span className="tabular-nums">{trendLabel}</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}
