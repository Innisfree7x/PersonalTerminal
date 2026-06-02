import { describe, expect, test } from 'vitest';

import {
  resolveBriefingMode,
  computeFulfillment,
  computeCommitmentStreak,
  toCommitmentDays,
  EVENING_CUTOFF_HOUR,
} from '@/lib/dashboard/briefing';
import type { Commitment } from '@/lib/supabase/dailyBriefing';

function commitment(partial: Partial<Commitment> & { date: string }): Commitment {
  return {
    id: Math.random().toString(36).slice(2),
    title: 'OR Übungsblatt',
    status: 'pending',
    missedReason: null,
    sortOrder: 0,
    createdAt: '2026-06-02T08:00:00.000Z',
    resolvedAt: null,
    ...partial,
  };
}

describe('resolveBriefingMode', () => {
  test('vor dem Cutoff ist Morgen', () => {
    const d = new Date(2026, 5, 2, EVENING_CUTOFF_HOUR - 1, 59);
    expect(resolveBriefingMode(d)).toBe('morning');
  });

  test('exakt am Cutoff ist Abend', () => {
    const d = new Date(2026, 5, 2, EVENING_CUTOFF_HOUR, 0);
    expect(resolveBriefingMode(d)).toBe('evening');
  });

  test('spät am Tag ist Abend', () => {
    const d = new Date(2026, 5, 2, 22, 0);
    expect(resolveBriefingMode(d)).toBe('evening');
  });
});

describe('computeFulfillment', () => {
  test('leer ergibt rate 0', () => {
    expect(computeFulfillment([])).toEqual({ done: 0, total: 0, rate: 0 });
  });

  test('teilweise erfüllt', () => {
    const list = [
      commitment({ date: '2026-06-02', status: 'done' }),
      commitment({ date: '2026-06-02', status: 'missed' }),
      commitment({ date: '2026-06-02', status: 'pending' }),
    ];
    const f = computeFulfillment(list);
    expect(f.done).toBe(1);
    expect(f.total).toBe(3);
    expect(f.rate).toBeCloseTo(1 / 3);
  });

  test('voll erfüllt', () => {
    const list = [
      commitment({ date: '2026-06-02', status: 'done' }),
      commitment({ date: '2026-06-02', status: 'done' }),
    ];
    expect(computeFulfillment(list).rate).toBe(1);
  });
});

describe('computeCommitmentStreak', () => {
  test('lückenlose Tage zählen hoch', () => {
    const days = [
      { date: '2026-05-31', hasDone: true },
      { date: '2026-06-01', hasDone: true },
      { date: '2026-06-02', hasDone: true },
    ];
    expect(computeCommitmentStreak(days, '2026-06-02')).toBe(3);
  });

  test('Lücke bricht die Streak', () => {
    const days = [
      { date: '2026-05-30', hasDone: true },
      // 2026-05-31 fehlt
      { date: '2026-06-01', hasDone: true },
      { date: '2026-06-02', hasDone: true },
    ];
    expect(computeCommitmentStreak(days, '2026-06-02')).toBe(2);
  });

  test('kein done heute ergibt 0', () => {
    const days = [
      { date: '2026-06-01', hasDone: true },
      { date: '2026-06-02', hasDone: false },
    ];
    expect(computeCommitmentStreak(days, '2026-06-02')).toBe(0);
  });

  test('leer ergibt 0', () => {
    expect(computeCommitmentStreak([], '2026-06-02')).toBe(0);
  });
});

describe('toCommitmentDays', () => {
  test('aggregiert hasDone pro Tag (oder-Verknüpfung)', () => {
    const list = [
      commitment({ date: '2026-06-01', status: 'missed' }),
      commitment({ date: '2026-06-01', status: 'done' }),
      commitment({ date: '2026-06-02', status: 'pending' }),
    ];
    const days = toCommitmentDays(list).sort((a, b) => a.date.localeCompare(b.date));
    expect(days).toEqual([
      { date: '2026-06-01', hasDone: true },
      { date: '2026-06-02', hasDone: false },
    ]);
  });
});
