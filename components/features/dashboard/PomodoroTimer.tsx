'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';
import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { SkeletonCircle, Skeleton } from '@/components/ui';

/**
 * Pomodoro technique timer widget with work/break cycles
 * Features circular progress display, play/pause controls, and session tracking
 * 
 * @component
 * @example
 * <PomodoroTimer 
 *   workDuration={25}
 *   breakDuration={5}
 * />
 */
interface PomodoroTimerProps {
  /** Work session duration in minutes (default: 25, min: 1, max: 60) */
  workDuration?: number;
  /** Break session duration in minutes (default: 5, min: 1, max: 30) */
  breakDuration?: number;
  /** Show loading skeleton (default: false) */
  isLoading?: boolean;
}

/**
 * Validate and clamp Pomodoro duration to acceptable range
 * Prevents invalid or extreme values from breaking the timer
 */
function validateDuration(duration: number, min: number, max: number, defaultValue: number): number {
  // Handle invalid numbers (NaN, Infinity, etc.)
  if (!Number.isFinite(duration)) {
    console.warn(`Invalid Pomodoro duration: ${duration}. Using default: ${defaultValue}`);
    return defaultValue;
  }
  
  // Clamp to acceptable range
  if (duration < min) {
    console.warn(`Pomodoro duration ${duration} below minimum ${min}. Using ${min}.`);
    return min;
  }
  
  if (duration > max) {
    console.warn(`Pomodoro duration ${duration} above maximum ${max}. Using ${max}.`);
    return max;
  }
  
  return Math.round(duration); // Ensure integer value
}

const PomodoroTimer = memo(function PomodoroTimer({ 
  workDuration: rawWorkDuration = 25, 
  breakDuration: rawBreakDuration = 5,
  isLoading = false,
}: PomodoroTimerProps) {
  // Validate input durations
  const workDuration = validateDuration(rawWorkDuration, 1, 60, 25);
  const breakDuration = validateDuration(rawBreakDuration, 1, 30, 5);
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS!
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(workDuration * 60); // in seconds
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalTime = isBreak ? breakDuration * 60 : workDuration * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer finished
      if (!isBreak) {
        setCompletedPomodoros((prev) => prev + 1);
      }
      setIsRunning(false);
      // Auto-switch to break or work
      setIsBreak(!isBreak);
      setTimeLeft(isBreak ? workDuration * 60 : breakDuration * 60);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, isBreak, workDuration, breakDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Memoized event handlers (prevents function recreation on every render)
  const handlePlayPause = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(isBreak ? breakDuration * 60 : workDuration * 60);
  }, [isBreak, breakDuration, workDuration]);

  const handleToggleMode = useCallback(() => {
    setIsRunning(false);
    setIsBreak((prev) => !prev);
    setTimeLeft(isBreak ? workDuration * 60 : breakDuration * 60);
  }, [isBreak, workDuration, breakDuration]);

  // Loading state - conditional RENDERING after all hooks!
  if (isLoading) {
    return (
      <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-warning" />
            <h3 className="text-base font-semibold text-text-primary">Pomodoro</h3>
          </div>
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
        <div className="flex flex-col items-center gap-4 mb-4">
          <SkeletonCircle size={128} />
        </div>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <Skeleton className="w-12 h-12 rounded-full" />
        </div>
        <div className="flex items-center justify-center gap-1 pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-8 h-8 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Coffee className="w-5 h-5 text-warning" />
          <h3 className="text-base font-semibold text-text-primary">Pomodoro</h3>
        </div>
        <button
          onClick={handleToggleMode}
          className="text-xs px-2 py-1 rounded-md bg-surface-hover hover:bg-primary/20 text-text-secondary hover:text-primary transition-colors"
          aria-label={`Switch to ${isBreak ? 'work' : 'break'} mode`}
        >
          {isBreak ? '☕ Break' : '🍅 Work'}
        </button>
      </div>

      {/* Timer display */}
      <div 
        className="relative mb-6"
        role="timer"
        aria-label={`${isBreak ? 'Break' : 'Work'} timer: ${formatTime(timeLeft)} remaining`}
        aria-live="polite"
      >
        {/* Background circle */}
        <svg className="w-full h-32" viewBox="0 0 100 100" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-surface-hover"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className={isBreak ? 'text-success' : 'text-primary'}
            style={{
              strokeDasharray: `${2 * Math.PI * 45}`,
              strokeDashoffset: `${2 * Math.PI * 45 * (1 - progress / 100)}`,
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
            }}
            initial={false}
            animate={{
              strokeDashoffset: `${2 * Math.PI * 45 * (1 - progress / 100)}`,
            }}
            transition={{ duration: 0.3 }}
          />
        </svg>

        {/* Time text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-3xl font-bold text-text-primary font-mono"
            key={timeLeft}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {formatTime(timeLeft)}
          </motion.span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <motion.button
          onClick={handlePlayPause}
          className={`p-3 rounded-full ${
            isRunning ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
          } hover:scale-110 transition-all`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
        >
          {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </motion.button>

        <motion.button
          onClick={handleReset}
          className="p-3 rounded-full bg-surface-hover text-text-secondary hover:bg-error/20 hover:text-error transition-all"
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Reset timer to initial duration"
        >
          <RotateCcw className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Completed pomodoros */}
      <div className="flex items-center justify-center gap-1 pb-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <motion.div
            key={index}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
              index < completedPomodoros
                ? 'bg-primary/20 border-2 border-primary'
                : 'bg-surface-hover border-2 border-border'
            }`}
            initial={false}
            animate={
              index === completedPomodoros - 1
                ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }
                : {}
            }
            transition={{ duration: 0.5 }}
          >
            {index < completedPomodoros ? '🍅' : ''}
          </motion.div>
        ))}
      </div>
      <p className="text-xs text-center text-text-tertiary">
        {completedPomodoros}/4 sessions today
      </p>
    </div>
  );
});

export default PomodoroTimer;
