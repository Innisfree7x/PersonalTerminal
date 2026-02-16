'use client';

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTodayFocusSummary,
  type TodayFocusSummary,
} from '@/lib/api/focus-sessions';
import type { FocusSessionCategory } from '@/lib/schemas/focusSession.schema';
import {
  createFocusSessionAction,
  type CreateFocusSessionActionPayload,
} from '@/app/actions/focus-sessions';

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

const FocusTimerContext = createContext<FocusTimerContextType | undefined>(undefined);

const STORAGE_KEY = 'prism-focus-timer';

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

function playNotificationSound() {
  try {
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.4);
  } catch {
    // Audio not available
  }
}

export function FocusTimerProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<TimerStatus>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [sessionType, setSessionType] = useState<'focus' | 'break'>('focus');
  const [label, setLabel] = useState<string | null>(null);
  const [category, setCategory] = useState<FocusSessionCategory | null>(null);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [settings, setSettings] = useState<TimerSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('prism-timer-settings');
      if (saved) {
        try {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        } catch {
          // ignore
        }
      }
    }
    return DEFAULT_SETTINGS;
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<Date | null>(null);
  const hasRestoredRef = useRef(false);

  // Fetch today's summary
  const { data: todaySummary } = useQuery({
    queryKey: ['focus', 'today'],
    queryFn: fetchTodayFocusSummary,
    refetchInterval: 60000,
    staleTime: 30 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Save session mutation
  const saveMutation = useMutation({
    mutationFn: createFocusSessionAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['focus', 'analytics'] });
      queryClient.invalidateQueries({ queryKey: ['focus', 'sessions'] });
    },
  });

  // Persist settings
  useEffect(() => {
    localStorage.setItem('prism-timer-settings', JSON.stringify(settings));
  }, [settings]);

  // Persist timer state to localStorage
  const persistState = useCallback(
    (s: TimerStatus, tl: number) => {
      if (s === 'idle') {
        localStorage.removeItem(STORAGE_KEY);
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    },
    [sessionType, totalTime, label, category, completedPomodoros]
  );

  // Save completed session
  const saveSession = useCallback(
    (completed: boolean, durationSeconds: number, plannedSeconds: number, type: 'focus' | 'break') => {
      if (!startedAtRef.current) return;
      const payload: CreateFocusSessionActionPayload = {
        sessionType: type,
        durationSeconds,
        plannedDurationSeconds: plannedSeconds,
        startedAt: startedAtRef.current.toISOString(),
        endedAt: new Date().toISOString(),
        completed,
        label,
        category,
      };
      saveMutation.mutate(payload);
    },
    [label, category, saveMutation]
  );

  // Timer completion handler
  const handleTimerComplete = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;

    if (settings.soundEnabled) {
      playNotificationSound();
    }

    if (sessionType === 'focus') {
      // Save focus session
      saveSession(true, totalTime, totalTime, 'focus');
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
        localStorage.removeItem(STORAGE_KEY);
      }
    } else {
      // Break completed
      saveSession(true, totalTime, totalTime, 'break');
      setSessionType('focus');
      setStatus('idle');
      setTimeLeft(0);
      startedAtRef.current = null;
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [sessionType, totalTime, completedPomodoros, settings, saveSession]);

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

    const saved = localStorage.getItem(STORAGE_KEY);
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
          localStorage.removeItem(STORAGE_KEY);
          setStatus('idle');
        } else {
          setTimeLeft(adjustedTimeLeft);
          setStatus(persisted.status);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
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
    localStorage.removeItem(STORAGE_KEY);
  }, [status, totalTime, timeLeft, saveSession]);

  const skipBreak = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setSessionType('focus');
    setStatus('idle');
    setTimeLeft(0);
    startedAtRef.current = null;
    localStorage.removeItem(STORAGE_KEY);
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
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateSettings = useCallback((partial: Partial<TimerSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  return (
    <FocusTimerContext.Provider
      value={{
        status,
        timeLeft,
        totalTime,
        sessionType,
        label,
        category,
        completedPomodoros,
        todaySummary: todaySummary ?? null,
        settings,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        skipBreak,
        resetTimer,
        updateSettings,
        isExpanded,
        setIsExpanded,
      }}
    >
      {children}
    </FocusTimerContext.Provider>
  );
}

export function useFocusTimer() {
  const context = useContext(FocusTimerContext);
  if (context === undefined) {
    throw new Error('useFocusTimer must be used within a FocusTimerProvider');
  }
  return context;
}
