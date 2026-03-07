'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Layers3,
  Palette,
  Pause,
  Play,
  SkipForward,
  Square,
  Sparkles,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import { useFocusTimer } from '@/components/providers/FocusTimerProvider';
import { useChampion } from '@/components/providers/ChampionProvider';
import { trackAppEvent } from '@/lib/analytics/client';
import { LEGACY_STORAGE_KEYS, STORAGE_KEYS } from '@/lib/storage/keys';

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
const FOCUS_VISUAL_PREFS_STORAGE_KEY = STORAGE_KEYS.focusScreenVisualPrefs;
const LEGACY_FOCUS_VISUAL_PREFS_STORAGE_KEY =
  LEGACY_STORAGE_KEYS.focusScreenVisualPrefs[0] ?? 'prism:focus-screen:visual-prefs:v1';

type FocusThemePreset = {
  id: string;
  label: string;
  baseColor: string;
  radialGradient: string;
  conicGradient: string;
  orbOne: string;
  orbTwo: string;
  orbThree: string;
  quoteSurface: string;
};

type FocusOverlayPreset = {
  id: string;
  label: string;
  texture: string;
  textureOpacity: number;
  grain: string;
  grainOpacity: number;
  vignette: string;
  vignetteOpacity: number;
};

const FOCUS_THEME_PRESETS: FocusThemePreset[] = [
  {
    id: 'obsidian',
    label: 'Obsidian',
    baseColor: '#05080f',
    radialGradient:
      'radial-gradient(circle at 20% 20%, rgba(56,189,248,0.17), transparent 35%), radial-gradient(circle at 78% 24%, rgba(234,179,8,0.18), transparent 38%), radial-gradient(circle at 52% 86%, rgba(245,158,11,0.12), transparent 34%)',
    conicGradient:
      'conic-gradient(from 190deg at 50% 45%, rgba(56,189,248,0.08), transparent 24%, rgba(245,158,11,0.08), transparent 60%, rgba(99,102,241,0.06), transparent 100%)',
    orbOne: 'radial-gradient(circle, rgba(56,189,248,0.14), rgba(56,189,248,0))',
    orbTwo: 'radial-gradient(circle, rgba(250,204,21,0.13), rgba(250,204,21,0))',
    orbThree: 'radial-gradient(circle, rgba(99,102,241,0.13), rgba(99,102,241,0))',
    quoteSurface: 'linear-gradient(180deg, rgba(9,14,24,0.44), rgba(6,10,17,0.26))',
  },
  {
    id: 'titanium',
    label: 'Titanium',
    baseColor: '#060913',
    radialGradient:
      'radial-gradient(circle at 16% 18%, rgba(125,211,252,0.15), transparent 34%), radial-gradient(circle at 83% 20%, rgba(148,163,184,0.2), transparent 36%), radial-gradient(circle at 52% 82%, rgba(71,85,105,0.17), transparent 33%)',
    conicGradient:
      'conic-gradient(from 200deg at 52% 46%, rgba(59,130,246,0.08), transparent 26%, rgba(100,116,139,0.1), transparent 62%, rgba(14,165,233,0.06), transparent 100%)',
    orbOne: 'radial-gradient(circle, rgba(14,165,233,0.14), rgba(14,165,233,0))',
    orbTwo: 'radial-gradient(circle, rgba(148,163,184,0.15), rgba(148,163,184,0))',
    orbThree: 'radial-gradient(circle, rgba(59,130,246,0.12), rgba(59,130,246,0))',
    quoteSurface: 'linear-gradient(180deg, rgba(11,17,30,0.48), rgba(8,12,23,0.28))',
  },
  {
    id: 'bronze',
    label: 'Bronze',
    baseColor: '#09060a',
    radialGradient:
      'radial-gradient(circle at 20% 18%, rgba(251,191,36,0.16), transparent 35%), radial-gradient(circle at 80% 22%, rgba(249,115,22,0.18), transparent 38%), radial-gradient(circle at 54% 84%, rgba(234,88,12,0.13), transparent 35%)',
    conicGradient:
      'conic-gradient(from 188deg at 50% 45%, rgba(251,191,36,0.08), transparent 24%, rgba(249,115,22,0.08), transparent 60%, rgba(168,85,247,0.06), transparent 100%)',
    orbOne: 'radial-gradient(circle, rgba(251,191,36,0.13), rgba(251,191,36,0))',
    orbTwo: 'radial-gradient(circle, rgba(249,115,22,0.13), rgba(249,115,22,0))',
    orbThree: 'radial-gradient(circle, rgba(168,85,247,0.11), rgba(168,85,247,0))',
    quoteSurface: 'linear-gradient(180deg, rgba(26,16,8,0.46), rgba(17,10,7,0.28))',
  },
  {
    id: 'aurora',
    label: 'Aurora',
    baseColor: '#050810',
    radialGradient:
      'radial-gradient(circle at 21% 21%, rgba(34,211,238,0.16), transparent 34%), radial-gradient(circle at 80% 20%, rgba(96,165,250,0.15), transparent 36%), radial-gradient(circle at 50% 84%, rgba(52,211,153,0.15), transparent 33%)',
    conicGradient:
      'conic-gradient(from 192deg at 50% 45%, rgba(34,211,238,0.07), transparent 25%, rgba(96,165,250,0.09), transparent 58%, rgba(52,211,153,0.08), transparent 100%)',
    orbOne: 'radial-gradient(circle, rgba(34,211,238,0.14), rgba(34,211,238,0))',
    orbTwo: 'radial-gradient(circle, rgba(96,165,250,0.13), rgba(96,165,250,0))',
    orbThree: 'radial-gradient(circle, rgba(52,211,153,0.12), rgba(52,211,153,0))',
    quoteSurface: 'linear-gradient(180deg, rgba(7,17,31,0.46), rgba(5,12,20,0.26))',
  },
];

const FOCUS_OVERLAY_PRESETS: FocusOverlayPreset[] = [
  {
    id: 'silk',
    label: 'Silk',
    texture:
      'linear-gradient(118deg, rgba(255,255,255,0.028) 0%, transparent 35%, rgba(255,255,255,0.018) 64%, transparent 100%)',
    textureOpacity: 0.34,
    grain: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
    grainOpacity: 0.22,
    vignette:
      'radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 22%, rgba(2,4,10,0.42) 100%)',
    vignetteOpacity: 0.9,
  },
  {
    id: 'grid',
    label: 'Grid',
    texture:
      'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
    textureOpacity: 0.16,
    grain: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
    grainOpacity: 0.2,
    vignette:
      'radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 18%, rgba(2,4,10,0.46) 100%)',
    vignetteOpacity: 0.92,
  },
  {
    id: 'velvet',
    label: 'Velvet',
    texture:
      'linear-gradient(0deg, rgba(255,255,255,0.014) 0%, transparent 40%, rgba(255,255,255,0.012) 100%)',
    textureOpacity: 0.24,
    grain: 'radial-gradient(circle, rgba(255,255,255,0.028) 1px, transparent 1px)',
    grainOpacity: 0.18,
    vignette:
      'radial-gradient(circle at 50% 42%, rgba(0,0,0,0) 16%, rgba(2,4,10,0.5) 100%)',
    vignetteOpacity: 0.95,
  },
  {
    id: 'clean',
    label: 'Clean',
    texture: 'none',
    textureOpacity: 0,
    grain: 'none',
    grainOpacity: 0,
    vignette:
      'radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 26%, rgba(2,4,10,0.36) 100%)',
    vignetteOpacity: 0.78,
  },
];

const DEFAULT_FOCUS_THEME = FOCUS_THEME_PRESETS[0]!;
const DEFAULT_FOCUS_OVERLAY = FOCUS_OVERLAY_PRESETS[0]!;

type VisualPresetPickerProps = {
  label: string;
  icon: LucideIcon;
  selectedId: string;
  onSelect: (id: string) => void;
  options: Array<{ id: string; label: string }>;
};

function VisualPresetPicker({
  label,
  icon: Icon,
  selectedId,
  onSelect,
  options,
}: VisualPresetPickerProps) {
  return (
    <div className="rounded-2xl border border-white/12 bg-black/28 p-2.5 backdrop-blur-md">
      <p className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
        <Icon className="h-3.5 w-3.5 text-zinc-400" />
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const selected = option.id === selectedId;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              aria-pressed={selected}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                selected
                  ? 'border-cyan-300/35 bg-cyan-400/12 text-cyan-100 shadow-[0_0_0_1px_rgba(56,189,248,0.16)]'
                  : 'border-white/12 bg-white/[0.02] text-zinc-300 hover:border-white/25 hover:bg-white/[0.06]'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
  // Capture the enabled state on mount so we can restore it when leaving focus.
  const championEnabledOnMount = useRef(championSettings.enabled);

  // Restore champion visibility when the user navigates away from the focus screen.
  useEffect(() => {
    const initialEnabled = championEnabledOnMount.current;
    return () => {
      updateChampionSettings({ enabled: initialEnabled });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * FOCUS_QUOTES.length));
  const [customMinutes, setCustomMinutes] = useState('');
  const [themePresetId, setThemePresetId] = useState(DEFAULT_FOCUS_THEME.id);
  const [overlayPresetId, setOverlayPresetId] = useState(DEFAULT_FOCUS_OVERLAY.id);
  const currentQuote = FOCUS_QUOTES[quoteIndex] ?? FOCUS_QUOTES[0];
  const activeTheme = useMemo(
    () => FOCUS_THEME_PRESETS.find((preset) => preset.id === themePresetId) ?? DEFAULT_FOCUS_THEME,
    [themePresetId]
  );
  const activeOverlay = useMemo(
    () =>
      FOCUS_OVERLAY_PRESETS.find((preset) => preset.id === overlayPresetId) ??
      DEFAULT_FOCUS_OVERLAY,
    [overlayPresetId]
  );

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
    void trackAppEvent('focus_screen_open', { route: '/focus', source: 'focus_screen' });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % FOCUS_QUOTES.length);
    }, 300_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const primaryRaw = localStorage.getItem(FOCUS_VISUAL_PREFS_STORAGE_KEY);
      const legacyRaw = localStorage.getItem(LEGACY_FOCUS_VISUAL_PREFS_STORAGE_KEY);
      const raw = primaryRaw ?? legacyRaw;
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        themePresetId?: string;
        overlayPresetId?: string;
      };

      if (
        parsed.themePresetId &&
        FOCUS_THEME_PRESETS.some((preset) => preset.id === parsed.themePresetId)
      ) {
        setThemePresetId(parsed.themePresetId);
      }

      if (
        parsed.overlayPresetId &&
        FOCUS_OVERLAY_PRESETS.some((preset) => preset.id === parsed.overlayPresetId)
      ) {
        setOverlayPresetId(parsed.overlayPresetId);
      }

      if (!primaryRaw && legacyRaw) {
        localStorage.setItem(FOCUS_VISUAL_PREFS_STORAGE_KEY, raw);
        localStorage.removeItem(LEGACY_FOCUS_VISUAL_PREFS_STORAGE_KEY);
      }
    } catch (error) {
      console.warn('[focus-screen] Failed to read visual preferences.', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    localStorage.setItem(
      FOCUS_VISUAL_PREFS_STORAGE_KEY,
      JSON.stringify({ themePresetId, overlayPresetId })
    );
  }, [themePresetId, overlayPresetId]);

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
    void trackAppEvent('focus_custom_duration_used', {
      route: '/focus',
      source: 'focus_screen',
      duration_minutes: duration,
    });
    startTimer({ duration, label: 'Focus Mode' });
    setCustomMinutes('');
  };

  const handleLucianToggle = () => {
    const enabled = !championSettings.enabled;
    updateChampionSettings({ enabled });
    void trackAppEvent('lucian_toggle_changed', {
      route: '/focus',
      source: 'focus_screen',
      enabled,
    });
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden text-[#FAF0E6]"
      data-testid="focus-screen-root"
      style={{ backgroundColor: activeTheme.baseColor }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ willChange: 'transform', backgroundImage: activeTheme.radialGradient }}
        key={`focus-theme-radial-${activeTheme.id}`}
        initial={{ opacity: 0.82 }}
        animate={prefersReducedMotion ? false : { scale: [1, 1.006, 1], opacity: [0.9, 0.94, 0.9] }}
        transition={{ duration: 220, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute inset-[-12%] blur-3xl"
        style={{ willChange: 'opacity', backgroundImage: activeTheme.conicGradient }}
        key={`focus-theme-conic-${activeTheme.id}`}
        animate={prefersReducedMotion ? false : { opacity: [0.2, 0.24, 0.2] }}
        transition={{ duration: 150, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: activeOverlay.texture,
          backgroundSize: activeOverlay.id === 'grid' ? '42px 42px' : '220% 220%',
          opacity: activeOverlay.textureOpacity,
        }}
      />
      <motion.div
        className="pointer-events-none absolute -left-24 -top-24 h-[42vw] w-[42vw] rounded-full blur-[130px]"
        style={{ willChange: 'transform', background: activeTheme.orbOne }}
        animate={prefersReducedMotion ? false : { x: [0, 12, 0], y: [0, 8, 0] }}
        transition={{ duration: 108, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -right-20 top-10 h-[38vw] w-[38vw] rounded-full blur-[130px]"
        style={{ willChange: 'transform', background: activeTheme.orbTwo }}
        animate={prefersReducedMotion ? false : { x: [0, -10, 0], y: [0, -6, 0] }}
        transition={{ duration: 122, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute left-[20%] top-[58%] h-[34vw] w-[34vw] rounded-full blur-[140px]"
        style={{ willChange: 'transform', background: activeTheme.orbThree }}
        animate={prefersReducedMotion ? false : { x: [0, -6, 0], y: [0, 5, 0] }}
        transition={{ duration: 132, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: activeOverlay.grain,
          backgroundSize: '30px 30px',
          opacity: activeOverlay.grainOpacity,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: activeOverlay.vignette, opacity: activeOverlay.vignetteOpacity }}
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
              onClick={handleLucianToggle}
              data-testid="focus-lucian-toggle"
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

        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          <VisualPresetPicker
            label="Theme"
            icon={Palette}
            selectedId={themePresetId}
            onSelect={setThemePresetId}
            options={FOCUS_THEME_PRESETS}
          />
          <VisualPresetPicker
            label="Overlay"
            icon={Layers3}
            selectedId={overlayPresetId}
            onSelect={setOverlayPresetId}
            options={FOCUS_OVERLAY_PRESETS}
          />
        </div>

        <div className="mx-auto mt-10 flex w-full max-w-4xl flex-1 items-center justify-center sm:mt-12">
          <div
            className="w-full rounded-3xl border px-6 py-9 shadow-[0_12px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-10 sm:py-12 lg:px-12"
            style={{
              borderColor: 'rgba(148,163,184,0.20)',
              backgroundImage: activeTheme.quoteSurface,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={quoteIndex}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.35 }}
                className="flex min-h-[10rem] flex-col items-center justify-center text-center sm:min-h-[11.75rem] lg:min-h-[12.5rem]"
              >
                <p className="max-w-[44rem] text-balance text-xl font-semibold leading-[1.28] text-[#FAF0E6] sm:text-3xl lg:text-4xl">
                  &ldquo;{currentQuote?.text}&rdquo;
                </p>
                <p className="mt-5 text-[11px] uppercase tracking-[0.2em] text-zinc-400 sm:text-xs">
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
                    data-testid="focus-custom-minutes-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') startCustomSession();
                    }}
                    placeholder="Min"
                    className="w-[88px] rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/35"
                  />
                  <button
                    onClick={startCustomSession}
                    disabled={!getValidCustomDuration()}
                    data-testid="focus-start-custom-button"
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
            <p
              data-testid="focus-timer-readout"
              className={`mt-1 font-mono text-2xl font-semibold ${isBreak ? 'text-amber-200' : 'text-cyan-100'}`}
            >
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
