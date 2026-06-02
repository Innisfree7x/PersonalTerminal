'use client';

import { useCallback, useEffect, useState } from 'react';
import { resolveBriefingMode, type BriefingMode } from '@/lib/dashboard/briefing';
import { todayKey } from '@/lib/hooks/useBriefing';

/**
 * Decides whether the daily briefing gate must be shown before the user can
 * use the terminal. One gate per day per mode (morning/evening). Once passed,
 * a localStorage flag keeps it closed for the rest of that mode's window.
 */
export function useDailyGate() {
  const day = todayKey();
  const [mode] = useState<BriefingMode>(() => resolveBriefingMode(new Date()));
  const storageKey = `innis:gate:${day}:${mode}`;

  const [hydrated, setHydrated] = useState(false);
  const [passed, setPassed] = useState(true); // assume passed until hydrated → no flash of gate

  useEffect(() => {
    let done = false;
    try {
      done = window.localStorage.getItem(storageKey) === 'done';
    } catch {
      done = false;
    }
    setPassed(done);
    setHydrated(true);
  }, [storageKey]);

  const complete = useCallback(() => {
    try {
      window.localStorage.setItem(storageKey, 'done');
    } catch {
      /* quota */
    }
    setPassed(true);
  }, [storageKey]);

  return { day, mode, hydrated, passed, complete };
}
