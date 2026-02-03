'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, memo } from 'react';
import { SkeletonCircle, Skeleton } from '@/components/ui';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showPercentage?: boolean;
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
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (displayPercentage / 100) * circumference;

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

  // Color based on percentage
  const getColor = () => {
    if (displayPercentage >= 80) return 'stroke-success';
    if (displayPercentage >= 50) return 'stroke-info';
    if (displayPercentage >= 25) return 'stroke-warning';
    return 'stroke-error';
  };

  const getGlowColor = () => {
    if (displayPercentage >= 80) return 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]';
    if (displayPercentage >= 50) return 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]';
    if (displayPercentage >= 25) return 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]';
    return 'drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]';
  };

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
            className={`${getColor()} ${getGlowColor()} transition-all duration-300`}
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
