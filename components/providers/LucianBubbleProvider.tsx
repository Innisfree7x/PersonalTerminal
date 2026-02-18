'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { subscribeChampionEvent, type ChampionEvent } from '@/lib/champion/championEvents';
import {
  getLinesForMood,
  interpolate,
  hasUnfilledTokens,
  getDismissDuration,
  type LucianMood,
} from '@/lib/lucian/copy';
import { LucianBubble } from '@/components/features/lucian/LucianBubble';

// ─── localStorage / sessionStorage keys ─────────────────────────────────────
const KEY_MUTED       = 'innis_lucian_muted';      // '1' = globally muted
const KEY_COOLDOWN    = 'innis_lucian_cooldown';   // timestamp of last message
const KEY_DAILY_MUTE  = 'innis_lucian_daily_mute'; // ISO date string = muted today
const KEY_SEEN        = 'innis_lucian_seen';       // sessionStorage: JSON string[]

const GLOBAL_COOLDOWN_MS = 8 * 60 * 1000;  // 8 min between any messages
const IDLE_INTERVAL_MS   = 45 * 60 * 1000; // ambient idle tick

// ─── Dashboard route guard ───────────────────────────────────────────────────
const DASHBOARD_PREFIXES = [
  '/today', '/goals', '/university', '/career',
  '/analytics', '/calendar', '/settings', '/onboarding',
];

function isDashboardPath(pathname: string): boolean {
  return DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p));
}

// ─── Queued message shape ────────────────────────────────────────────────────
interface QueuedMessage {
  id: string;
  text: string;
  mood: LucianMood;
  priority: 0 | 1 | 2 | 3;
  ariaRole: 'status' | 'alert';
}

// ─── Storage helpers (all safe for SSR) ─────────────────────────────────────
function isMuted(): boolean {
  if (typeof window === 'undefined') return true;
  if (localStorage.getItem(KEY_MUTED) === '1') return true;
  const daily = localStorage.getItem(KEY_DAILY_MUTE);
  if (daily === new Date().toISOString().slice(0, 10)) return true;
  return false;
}

function isOnCooldown(): boolean {
  if (typeof window === 'undefined') return true;
  const ts = localStorage.getItem(KEY_COOLDOWN);
  if (!ts) return false;
  return Date.now() - Number(ts) < GLOBAL_COOLDOWN_MS;
}

function recordCooldown(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_COOLDOWN, String(Date.now()));
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
  if (!seen.includes(id)) {
    sessionStorage.setItem(KEY_SEEN, JSON.stringify([...seen, id]));
  }
}

function muteToday(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_DAILY_MUTE, new Date().toISOString().slice(0, 10));
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
  const queueRef                  = useRef<QueuedMessage[]>([]);
  const dismissTimerRef           = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef              = useRef(0);
  const startTimeRef              = useRef(0);
  const hiddenAtRef               = useRef(0);

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
        remainingRef.current = getDismissDuration(next.text);
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
      startDismissTimer(getDismissDuration(msg.text));
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
        startDismissTimer(getDismissDuration(msg.text));
      }, 220);
    } else if (queueRef.current.length < 2) {
      // Queue it
      queueRef.current.push(msg);
    }
    // else: drop (queue full)
  }, [current, visible, clearDismissTimer, clearTransitionTimer, startDismissTimer]);

  // ── Champion event subscription ────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = subscribeChampionEvent((event) => {
      if (!isDashboardPath(pathname ?? '')) return;
      if (isMuted()) return;
      if (isOnCooldown()) return;

      const msg = messageFromEvent(event);
      if (msg) showMessage(msg);
    });
    return unsubscribe;
  }, [pathname, showMessage]);

  // Cleanup all timers on unmount.
  useEffect(() => {
    return () => {
      clearDismissTimer();
      clearTransitionTimer();
    };
  }, [clearDismissTimer, clearTransitionTimer]);

  // ── Ambient idle ticker ────────────────────────────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (!isDashboardPath(pathname ?? '')) return;
      if (isMuted()) return;
      if (isOnCooldown()) return;

      const msg = pickMessage('idle', 3);
      if (msg) showMessage(msg);
    }, IDLE_INTERVAL_MS);

    return () => clearInterval(tick);
  }, [pathname, showMessage]);

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
        if (isMuted()) return;

        const msg = pickMessage('recovery', 2) ?? pickMessage('idle', 3);
        if (msg) showMessage(msg);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [pathname, showMessage]);

  // ── Dismiss handlers ───────────────────────────────────────────────────────
  const handleDismiss = useCallback(() => {
    doHide();
  }, [doHide]);

  const handleMuteToday = useCallback(() => {
    muteToday();
    doHide();
  }, [doHide]);

  return (
    <>
      {children}
      {current && (
        <LucianBubble
          text={current.text}
          mood={current.mood}
          ariaRole={current.ariaRole}
          visible={visible}
          onDismiss={handleDismiss}
          onMuteToday={handleMuteToday}
          onPause={pauseDismiss}
          onResume={resumeDismiss}
        />
      )}
    </>
  );
}
