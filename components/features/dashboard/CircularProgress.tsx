'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, memo, useMemo } from 'react';
import { SkeletonCircle, Skeleton } from '@/components/ui';
import { getPercentageColor, getPercentageGlow } from '@/lib/utils/colors';

/**
 * Circular progress indicator with animated percentage display
 * Apple Watch-style progress ring with color coding based on completion
 * 
 * @component
 * @example
 * <CircularProgress 
 *   percentage={85} 
 *   label="Today's Completion"
 *   size={120}
 * />
 */
interface CircularProgressProps {
  /** Completion percentage (0-100) */
  percentage: number;
  /** Diameter of the circle in pixels (default: 120) */
  size?: number;
  /** Width of the progress stroke (default: 8) */
  strokeWidth?: number;
  /** Text label below the circle */
  label?: string;
  /** Show percentage number in center (default: true) */
  showPercentage?: boolean;
  /** Show loading skeleton (default: false) */
  isLoading?: boolean;
}

const CircularProgress = memo(function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 8,
  label = 'Completion',
  showPercentage = true,
  isLoading = false,
}: CircularProgressProps) {
  const [displayPercentage, setDisplayPercentage] = useState(0);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3">
        <SkeletonCircle size={size} />
        {label && <Skeleton className="h-4 w-24" />}
      </div>
    );
  }
  
  // Memoized calculations (prevents recalculation on every render)
  const radius = useMemo(() => (size - strokeWidth) / 2, [size, strokeWidth]);
  const circumference = useMemo(() => radius * 2 * Math.PI, [radius]);
  const offset = useMemo(
    () => circumference - (displayPercentage / 100) * circumference,
    [circumference, displayPercentage]
  );

  // Animate percentage counting up
  useEffect(() => {
    let start = 0;
    const end = percentage;
    const duration = 1500; // 1.5 seconds
    const increment = end / (duration / 16); // 60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayPercentage(end);
        clearInterval(timer);
      } else {
        setDisplayPercentage(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [percentage]);

  // Memoized color calculations using centralized utility
  const color = useMemo(() => getPercentageColor(displayPercentage), [displayPercentage]);
  const glowColor = useMemo(() => getPercentageGlow(displayPercentage), [displayPercentage]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-surface-hover"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            className={`${color} ${glowColor} transition-all duration-300`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{
              duration: 1.5,
              ease: [0.4, 0, 0.2, 1],
            }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showPercentage && (
            <motion.span
              className="text-3xl font-bold text-text-primary"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {displayPercentage}%
            </motion.span>
          )}
        </div>
      </div>

      {/* Label */}
      {label && (
        <motion.p
          className="text-sm font-medium text-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {label}
        </motion.p>
      )}
    </div>
  );
});

export default CircularProgress;
