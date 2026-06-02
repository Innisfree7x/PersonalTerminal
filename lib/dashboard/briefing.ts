import type { Commitment } from '@/lib/supabase/dailyBriefing';

export type BriefingMode = 'morning' | 'evening';

/** Hour (local) at which the daily loop flips from morning to evening framing. */
export const EVENING_CUTOFF_HOUR = 14;

/** Maximum commitments a user can set per day (UI + server guard). */
export const MAX_COMMITMENTS_PER_DAY = 3;

export function resolveBriefingMode(now: Date): BriefingMode {
  return now.getHours() < EVENING_CUTOFF_HOUR ? 'morning' : 'evening';
}

export interface Fulfillment {
  done: number;
  total: number;
  /** Share of commitments marked done, 0..1. 0 when there are none. */
  rate: number;
}

export function computeFulfillment(commitments: Commitment[]): Fulfillment {
  const total = commitments.length;
  const done = commitments.filter((c) => c.status === 'done').length;
  return {
    done,
    total,
    rate: total === 0 ? 0 : done / total,
  };
}

export interface CommitmentDay {
  /** YYYY-MM-DD */
  date: string;
  /** Whether at least one commitment was marked done that day. */
  hasDone: boolean;
}

/**
 * Counts consecutive days (ending today) with at least one done commitment.
 * `days` may be unordered and sparse; days with no done commitment break the streak.
 * `today` is the reference day (YYYY-MM-DD).
 */
export function computeCommitmentStreak(days: CommitmentDay[], today: string): number {
  const doneDates = new Set(days.filter((d) => d.hasDone).map((d) => d.date));
  let streak = 0;
  const cursor = parseIsoDate(today);

  // Walk backwards day by day until a gap is found.
  while (doneDates.has(toIsoDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/** Groups raw commitments into per-day done-flags for streak computation. */
export function toCommitmentDays(commitments: Commitment[]): CommitmentDay[] {
  const byDate = new Map<string, boolean>();
  for (const c of commitments) {
    const prev = byDate.get(c.date) ?? false;
    byDate.set(c.date, prev || c.status === 'done');
  }
  return Array.from(byDate.entries()).map(([date, hasDone]) => ({ date, hasDone }));
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
