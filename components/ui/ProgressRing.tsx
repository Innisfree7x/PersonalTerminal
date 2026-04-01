'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ProgressRingProps {
  /** Completion value (0-100) */
  value: number;
  /** Diameter in pixels (default: 40) */
  size?: number;
  /** Stroke width (default: 3.5) */
  strokeWidth?: number;
  /** Ring color — Tailwind color value or CSS color */
  color?: string;
  /** Track color (default: subtle white) */
  trackColor?: string;
  /** Content rendered inside the ring (e.g. icon or number) */
  children?: React.ReactNode;
  /** Additional className on the wrapper */
  className?: string;
}

/**
 * Compact progress ring for inline use (sidebar, cards, status strips).
 * Animated fill via Framer Motion. Theme-aware defaults.
 */
export const ProgressRing = memo(function ProgressRing({
  value,
  size = 40,
  strokeWidth = 3.5,
  color = 'rgb(var(--primary))',
  trackColor = 'rgb(255 255 255 / 0.08)',
  children,
  className,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = useMemo(
    () => circumference - (clamped / 100) * circumference,
    [clamped, circumference]
  );

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        />
      </svg>
      {children ? (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      ) : null}
    </div>
  );
});
