'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Pause, Play, SkipForward, Square, Sparkles, Timer } from 'lucide-react';
import { useFocusTimer } from '@/components/providers/FocusTimerProvider';
import { useChampion } from '@/components/providers/ChampionProvider';

type Quote = {
  text: string;
  source: string;
};

const FOCUS_QUOTES: Quote[] = [
  { text: 'Discipline creates freedom.', source: 'Jocko Willink' },
  { text: 'Small steps every day beat rare bursts of intensity.', source: 'INNIS' },
  { text: 'You do not rise to goals. You fall to systems.', source: 'James Clear' },
  { text: 'One focused session can change the whole day.', source: 'INNIS' },
  { text: 'Stay with the task. Let the noise pass.', source: 'INNIS' },
  { text: 'Consistency is a competitive advantage.', source: 'INNIS' },
];

const DURATION_PRESETS = [25, 50, 90];

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
}

export default function FocusScreen() {
  const prefersReducedMotion = useReducedMotion();
  const {
    status,
    timeLeft,
    sessionType,
    todaySummary,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    skipBreak,
  } = useFocusTimer();
  const { settings: championSettings, updateSettings: updateChampionSettings } = useChampion();

  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * FOCUS_QUOTES.length));
  const [customMinutes, setCustomMinutes] = useState('');
  const currentQuote = FOCUS_QUOTES[quoteIndex] ?? FOCUS_QUOTES[0];

  const isIdle = status === 'idle';
  const isFocusRun = status === 'running';
  const isFocusPaused = status === 'paused';
  const isBreakRun = status === 'break';
  const isBreakPaused = status === 'break_paused';
  const isBreak = sessionType === 'break';
  const timerLabel = isBreak ? 'Break' : 'Focus';

  const summaryText = useMemo(() => {
    if (!todaySummary) return 'Heute noch keine Session';
    if (todaySummary.todaySessions === 0) return 'Heute noch keine Session';
    return `${todaySummary.todaySessions} Session${todaySummary.todaySessions === 1 ? '' : 'en'} · ${formatMinutes(todaySummary.todayMinutes)}`;
  }, [todaySummary]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % FOCUS_QUOTES.length);
    }, 300_000);
    return () => clearInterval(interval);
  }, []);

  const getValidCustomDuration = () => {
    const parsed = Number(customMinutes);
    if (!Number.isFinite(parsed)) return null;
    const normalized = Math.round(parsed);
    if (normalized < 5 || normalized > 240) return null;
    return normalized;
  };

  const startCustomSession = () => {
    const duration = getValidCustomDuration();
    if (!duration) return;
    startTimer({ duration, label: 'Focus Mode' });
    setCustomMinutes('');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05080f] text-[#FAF0E6]">
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.16),transparent_35%),radial-gradient(circle_at_78%_24%,rgba(234,179,8,0.18),transparent_38%),radial-gradient(circle_at_52%_86%,rgba(245,158,11,0.12),transparent_34%)]"
        style={{ willChange: 'transform' }}
        animate={prefersReducedMotion ? false : { scale: [1, 1.006, 1], opacity: [0.9, 0.94, 0.9] }}
        transition={{ duration: 220, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute inset-[-12%] bg-[conic-gradient(from_190deg_at_50%_45%,rgba(56,189,248,0.08),transparent_24%,rgba(245,158,11,0.08),transparent_60%,rgba(99,102,241,0.06),transparent_100%)] blur-3xl"
        style={{ willChange: 'opacity' }}
        animate={prefersReducedMotion ? false : { opacity: [0.2, 0.24, 0.2] }}
        transition={{ duration: 150, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(115deg, rgba(255,255,255,0.022) 0%, transparent 36%, rgba(255,255,255,0.015) 63%, transparent 100%)',
          backgroundSize: '220% 220%',
        }}
      />
      <motion.div
        className="pointer-events-none absolute -left-24 -top-24 h-[42vw] w-[42vw] rounded-full bg-cyan-300/10 blur-[130px]"
        style={{ willChange: 'transform' }}
        animate={prefersReducedMotion ? false : { x: [0, 12, 0], y: [0, 8, 0] }}
        transition={{ duration: 108, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -right-20 top-10 h-[38vw] w-[38vw] rounded-full bg-amber-300/10 blur-[130px]"
        style={{ willChange: 'transform' }}
        animate={prefersReducedMotion ? false : { x: [0, -10, 0], y: [0, -6, 0] }}
        transition={{ duration: 122, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute left-[20%] top-[58%] h-[34vw] w-[34vw] rounded-full bg-indigo-300/10 blur-[140px]"
        style={{ willChange: 'transform' }}
        animate={prefersReducedMotion ? false : { x: [0, -6, 0], y: [0, 5, 0] }}
        transition={{ duration: 132, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      <div className="relative flex min-h-screen flex-col px-4 py-5 sm:px-8 sm:py-7">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/today"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-[#FAF0E6]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zurück zu Today
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateChampionSettings({ enabled: !championSettings.enabled })}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
                championSettings.enabled
                  ? 'border-cyan-300/25 bg-cyan-300/10 text-cyan-200 hover:bg-cyan-300/20'
                  : 'border-zinc-500/30 bg-black/35 text-zinc-300 hover:bg-zinc-700/30'
              }`}
            >
              {championSettings.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              Lucian {championSettings.enabled ? 'an' : 'aus'}
            </button>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-amber-200">
              <Sparkles className="h-3.5 w-3.5" />
              Focus Mode
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 flex w-full max-w-4xl flex-1 items-center justify-center sm:mt-12">
          <div className="w-full rounded-3xl border border-white/12 bg-[linear-gradient(180deg,rgba(9,14,24,0.52),rgba(6,10,17,0.32))] px-6 py-9 shadow-[0_12px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-10 sm:py-12 lg:px-12">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={quoteIndex}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.35 }}
                className="min-h-[7.5rem] text-center sm:min-h-[9.25rem] lg:min-h-[10rem]"
              >
                <p className="text-balance text-xl font-semibold leading-[1.28] text-[#FAF0E6] sm:text-3xl lg:text-4xl">
                  &ldquo;{currentQuote?.text}&rdquo;
                </p>
                <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-zinc-400 sm:text-xs">
                  {currentQuote?.source}
                </p>
              </motion.blockquote>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-stretch gap-3 sm:flex-nowrap sm:items-end sm:justify-between sm:gap-4">
          <div className="w-full shrink-0 rounded-2xl border border-white/10 bg-black/28 p-3 backdrop-blur-md sm:w-auto sm:max-w-[560px]">
            <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500">Session Controls</p>
            {isIdle ? (
              <div className="mt-2 flex min-h-[5.5rem] flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {DURATION_PRESETS.map((minutes) => (
                    <button
                      key={minutes}
                      onClick={() => startTimer({ duration: minutes, label: 'Focus Mode' })}
                      className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-300/20"
                    >
                      Start {minutes}m
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-zinc-400">Eigene Zeit:</span>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    step={5}
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') startCustomSession();
                    }}
                    placeholder="Min"
                    className="w-[88px] rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/35"
                  />
                  <button
                    onClick={startCustomSession}
                    disabled={!getValidCustomDuration()}
                    className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Start Custom
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex min-h-[5.5rem] flex-wrap items-center gap-2">
                {(isFocusRun || isBreakRun) && (
                  <button
                    onClick={pauseTimer}
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-300/20"
                  >
                    <Pause className="h-3.5 w-3.5" />
                    Pause
                  </button>
                )}
                {(isFocusPaused || isBreakPaused) && (
                  <button
                    onClick={resumeTimer}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-sm font-medium text-emerald-200 transition-colors hover:bg-emerald-300/20"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Resume
                  </button>
                )}
                {isBreak && (
                  <button
                    onClick={skipBreak}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-400/20 bg-zinc-400/10 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-400/20"
                  >
                    <SkipForward className="h-3.5 w-3.5" />
                    Break überspringen
                  </button>
                )}
                {!isBreak && (
                  <button
                    onClick={stopTimer}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-300/25 bg-red-300/10 px-3 py-1.5 text-sm font-medium text-red-200 transition-colors hover:bg-red-300/20"
                  >
                    <Square className="h-3.5 w-3.5" />
                    Stop
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3.5 text-right shadow-[0_8px_35px_rgba(0,0,0,0.45)] backdrop-blur-lg sm:ml-auto sm:w-auto sm:min-w-[190px]">
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">{timerLabel} Timer</p>
            <p className={`mt-1 font-mono text-2xl font-semibold ${isBreak ? 'text-amber-200' : 'text-cyan-100'}`}>
              {isIdle ? '--:--' : formatTime(timeLeft)}
            </p>
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-zinc-400">
              <Timer className="h-3 w-3" />
              {summaryText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
