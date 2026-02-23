'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { subscribeChampionEvent, type ChampionEvent } from '@/lib/champion/championEvents';
import { getLucianHint } from '@/lib/lucian/hints';
import {
  getLinesForMood,
  interpolate,
  hasUnfilledTokens,
  getDismissDuration,
  type LucianMood,
} from '@/lib/lucian/copy';
import { LucianBubble } from '@/components/features/lucian/LucianBubble';
import { LucianBreakOverlay } from '@/components/features/lucian/LucianBreakOverlay';
import type { DrillResult } from '@/lib/lucian/game/targetDrill';

// ─── localStorage / sessionStorage keys ─────────────────────────────────────
const KEY_MUTED       = 'innis_lucian_muted';      // '1' = globally muted
const KEY_COOLDOWN    = 'innis_lucian_cooldown';   // timestamp of last message
const KEY_DAILY_MUTE  = 'innis_lucian_daily_mute'; // ISO date string = muted today
const KEY_SEEN        = 'innis_lucian_seen';       // sessionStorage: JSON string[]
const KEY_SHOWN_AT    = 'innis_lucian_shown_at';   // session id marker for contextual hints
const KEY_SESSION_ID  = 'innis_lucian_session_id';

const GLOBAL_COOLDOWN_MS = 8 * 60 * 1000;  // 8 min between any messages
const IDLE_INTERVAL_MS   = 45 * 60 * 1000; // ambient idle tick
const BREAK_INVITE_AFTER_MS = 7 * 60 * 1000; // user choice: 7 min inactivity
const BREAK_INVITE_COOLDOWN_MS = 30 * 60 * 1000;
const BREAK_ROUND_SECONDS = 60;

// ─── Dashboard route guard ───────────────────────────────────────────────────
const DASHBOARD_PREFIXES = [
  '/today', '/goals', '/university', '/career',
  '/analytics', '/calendar', '/settings', '/onboarding',
];

function isDashboardPath(pathname: string): boolean {
  return DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p));
}

function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ─── Queued message shape ────────────────────────────────────────────────────
interface QueuedMessage {
  id: string;
  text: string;
  mood: LucianMood;
  priority: 0 | 1 | 2 | 3;
  ariaRole: 'status' | 'alert';
  kind?: 'default' | 'break-invite';
  durationMs?: number;
}

interface DashboardNextTasksPayload {
  studyProgress?: Array<{ name: string; examDate?: string }>;
}

interface DailyTaskPayload {
  title: string;
  completed: boolean;
  date: string;
}

interface FocusSessionPayload {
  startedAt: string;
  durationSeconds: number;
}

interface ApplicationPayload {
  company: string;
  status: string;
  updatedAt: string;
}

// ─── Storage helpers (all safe for SSR) ─────────────────────────────────────
function isMuted(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    if (localStorage.getItem(KEY_MUTED) === '1') return true;
    const daily = localStorage.getItem(KEY_DAILY_MUTE);
    if (daily === formatLocalDateKey(new Date())) return true;
    return false;
  } catch {
    return false;
  }
}

function isOnCooldown(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const ts = localStorage.getItem(KEY_COOLDOWN);
    if (!ts) return false;
    return Date.now() - Number(ts) < GLOBAL_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function recordCooldown(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY_COOLDOWN, String(Date.now()));
  } catch {
    // ignore storage errors
  }
}

function getSeenIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(sessionStorage.getItem(KEY_SEEN) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function markSeen(id: string): void {
  if (typeof window === 'undefined') return;
  const seen = getSeenIds();
  if (seen.includes(id)) return;
  try {
    sessionStorage.setItem(KEY_SEEN, JSON.stringify([...seen, id]));
  } catch {
    // ignore storage errors
  }
}

function muteToday(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY_DAILY_MUTE, formatLocalDateKey(new Date()));
  } catch {
    // ignore storage errors
  }
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let sessionId = sessionStorage.getItem(KEY_SESSION_ID);
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(KEY_SESSION_ID, sessionId);
    }
    return sessionId;
  } catch {
    return 'fallback-session';
  }
}

function hasShownContextHintThisSession(): boolean {
  if (typeof window === 'undefined') return true;
  const sessionId = getSessionId();
  try {
    return localStorage.getItem(KEY_SHOWN_AT) === sessionId;
  } catch {
    return false;
  }
}

function markContextHintShown(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY_SHOWN_AT, getSessionId());
  } catch {
    // ignore storage errors
  }
}

// ─── Line picker ─────────────────────────────────────────────────────────────
function pickMessage(
  mood: LucianMood,
  priority: 0 | 1 | 2 | 3,
  vars: Record<string, string | number> = {},
): QueuedMessage | null {
  const seen = getSeenIds();
  const candidates = getLinesForMood(mood)
    .filter((l) => !seen.includes(l.id))
    .map((l) => ({ ...l, text: interpolate(l.text, vars) }))
    .filter((l) => !hasUnfilledTokens(l.text));

  if (!candidates.length) return null;

  const line = candidates[Math.floor(Math.random() * candidates.length)]!;
  return {
    id:       line.id,
    text:     line.text,
    mood:     line.mood,
    priority,
    ariaRole: priority === 0 ? 'alert' : 'status',
  };
}

// ─── Event → message factory ─────────────────────────────────────────────────
function messageFromEvent(event: ChampionEvent): QueuedMessage | null {
  switch (event.type) {
    case 'TASK_COMPLETED':
      return pickMessage('celebrate', 1);

    case 'EXERCISE_COMPLETED':
      return pickMessage('celebrate', 1);

    case 'APPLICATION_SENT':
      return pickMessage('celebrate', 1);

    case 'GOAL_CREATED':
      return pickMessage('celebrate', 1);

    case 'FOCUS_END':
      return pickMessage('celebrate', 1);

    case 'LEVEL_UP':
      return pickMessage('celebrate', 1, { n: event.newLevel });

    case 'PENTAKILL':
      return pickMessage('celebrate', 1, { n: event.count });

    case 'STREAK_BROKEN':
      return pickMessage('recovery', 2);

    case 'DEADLINE_WARNING': {
      const days = Math.ceil(event.hoursLeft / 24);
      return event.hoursLeft <= 48
        ? pickMessage('warning', 0, { n: days })
        : pickMessage('idle', 3, { n: days });
    }

    case 'FOCUS_START':
      // Fire motivate on ~40% of session starts to avoid repetition
      return Math.random() < 0.4 ? pickMessage('motivate', 2) : null;

    default:
      return null;
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────
export function LucianBubbleProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [current, setCurrent]     = useState<QueuedMessage | null>(null);
  const [visible, setVisible]     = useState(false);
  const [breakActive, setBreakActive] = useState(false);
  const queueRef                  = useRef<QueuedMessage[]>([]);
  const contextHintShownRef       = useRef(false);
  const dismissTimerRef           = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef              = useRef(0);
  const startTimeRef              = useRef(0);
  const hiddenAtRef               = useRef(0);
  const lastActivityRef           = useRef(Date.now());
  const lastBreakInviteAtRef      = useRef(0);
  const contextHintsActive        = pathname?.startsWith('/today') ?? false;
  const todayIso                  = formatLocalDateKey(new Date());

  const { data: nextTasksData } = useQuery<DashboardNextTasksPayload | null>({
    queryKey: ['dashboard', 'next-tasks'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/next-tasks');
      if (!response.ok) return null;
      return (await response.json()) as DashboardNextTasksPayload;
    },
    enabled: contextHintsActive,
    staleTime: 20 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: todayTasksData } = useQuery<DailyTaskPayload[] | null>({
    queryKey: ['daily-tasks', todayIso],
    queryFn: async () => {
      const response = await fetch(`/api/daily-tasks?date=${todayIso}`);
      if (!response.ok) return null;
      return (await response.json()) as DailyTaskPayload[];
    },
    enabled: contextHintsActive,
    staleTime: 20 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: recentSessionsData } = useQuery<FocusSessionPayload[] | null>({
    queryKey: ['focus', 'sessions', 'lucian-context'],
    queryFn: async () => {
      const from = new Date();
      from.setDate(from.getDate() - 7);
      const response = await fetch(`/api/focus-sessions?from=${encodeURIComponent(from.toISOString())}&limit=50`);
      if (!response.ok) return null;
      return (await response.json()) as FocusSessionPayload[];
    },
    enabled: contextHintsActive,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: applicationsData } = useQuery<ApplicationPayload[] | null>({
    queryKey: ['career', 'applications', 'lucian-context'],
    queryFn: async () => {
      const response = await fetch('/api/applications?limit=100');
      if (!response.ok) return null;
      return (await response.json()) as ApplicationPayload[];
    },
    enabled: contextHintsActive,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  // ── Timer helpers ──────────────────────────────────────────────────────────
  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }, []);

  const doHide = useCallback(() => {
    setVisible(false);
    clearDismissTimer();
    clearTransitionTimer();
    // After exit animation, show next queued message
    transitionTimerRef.current = setTimeout(() => {
      const next = queueRef.current.shift() ?? null;
      if (next) {
        setCurrent(next);
        setVisible(true);
        markSeen(next.id);
        recordCooldown();
        remainingRef.current = next.durationMs ?? getDismissDuration(next.text);
        startTimeRef.current = Date.now();
        dismissTimerRef.current = setTimeout(doHide, remainingRef.current);
      } else {
        setCurrent(null);
      }
    }, 220); // matches exit animation duration
  }, [clearDismissTimer, clearTransitionTimer]);

  const startDismissTimer = useCallback((duration: number) => {
    clearDismissTimer();
    remainingRef.current  = duration;
    startTimeRef.current  = Date.now();
    dismissTimerRef.current = setTimeout(doHide, duration);
  }, [clearDismissTimer, doHide]);

  const pauseDismiss = useCallback(() => {
    if (!dismissTimerRef.current) return;
    clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = null;
    remainingRef.current -= Date.now() - startTimeRef.current;
  }, []);

  const resumeDismiss = useCallback(() => {
    if (dismissTimerRef.current || remainingRef.current <= 0) return;
    startTimeRef.current    = Date.now();
    dismissTimerRef.current = setTimeout(doHide, remainingRef.current);
  }, [doHide]);

  // ── Show a new message ─────────────────────────────────────────────────────
  const showMessage = useCallback((msg: QueuedMessage) => {
    if (!current || !visible) {
      // Slot is free
      setCurrent(msg);
      setVisible(true);
      markSeen(msg.id);
      recordCooldown();
      startDismissTimer(msg.durationMs ?? getDismissDuration(msg.text));
    } else if (msg.priority === 0 && current.priority > 0) {
      // P0 interrupts non-P0
      clearDismissTimer();
      clearTransitionTimer();
      setVisible(false);
      transitionTimerRef.current = setTimeout(() => {
        setCurrent(msg);
        setVisible(true);
        markSeen(msg.id);
        recordCooldown();
        startDismissTimer(msg.durationMs ?? getDismissDuration(msg.text));
      }, 220);
    } else if (queueRef.current.length < 2) {
      // Queue it
      queueRef.current.push(msg);
    }
    // else: drop (queue full)
  }, [current, visible, clearDismissTimer, clearTransitionTimer, startDismissTimer]);

  // ── Context-aware hint (max once per browser session) ─────────────────────
  useEffect(() => {
    if (breakActive) return;
    if (!contextHintsActive) return;
    if (contextHintShownRef.current) return;
    if (typeof window === 'undefined') return;

    if (hasShownContextHintThisSession()) {
      contextHintShownRef.current = true;
      return;
    }

    if (isMuted() || isOnCooldown()) return;
    if (!nextTasksData || !todayTasksData || !recentSessionsData || !applicationsData) return;

    const hint = getLucianHint({
      courses: (nextTasksData.studyProgress ?? []).map((course) => ({
        name: course.name,
        examDate: course.examDate ?? null,
      })),
      todayTasks: todayTasksData.map((task) => ({
        title: task.title,
        completed: task.completed,
        date: task.date,
      })),
      recentSessions: recentSessionsData.map((session) => ({
        startedAt: session.startedAt,
        durationSeconds: session.durationSeconds,
      })),
      applications: applicationsData.map((app) => ({
        company: app.company,
        status: app.status,
        updatedAt: app.updatedAt,
      })),
    });

    if (!hint) return;

    // Guard first — prevent double-display if effect re-runs before ref settles
    contextHintShownRef.current = true;
    markContextHintShown();
    showMessage({
      id: `ctx-${hint.priority}-${hint.text.slice(0, 24)}`,
      text: hint.text,
      mood: hint.mood,
      priority: hint.priority,
      ariaRole: hint.priority === 0 ? 'alert' : 'status',
    });
  }, [applicationsData, breakActive, contextHintsActive, nextTasksData, recentSessionsData, showMessage, todayTasksData]);

  // ── Champion event subscription ────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = subscribeChampionEvent((event) => {
      if (!isDashboardPath(pathname ?? '')) return;
      if (breakActive) return;
      if (isMuted()) return;
      if (isOnCooldown()) return;

      const msg = messageFromEvent(event);
      if (msg) showMessage(msg);
    });
    return unsubscribe;
  }, [breakActive, pathname, showMessage]);

  // Cleanup all timers on unmount.
  useEffect(() => {
    return () => {
      clearDismissTimer();
      clearTransitionTimer();
    };
  }, [clearDismissTimer, clearTransitionTimer]);

  // ── User activity tracking for break invites ───────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const markActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current < 3_000) return;
      lastActivityRef.current = now;
    };

    const events: Array<keyof WindowEventMap> = [
      'pointerdown',
      'mousemove',
      'keydown',
      'touchstart',
      'scroll',
    ];
    events.forEach((eventName) => window.addEventListener(eventName, markActivity, { passive: true }));

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, markActivity));
    };
  }, []);

  // ── Inactivity break invite (7 min) ────────────────────────────────────────
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (!isDashboardPath(pathname ?? '')) return;
      if (breakActive) return;
      if (current || visible) return;
      if (isMuted()) return;
      if (isOnCooldown()) return;

      const now = Date.now();
      if (now - lastActivityRef.current < BREAK_INVITE_AFTER_MS) return;
      if (now - lastBreakInviteAtRef.current < BREAK_INVITE_COOLDOWN_MS) return;

      lastBreakInviteAtRef.current = now;
      showMessage({
        id: `break-invite-${now}`,
        text: 'Kurze Pause erkannt. 60 Sekunden Target Drill?',
        mood: 'motivate',
        priority: 3,
        ariaRole: 'status',
        kind: 'break-invite',
        durationMs: 15_000,
      });
    }, 30_000);

    return () => clearInterval(interval);
  }, [breakActive, current, pathname, showMessage, visible]);

  // ── Ambient idle ticker ────────────────────────────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (!isDashboardPath(pathname ?? '')) return;
      if (breakActive) return;
      if (isMuted()) return;
      if (isOnCooldown()) return;

      const msg = pickMessage('idle', 3);
      if (msg) showMessage(msg);
    }, IDLE_INTERVAL_MS);

    return () => clearInterval(tick);
  }, [breakActive, pathname, showMessage]);

  // ── Returning-user trigger (visibilitychange) ──────────────────────────────
  useEffect(() => {
    const AWAY_THRESHOLD_MS = 30 * 60 * 1000; // 30 min

    const handleVisibility = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
      } else {
        const away = hiddenAtRef.current > 0 ? Date.now() - hiddenAtRef.current : 0;
        hiddenAtRef.current = 0;

        if (away < AWAY_THRESHOLD_MS) return;
        if (!isDashboardPath(pathname ?? '')) return;
        if (breakActive) return;
        if (isMuted()) return;

        const msg = pickMessage('recovery', 2) ?? pickMessage('idle', 3);
        if (msg) showMessage(msg);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [breakActive, pathname, showMessage]);

  // ── Dismiss handlers ───────────────────────────────────────────────────────
  const handleDismiss = useCallback(() => {
    doHide();
  }, [doHide]);

  const handleMuteToday = useCallback(() => {
    muteToday();
    doHide();
  }, [doHide]);

  const handleStartBreak = useCallback(() => {
    lastActivityRef.current = Date.now();
    setBreakActive(true);
    doHide();
  }, [doHide]);

  const handleCloseBreak = useCallback(() => {
    setBreakActive(false);
    lastActivityRef.current = Date.now();
  }, []);

  const handleBreakComplete = useCallback(
    (result: DrillResult) => {
      const mood: LucianMood = result.score >= 2_000 ? 'celebrate' : 'recovery';
      const text =
        result.score >= 2_000
          ? `Stark. ${result.score} Punkte in 60 Sekunden. Momentum halten.`
          : `${result.score} Punkte. Reicht, um den Kopf zu resetten. Zurück in den Fokus.`;
      showMessage({
        id: `break-result-${Date.now()}`,
        text,
        mood,
        priority: 2,
        ariaRole: 'status',
        durationMs: 9_000,
      });
    },
    [showMessage],
  );

  const breakInviteActive = current?.kind === 'break-invite';

  return (
    <>
      {children}
      {current && (
        <LucianBubble
          text={current.text}
          mood={current.mood}
          ariaRole={current.ariaRole}
          visible={visible}
          dismissOnBodyClick={!breakInviteActive}
          onDismiss={handleDismiss}
          onMuteToday={handleMuteToday}
          onPause={pauseDismiss}
          onResume={resumeDismiss}
          {...(breakInviteActive
            ? {
                actionLabel: 'Start 60s Drill',
                actionAriaLabel: 'Lucian Break Challenge starten',
                onAction: handleStartBreak,
              }
            : {})}
        />
      )}
      <LucianBreakOverlay
        open={breakActive}
        durationSeconds={BREAK_ROUND_SECONDS}
        onClose={handleCloseBreak}
        onComplete={handleBreakComplete}
      />
    </>
  );
}
