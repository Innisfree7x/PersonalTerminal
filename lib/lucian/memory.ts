import type { LucianMood } from '@/lib/lucian/copy';

export interface YesterdayPerformance {
  tasksCompleted: number;
  tasksTotal: number;
  focusMinutes: number;
  streakMaintained: boolean;
}

export interface LucianMemoryReaction {
  mood: LucianMood;
  text: string;
  priority: 0 | 1 | 2 | 3;
}

const STORAGE_KEY = 'innis_lucian_yesterday_shown';

/**
 * Check whether yesterday's memory reaction was already shown today.
 */
export function hasShownYesterdayMemory(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return localStorage.getItem(STORAGE_KEY) === key;
  } catch {
    return true;
  }
}

/**
 * Mark yesterday's memory reaction as shown for today.
 */
export function markYesterdayMemoryShown(): void {
  if (typeof window === 'undefined') return;
  try {
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    localStorage.setItem(STORAGE_KEY, key);
  } catch {
    // ignore
  }
}

/**
 * Generate a contextual reaction based on yesterday's performance.
 * Returns null if no notable reaction is warranted.
 */
export function getYesterdayReaction(perf: YesterdayPerformance): LucianMemoryReaction | null {
  // Perfect day — all tasks done
  if (perf.tasksCompleted === perf.tasksTotal && perf.tasksTotal > 0) {
    return {
      mood: 'celebrate',
      text: 'Gestern alles erledigt. Heute genauso.',
      priority: 2,
    };
  }

  // Deep focus day — 90+ minutes
  if (perf.focusMinutes >= 90) {
    const hours = Math.round(perf.focusMinutes / 60 * 10) / 10;
    return {
      mood: 'celebrate',
      text: `Gestern ${hours}h fokussiert. Stark.`,
      priority: 2,
    };
  }

  // Streak broken
  if (!perf.streakMaintained) {
    return {
      mood: 'recovery',
      text: 'Streak gerissen. Passiert. Heute startet der neue.',
      priority: 2,
    };
  }

  // Zero tasks completed but had tasks
  if (perf.tasksCompleted === 0 && perf.tasksTotal > 0) {
    return {
      mood: 'recovery',
      text: 'Gestern lief nichts. Heute ist ein neuer Tag.',
      priority: 2,
    };
  }

  // Nothing notable
  return null;
}
