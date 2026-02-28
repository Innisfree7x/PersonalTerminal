'use client';

import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';
import { memo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui';
import { useFocusTimer } from '@/components/providers/FocusTimerProvider';
import { trackAppEvent } from '@/lib/analytics/client';

const DURATIONS = [25, 50, 90] as const;

interface PomodoroTimerProps {
  isLoading?: boolean;
}

const PomodoroTimer = memo(function PomodoroTimer({ isLoading = false }: PomodoroTimerProps) {
  const router = useRouter();
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

  const [selectedDuration, setSelectedDuration] = useState<number>(25);
  const [customMinutes, setCustomMinutes] = useState('');

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

  const getValidCustomDuration = () => {
    const parsed = Number(customMinutes);
    if (!Number.isFinite(parsed)) return null;
    const normalized = Math.round(parsed);
    if (normalized < 5 || normalized > 240) return null;
    return normalized;
  };

  const applyCustomDuration = () => {
    const nextDuration = getValidCustomDuration();
    if (!nextDuration) return;
    void trackAppEvent('focus_custom_duration_used', {
      route: '/today',
      source: 'pomodoro_widget',
      duration_minutes: nextDuration,
    });
    setSelectedDuration(nextDuration);
    setCustomMinutes('');
  };

  const handleOpenFocusMode = () => {
    if (status === 'idle') {
      startTimer({ duration: selectedDuration, label: 'Focus Mode' });
    }
    router.push('/focus');
  };

  if (isLoading) {
    return (
      <div className="card-surface rounded-xl border border-orange-400/20 bg-orange-500/[0.04] p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="h-4 w-4 text-orange-300" />
            <h3 className="text-sm font-semibold text-text-primary">Focus Timer</h3>
          </div>
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
        <div className="mb-3">
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
        <div className="mb-4">
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-7 flex-1 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card-surface rounded-xl border border-orange-400/20 bg-gradient-to-b from-orange-500/[0.05] via-surface/60 to-surface/40 p-3 sm:p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coffee className="h-4 w-4 text-orange-300" />
          <h3 className="text-sm font-semibold text-text-primary">Focus Timer</h3>
        </div>
        <span className="rounded-md border border-orange-400/20 bg-orange-500/[0.08] px-2 py-0.5 text-[11px] text-orange-200">
          {isBreak ? '☕ Break' : '🍅 Focus'}
        </span>
      </div>

      {/* Duration selector — only shown when idle */}
      {isIdle && (
        <div className="mb-3 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDuration(d)}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                  selectedDuration === d
                    ? 'bg-orange-400/90 text-white'
                    : 'bg-surface-hover text-text-secondary hover:text-text-primary'
                }`}
              >
                {d}m
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={5}
              max={240}
              step={5}
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyCustomDuration();
              }}
              placeholder="Min"
              className="w-16 rounded-md border border-border bg-surface-hover px-2 py-1 text-[11px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-orange-300/40"
            />
            <button
              onClick={applyCustomDuration}
              disabled={!getValidCustomDuration()}
              className="rounded-md border border-orange-400/25 bg-orange-500/10 px-2 py-1 text-[11px] font-medium text-orange-200 transition-colors hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Übernehmen
            </button>
          </div>
        </div>
      )}

      <div
        className="mb-3"
        role="timer"
        aria-label={`${isBreak ? 'Break' : 'Focus'} timer: ${formatTime(displayTime)} remaining`}
        aria-live="polite"
      >
        <p className="text-4xl font-black tabular-nums leading-none text-orange-300">
          {formatTime(displayTime)}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-hover">
          <motion.div
            className={isBreak ? 'h-full rounded-full bg-emerald-400/80' : 'h-full rounded-full bg-orange-400/85'}
            initial={false}
            animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            transition={{ duration: 0.2, ease: 'linear' }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="mb-3 flex items-center gap-2">
        <motion.button
          onClick={handlePlayPause}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
            isRunning
              ? 'bg-orange-500/20 text-orange-200 hover:bg-orange-500/30'
              : 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
        >
          <span className="flex items-center gap-1">
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
            {isRunning ? 'Pause' : 'Start'}
          </span>
        </motion.button>

        <motion.button
          onClick={stopTimer}
          className="rounded-lg bg-surface-hover px-2.5 py-2 text-text-secondary transition-colors hover:bg-error/20 hover:text-error disabled:pointer-events-none disabled:opacity-30"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Stop and reset timer"
          disabled={status === 'idle'}
        >
          <RotateCcw className="h-4 w-4" />
        </motion.button>

        <motion.button
          onClick={handleOpenFocusMode}
          className="ml-auto rounded-lg border border-orange-400/25 bg-orange-500/10 px-2.5 py-2 text-[11px] font-medium text-orange-200 transition-colors hover:bg-orange-500/20"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {status === 'idle' ? 'Focus Mode' : 'Open /focus'}
        </motion.button>
      </div>

      {/* Completed pomodoros */}
      <div className="flex items-center gap-1 pb-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <motion.div
            key={index}
            className={`h-2.5 flex-1 rounded-full ${
              index < completedPomodoros
                ? 'bg-orange-400/80'
                : 'bg-surface-hover'
            }`}
            initial={false}
            animate={
              index === completedPomodoros - 1
                ? { scaleY: [1, 1.2, 1] }
                : {}
            }
            transition={{ duration: 0.25 }}
          />
        ))}
      </div>
      <p className="text-[11px] text-text-tertiary">
        {completedPomodoros}/4 sessions completed
      </p>
    </div>
  );
});

export default PomodoroTimer;
