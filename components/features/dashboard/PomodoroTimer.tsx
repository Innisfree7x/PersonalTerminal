'use client';

import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';
import { memo, useState } from 'react';
import { SkeletonCircle, Skeleton } from '@/components/ui';
import { useFocusTimer } from '@/components/providers/FocusTimerProvider';

const DURATIONS = [25, 50, 90] as const;
type Duration = (typeof DURATIONS)[number];

interface PomodoroTimerProps {
  isLoading?: boolean;
}

const PomodoroTimer = memo(function PomodoroTimer({ isLoading = false }: PomodoroTimerProps) {
  const {
    status,
    timeLeft,
    totalTime,
    sessionType,
    completedPomodoros,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
  } = useFocusTimer();

  const [selectedDuration, setSelectedDuration] = useState<Duration>(25);

  const isIdle = status === 'idle';
  const isRunning = status === 'running' || status === 'break';
  const isBreak = sessionType === 'break';

  // When idle, show the selected duration as the "ready" state
  const displayTime = isIdle ? selectedDuration * 60 : timeLeft;
  const safeTotal = totalTime > 0 ? totalTime : selectedDuration * 60;
  const progress = totalTime > 0 ? ((safeTotal - timeLeft) / safeTotal) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (status === 'idle') {
      startTimer({ duration: selectedDuration });
    } else if (status === 'running') {
      pauseTimer();
    } else if (status === 'paused') {
      resumeTimer();
    } else if (status === 'break') {
      pauseTimer();
    } else if (status === 'break_paused') {
      resumeTimer();
    }
  };

  if (isLoading) {
    return (
      <div className="card-surface rounded-xl p-4">
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
    <div className="card-surface rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Coffee className="w-5 h-5 text-warning" />
          <h3 className="text-base font-semibold text-text-primary">Pomodoro</h3>
        </div>
        <span className="text-xs px-2 py-1 rounded-md bg-surface-hover text-text-secondary">
          {isBreak ? '☕ Break' : '🍅 Focus'}
        </span>
      </div>

      {/* Duration selector — only shown when idle */}
      {isIdle && (
        <div className="flex items-center justify-center gap-1.5 mb-3">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDuration(d)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedDuration === d
                  ? 'bg-primary text-white'
                  : 'bg-surface-hover text-text-secondary hover:text-text-primary'
              }`}
            >
              {d}m
            </button>
          ))}
        </div>
      )}

      {/* Timer display */}
      <div
        className="relative mb-6"
        role="timer"
        aria-label={`${isBreak ? 'Break' : 'Focus'} timer: ${formatTime(displayTime)} remaining`}
        aria-live="polite"
      >
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

        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-3xl font-bold text-text-primary font-mono"
            key={displayTime}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {formatTime(displayTime)}
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
          onClick={stopTimer}
          className="p-3 rounded-full bg-surface-hover text-text-secondary hover:bg-error/20 hover:text-error transition-all disabled:opacity-30 disabled:pointer-events-none"
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Stop and reset timer"
          disabled={status === 'idle'}
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
        {completedPomodoros}/4 sessions · sessions are saved automatically
      </p>
    </div>
  );
});

export default PomodoroTimer;
