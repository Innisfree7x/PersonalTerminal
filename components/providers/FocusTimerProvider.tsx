'use client';

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  fetchTodayFocusSummary,
  createFocusSession as createFocusSessionApi,
  type TodayFocusSummary,
  type CreateFocusSessionPayload,
} from '@/lib/api/focus-sessions';
import type { FocusSessionCategory } from '@/lib/schemas/focusSession.schema';
import { dispatchChampionEvent } from '@/lib/champion/championEvents';
import { useAppSound } from '@/lib/hooks/useAppSound';
import { usePageVisibility } from '@/lib/hooks/usePageVisibility';
import { LEGACY_STORAGE_KEYS, readStorageValueWithLegacy, STORAGE_KEYS } from '@/lib/storage/keys';

type TimerStatus = 'idle' | 'running' | 'paused' | 'break' | 'break_paused';

export interface TimerSettings {
  focusDuration: number; // minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  autoStartBreak: boolean;
  soundEnabled: boolean;
}

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreak: true,
  soundEnabled: true,
};

interface FocusTimerContextType {
  status: TimerStatus;
  timeLeft: number;
  totalTime: number;
  sessionType: 'focus' | 'break';
  label: string | null;
  category: FocusSessionCategory | null;
  completedPomodoros: number;
  todaySummary: TodayFocusSummary | null;
  settings: TimerSettings;

  startTimer: (options?: {
    duration?: number;
    label?: string;
    category?: FocusSessionCategory;
  }) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  skipBreak: () => void;
  resetTimer: () => void;
  updateSettings: (settings: Partial<TimerSettings>) => void;

  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

type FocusTimerClockContextType = Pick<FocusTimerContextType, 'timeLeft' | 'totalTime'>;
type FocusTimerSessionContextType = Pick<
  FocusTimerContextType,
  | 'status'
  | 'sessionType'
  | 'label'
  | 'category'
  | 'completedPomodoros'
  | 'todaySummary'
  | 'settings'
  | 'isExpanded'
>;
type FocusTimerActionsContextType = Pick<
  FocusTimerContextType,
  | 'startTimer'
  | 'pauseTimer'
  | 'resumeTimer'
  | 'stopTimer'
  | 'skipBreak'
  | 'resetTimer'
  | 'updateSettings'
  | 'setIsExpanded'
>;

const FocusTimerClockContext = createContext<FocusTimerClockContextType | undefined>(undefined);
const FocusTimerSessionContext = createContext<FocusTimerSessionContextType | undefined>(undefined);
const FocusTimerActionsContext = createContext<FocusTimerActionsContextType | undefined>(undefined);

const STORAGE_KEY = STORAGE_KEYS.focusTimerSession;
const SETTINGS_STORAGE_KEY = STORAGE_KEYS.focusTimerSettings;
const SOUND_OPT_IN_PROMPT_SEEN_KEY = 'innis:sound-opt-in-prompt-seen:v1';

interface PersistedState {
  status: TimerStatus;
  sessionType: 'focus' | 'break';
  totalTime: number;
  startedAt: string;
  pausedTimeLeft: number | null;
  label: string | null;
  category: FocusSessionCategory | null;
  completedPomodoros: number;
}

function safeStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null {
  if (typeof window === 'undefined') return null;
  const storage = window.localStorage as Partial<Storage> | undefined;
  if (!storage) return null;
  if (typeof storage.getItem !== 'function') return null;
  if (typeof storage.setItem !== 'function') return null;
  if (typeof storage.removeItem !== 'function') return null;
  return storage as Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
}

function storageGet(key: string, legacyKeys: readonly string[] = []): string | null {
  const storage = safeStorage();
  if (!storage) return null;
  try {
    if (legacyKeys.length > 0) {
      return readStorageValueWithLegacy(storage, key, legacyKeys);
    }
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // ignore storage errors
  }
}

function storageRemove(key: string): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // ignore storage errors
  }
}

export function FocusTimerProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { settings: appSoundSettings, setEnabled: setAppSoundEnabled, play: playAppSound } = useAppSound();
  const isPageVisible = usePageVisibility();

  const [status, setStatus] = useState<TimerStatus>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [sessionType, setSessionType] = useState<'focus' | 'break'>('focus');
  const [label, setLabel] = useState<string | null>(null);
  const [category, setCategory] = useState<FocusSessionCategory | null>(null);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [settings, setSettings] = useState<TimerSettings>(() => {
    const saved = storageGet(SETTINGS_STORAGE_KEY, LEGACY_STORAGE_KEYS.focusTimerSettings);
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        // ignore
      }
    }
    return DEFAULT_SETTINGS;
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<Date | null>(null);
  const hasRestoredRef = useRef(false);
  const soundPromptDisplayedRef = useRef(false);

  // Fetch today's summary
  const { data: todaySummary } = useQuery({
    queryKey: ['focus', 'today'],
    queryFn: fetchTodayFocusSummary,
    refetchInterval: isPageVisible ? 5 * 60 * 1000 : false,
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Save session mutation — uses REST API to avoid Next.js Server Action serialization limits
  const saveMutation = useMutation({
    mutationFn: (payload: CreateFocusSessionPayload) => createFocusSessionApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['focus', 'analytics'] });
      queryClient.invalidateQueries({ queryKey: ['focus', 'sessions'] });
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[FocusTimer] Session save failed:', msg);
      toast.error(`Session-Fehler: ${msg}`, { duration: 8000 });
    },
  });

  // Persist settings
  useEffect(() => {
    storageSet(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Persist timer state to localStorage
  const persistState = useCallback(
    (s: TimerStatus, tl: number) => {
      if (s === 'idle') {
        storageRemove(STORAGE_KEY);
        return;
      }
      const persisted: PersistedState = {
        status: s,
        sessionType,
        totalTime,
        startedAt: startedAtRef.current?.toISOString() || new Date().toISOString(),
        pausedTimeLeft: s === 'paused' || s === 'break_paused' ? tl : null,
        label,
        category,
        completedPomodoros,
      };
      storageSet(STORAGE_KEY, JSON.stringify(persisted));
    },
    [sessionType, totalTime, label, category, completedPomodoros]
  );

  // Save completed session
  const saveSession = useCallback(
    (completed: boolean, durationSeconds: number, plannedSeconds: number, type: 'focus' | 'break') => {
      if (!startedAtRef.current) return;
      const payload: CreateFocusSessionPayload = {
        sessionType: type,
        durationSeconds,
        plannedDurationSeconds: plannedSeconds,
        startedAt: startedAtRef.current.toISOString(),
        endedAt: new Date().toISOString(),
        completed,
        label: label ?? null,
        category: category ?? null,
      };
      saveMutation.mutate(payload);
    },
    [label, category, saveMutation]
  );

  // Timer completion handler
  const maybePromptForSoundOptIn = useCallback(() => {
    if (soundPromptDisplayedRef.current) return;
    if (appSoundSettings.enabled) return;
    if (settings.soundEnabled === false) return;
    const alreadySeen = storageGet(SOUND_OPT_IN_PROMPT_SEEN_KEY) === '1';
    if (alreadySeen) return;

    soundPromptDisplayedRef.current = true;
    storageSet(SOUND_OPT_IN_PROMPT_SEEN_KEY, '1');

    toast.custom(
      (toastCtx) => (
        <div className="w-[21rem] rounded-xl border border-primary/35 bg-surface p-3.5 shadow-2xl">
          <p className="text-sm font-semibold text-text-primary">Sound feedback aktivieren?</p>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">
            Du hast deine erste Fokus-Session abgeschlossen. Aktiviere dezente Produkt-Sounds für Abschluss,
            Statuswechsel und Momentum.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-primary/40 bg-primary/15 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/22"
              onClick={() => {
                setAppSoundEnabled(true);
                playAppSound('focus-end', { force: true });
                toast.dismiss(toastCtx.id);
                toast.success('Sound feedback aktiviert.');
              }}
            >
              Aktivieren
            </button>
            <button
              type="button"
              className="rounded-md border border-border bg-surface-hover px-2.5 py-1.5 text-xs text-text-secondary hover:text-text-primary"
              onClick={() => toast.dismiss(toastCtx.id)}
            >
              Nicht jetzt
            </button>
          </div>
        </div>
      ),
      { duration: 12000 }
    );
  }, [appSoundSettings.enabled, playAppSound, setAppSoundEnabled, settings.soundEnabled]);

  const handleTimerComplete = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;

    if (settings.soundEnabled && appSoundSettings.enabled) {
      playAppSound('focus-end');
    }

    if (sessionType === 'focus') {
      dispatchChampionEvent({ type: 'FOCUS_END' });
      // Save focus session
      saveSession(true, totalTime, totalTime, 'focus');
      if (settings.soundEnabled && !appSoundSettings.enabled) {
        maybePromptForSoundOptIn();
      }
      const newPomodoros = completedPomodoros + 1;
      setCompletedPomodoros(newPomodoros);

      // Start break
      if (settings.autoStartBreak) {
        const isLongBreak = newPomodoros % settings.sessionsBeforeLongBreak === 0;
        const breakDuration = isLongBreak
          ? settings.longBreakDuration * 60
          : settings.shortBreakDuration * 60;
        setSessionType('break');
        setTotalTime(breakDuration);
        setTimeLeft(breakDuration);
        setStatus('break');
        startedAtRef.current = new Date();
      } else {
        setStatus('idle');
        setTimeLeft(0);
        startedAtRef.current = null;
        storageRemove(STORAGE_KEY);
      }
    } else {
      // Break completed
      saveSession(true, totalTime, totalTime, 'break');
      dispatchChampionEvent({ type: 'FOCUS_END' });
      setSessionType('focus');
      setStatus('idle');
      setTimeLeft(0);
      startedAtRef.current = null;
      storageRemove(STORAGE_KEY);
    }
  }, [
    appSoundSettings.enabled,
    completedPomodoros,
    maybePromptForSoundOptIn,
    playAppSound,
    saveSession,
    sessionType,
    settings,
    totalTime,
  ]);

  // Interval tick
  useEffect(() => {
    if (status === 'running' || status === 'break') {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            handleTimerComplete();
            return 0;
          }
          // Persist every 5 seconds to avoid excessive writes
          if (next % 5 === 0) {
            persistState(status, next);
          }
          return next;
        });
      }, 1000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
    return undefined;
  }, [status, handleTimerComplete, persistState]);

  // Restore from localStorage on mount
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const saved = storageGet(STORAGE_KEY, LEGACY_STORAGE_KEYS.focusTimerSession);
    if (!saved) return;

    try {
      const persisted: PersistedState = JSON.parse(saved);
      setSessionType(persisted.sessionType);
      setTotalTime(persisted.totalTime);
      setLabel(persisted.label);
      setCategory(persisted.category);
      setCompletedPomodoros(persisted.completedPomodoros);
      startedAtRef.current = new Date(persisted.startedAt);

      if (persisted.status === 'paused' || persisted.status === 'break_paused') {
        setTimeLeft(persisted.pausedTimeLeft || 0);
        setStatus(persisted.status);
      } else if (persisted.status === 'running' || persisted.status === 'break') {
        // Calculate remaining time based on elapsed
        const elapsed = Math.floor(
          (Date.now() - new Date(persisted.startedAt).getTime()) / 1000
        );
        const adjustedTimeLeft = persisted.pausedTimeLeft
          ? persisted.pausedTimeLeft
          : persisted.totalTime - elapsed;

        if (adjustedTimeLeft <= 0) {
          // Timer would have expired while page was closed
          storageRemove(STORAGE_KEY);
          setStatus('idle');
        } else {
          setTimeLeft(adjustedTimeLeft);
          setStatus(persisted.status);
        }
      }
    } catch {
      storageRemove(STORAGE_KEY);
    }
  }, []);

  // Keyboard shortcut: Alt+F
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey && e.key === 'f') {
        e.preventDefault();
        if (status === 'idle') {
          startTimer();
        } else if (status === 'running' || status === 'break') {
          pauseTimer();
        } else if (status === 'paused' || status === 'break_paused') {
          resumeTimer();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const startTimer = useCallback(
    (options?: { duration?: number; label?: string; category?: FocusSessionCategory }) => {
      const durationMinutes = options?.duration || settings.focusDuration;
      const durationSeconds = durationMinutes * 60;

      setSessionType('focus');
      setTotalTime(durationSeconds);
      setTimeLeft(durationSeconds);
      setLabel(options?.label || null);
      setCategory(options?.category || null);
      setStatus('running');
      startedAtRef.current = new Date();
      dispatchChampionEvent({ type: 'FOCUS_START' });
      persistState('running', durationSeconds);
    },
    [settings.focusDuration, persistState]
  );

  const pauseTimer = useCallback(() => {
    if (status === 'running') {
      setStatus('paused');
      persistState('paused', timeLeft);
    } else if (status === 'break') {
      setStatus('break_paused');
      persistState('break_paused', timeLeft);
    }
  }, [status, timeLeft, persistState]);

  const resumeTimer = useCallback(() => {
    if (status === 'paused') {
      setStatus('running');
      persistState('running', timeLeft);
    } else if (status === 'break_paused') {
      setStatus('break');
      persistState('break', timeLeft);
    }
  }, [status, timeLeft, persistState]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;

    // Save partial session
    if (startedAtRef.current && (status === 'running' || status === 'paused')) {
      const elapsed = totalTime - timeLeft;
      if (elapsed > 10) {
        // Only save if >10 seconds
        saveSession(false, elapsed, totalTime, 'focus');
      }
    }

    setStatus('idle');
    setTimeLeft(0);
    setTotalTime(0);
    setSessionType('focus');
    startedAtRef.current = null;
    dispatchChampionEvent({ type: 'FOCUS_END' });
    storageRemove(STORAGE_KEY);
  }, [status, totalTime, timeLeft, saveSession]);

  const skipBreak = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setSessionType('focus');
    setStatus('idle');
    setTimeLeft(0);
    startedAtRef.current = null;
    dispatchChampionEvent({ type: 'FOCUS_END' });
    storageRemove(STORAGE_KEY);
  }, []);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setStatus('idle');
    setTimeLeft(0);
    setTotalTime(0);
    setSessionType('focus');
    setLabel(null);
    setCategory(null);
    setCompletedPomodoros(0);
    startedAtRef.current = null;
    dispatchChampionEvent({ type: 'FOCUS_END' });
    storageRemove(STORAGE_KEY);
  }, []);

  const updateSettings = useCallback((partial: Partial<TimerSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const clockValue = useMemo<FocusTimerClockContextType>(
    () => ({
      timeLeft,
      totalTime,
    }),
    [timeLeft, totalTime]
  );

  const sessionValue = useMemo<FocusTimerSessionContextType>(
    () => ({
      status,
      sessionType,
      label,
      category,
      completedPomodoros,
      todaySummary: todaySummary ?? null,
      settings,
      isExpanded,
    }),
    [
      status,
      sessionType,
      label,
      category,
      completedPomodoros,
      todaySummary,
      settings,
      isExpanded,
    ]
  );

  const actionsValue = useMemo<FocusTimerActionsContextType>(
    () => ({
      startTimer,
      pauseTimer,
      resumeTimer,
      stopTimer,
      skipBreak,
      resetTimer,
      updateSettings,
      setIsExpanded,
    }),
    [startTimer, pauseTimer, resumeTimer, stopTimer, skipBreak, resetTimer, updateSettings, setIsExpanded]
  );

  return (
    <FocusTimerActionsContext.Provider value={actionsValue}>
      <FocusTimerSessionContext.Provider value={sessionValue}>
        <FocusTimerClockContext.Provider value={clockValue}>{children}</FocusTimerClockContext.Provider>
      </FocusTimerSessionContext.Provider>
    </FocusTimerActionsContext.Provider>
  );
}

export function useFocusTimerClock() {
  const context = useContext(FocusTimerClockContext);
  if (context === undefined) {
    throw new Error('useFocusTimer must be used within a FocusTimerProvider');
  }
  return context;
}

export function useFocusTimerSession() {
  const context = useContext(FocusTimerSessionContext);
  if (context === undefined) {
    throw new Error('useFocusTimer must be used within a FocusTimerProvider');
  }
  return context;
}

export function useFocusTimerActions() {
  const context = useContext(FocusTimerActionsContext);
  if (context === undefined) {
    throw new Error('useFocusTimer must be used within a FocusTimerProvider');
  }
  return context;
}

export function useFocusTimer() {
  const clock = useFocusTimerClock();
  const session = useFocusTimerSession();
  const actions = useFocusTimerActions();

  return {
    ...session,
    ...clock,
    ...actions,
  };
}
