'use client';

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, SkipForward, Timer, ChevronDown, ChevronUp, Flame, Clock, Zap } from 'lucide-react';
import { useFocusTimer } from '@/components/providers/FocusTimerProvider';
import type { FocusSessionCategory } from '@/lib/schemas/focusSession.schema';

const DURATION_PRESETS = [
  { label: '25m', minutes: 25 },
  { label: '50m', minutes: 50 },
  { label: '90m', minutes: 90 },
];

const CATEGORIES: { value: FocusSessionCategory; label: string; emoji: string }[] = [
  { value: 'study', label: 'Study', emoji: '📚' },
  { value: 'work', label: 'Work', emoji: '💼' },
  { value: 'exercise', label: 'Exercise', emoji: '💪' },
  { value: 'reading', label: 'Reading', emoji: '📖' },
  { value: 'other', label: 'Other', emoji: '✨' },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const FloatingTimer = memo(function FloatingTimer() {
  const {
    status,
    timeLeft,
    totalTime,
    sessionType,
    label,
    completedPomodoros,
    todaySummary,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    skipBreak,
    isExpanded,
    setIsExpanded,
  } = useFocusTimer();

  const [selectedDuration, setSelectedDuration] = useState(25);
  const [selectedCategory, setSelectedCategory] = useState<FocusSessionCategory>('study');
  const [inputLabel, setInputLabel] = useState('');

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const isRunning = status === 'running' || status === 'break';
  const isActive = status !== 'idle';
  const isBreak = sessionType === 'break';

  const handleStart = () => {
    const opts: { duration: number; label?: string; category: FocusSessionCategory } = {
      duration: selectedDuration,
      category: selectedCategory,
    };
    if (inputLabel) opts.label = inputLabel;
    startTimer(opts);
    setInputLabel('');
  };

  // Minimized pill
  if (!isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <motion.button
          onClick={() => setIsExpanded(true)}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-2xl
            border backdrop-blur-xl shadow-lg
            transition-colors cursor-pointer
            ${isBreak
              ? 'bg-success/10 border-success/30 text-success'
              : isActive
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-surface/90 border-border text-text-secondary hover:text-text-primary hover:border-primary/30'
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isActive && (
            <motion.div
              className={`w-2 h-2 rounded-full ${isBreak ? 'bg-success' : 'bg-primary'}`}
              animate={isRunning ? { opacity: [1, 0.3, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
          {isActive ? (
            <>
              <span className="font-mono text-sm font-medium">{formatTime(timeLeft)}</span>
              <ChevronUp className="w-3.5 h-3.5 opacity-50" />
            </>
          ) : (
            <>
              <Timer className="w-4 h-4" />
              <span className="text-sm font-medium">Focus</span>
            </>
          )}
        </motion.button>
      </motion.div>
    );
  }

  // Expanded widget
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-6 right-6 z-40 w-80"
    >
      <div
        className={`
          rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden
          ${isBreak
            ? 'bg-surface/95 border-success/20'
            : 'bg-surface/95 border-border'
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isBreak ? 'bg-success' : isActive ? 'bg-primary' : 'bg-text-tertiary'}`} />
            <span className="text-sm font-medium text-text-primary">
              {isBreak ? 'Break Time' : isActive ? 'Focusing' : 'Focus Timer'}
            </span>
            {label && isActive && (
              <span className="text-xs text-text-tertiary truncate max-w-[120px]">
                · {label}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 rounded-lg hover:bg-surface-hover text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Timer Display */}
        {isActive ? (
          <div className="px-4 py-5">
            {/* Progress bar */}
            <div className="relative h-1.5 bg-border/50 rounded-full mb-4 overflow-hidden">
              <motion.div
                className={`absolute inset-y-0 left-0 rounded-full ${isBreak ? 'bg-success' : 'bg-primary'}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Time */}
            <div className="text-center mb-4">
              <motion.div
                key={timeLeft}
                className={`text-4xl font-mono font-bold ${isBreak ? 'text-success' : 'text-text-primary'}`}
                animate={timeLeft <= 60 && isRunning ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {formatTime(timeLeft)}
              </motion.div>
              {isBreak && (
                <p className="text-xs text-text-tertiary mt-1">Take a break, you earned it</p>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              {isBreak ? (
                <>
                  {status === 'break' ? (
                    <button
                      onClick={pauseTimer}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-success/10 text-success hover:bg-success/20 transition-colors text-sm font-medium"
                    >
                      <Pause className="w-4 h-4" /> Pause
                    </button>
                  ) : (
                    <button
                      onClick={resumeTimer}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-success/10 text-success hover:bg-success/20 transition-colors text-sm font-medium"
                    >
                      <Play className="w-4 h-4" /> Resume
                    </button>
                  )}
                  <button
                    onClick={skipBreak}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-hover text-text-secondary hover:text-text-primary transition-colors text-sm font-medium"
                  >
                    <SkipForward className="w-4 h-4" /> Skip
                  </button>
                </>
              ) : (
                <>
                  {status === 'running' ? (
                    <button
                      onClick={pauseTimer}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                    >
                      <Pause className="w-4 h-4" /> Pause
                    </button>
                  ) : (
                    <button
                      onClick={resumeTimer}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                    >
                      <Play className="w-4 h-4" /> Resume
                    </button>
                  )}
                  <button
                    onClick={stopTimer}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-error/10 text-error hover:bg-error/20 transition-colors text-sm font-medium"
                  >
                    <Square className="w-3.5 h-3.5" /> Stop
                  </button>
                </>
              )}
            </div>

            {/* Pomodoro dots */}
            {completedPomodoros > 0 && (
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {Array.from({ length: Math.min(completedPomodoros, 8) }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  />
                ))}
                {completedPomodoros > 8 && (
                  <span className="text-xs text-text-tertiary ml-1">+{completedPomodoros - 8}</span>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Idle - Start configuration */
          <div className="px-4 py-4 space-y-3">
            {/* Duration presets */}
            <div>
              <label className="text-xs text-text-tertiary mb-1.5 block">Duration</label>
              <div className="flex gap-2">
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset.minutes}
                    onClick={() => setSelectedDuration(preset.minutes)}
                    className={`
                      flex-1 py-2 rounded-xl text-sm font-medium transition-colors
                      ${selectedDuration === preset.minutes
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'bg-surface-hover text-text-secondary hover:text-text-primary border border-transparent'
                      }
                    `}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-text-tertiary mb-1.5 block">Category</label>
              <div className="flex gap-1.5 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`
                      px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors
                      ${selectedCategory === cat.value
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'bg-surface-hover text-text-secondary hover:text-text-primary border border-transparent'
                      }
                    `}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Label */}
            <div>
              <label className="text-xs text-text-tertiary mb-1.5 block">Label (optional)</label>
              <input
                type="text"
                value={inputLabel}
                onChange={(e) => setInputLabel(e.target.value)}
                placeholder="What are you working on?"
                maxLength={100}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary/50 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleStart();
                }}
              />
            </div>

            {/* Start button */}
            <button
              onClick={handleStart}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start Focus ({selectedDuration}m)
            </button>
          </div>
        )}

        {/* Footer stats */}
        {todaySummary && (
          <div className="px-4 py-2.5 border-t border-border/50 flex items-center justify-between text-xs text-text-tertiary">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatMinutes(todaySummary.todayMinutes)} today
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {todaySummary.todaySessions} sessions
            </span>
            {todaySummary.currentStreak > 0 && (
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                {todaySummary.currentStreak}d streak
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default FloatingTimer;
