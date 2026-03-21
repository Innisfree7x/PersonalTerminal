import { describe, expect, it } from 'vitest';
import {
  getDateKeyDaysAgo,
  getYesterdayReaction,
  startOfDateKeyLocal,
} from '@/lib/lucian/memory';

describe('lucian memory helpers', () => {
  it('builds stable local date keys for previous days', () => {
    const base = new Date('2026-03-21T12:00:00+01:00');

    expect(getDateKeyDaysAgo(0, base)).toBe('2026-03-21');
    expect(getDateKeyDaysAgo(1, base)).toBe('2026-03-20');
    expect(getDateKeyDaysAgo(7, base)).toBe('2026-03-14');
  });

  it('parses date keys into local midnight timestamps', () => {
    const timestamp = startOfDateKeyLocal('2026-03-20');
    const date = new Date(timestamp);

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(20);
    expect(date.getHours()).toBe(0);
  });

  it('returns a streak-broken recovery reaction when streak did not hold', () => {
    const reaction = getYesterdayReaction({
      tasksCompleted: 1,
      tasksTotal: 3,
      focusMinutes: 20,
      streakMaintained: false,
    });

    expect(reaction).toEqual({
      mood: 'recovery',
      text: 'Streak gerissen. Passiert. Heute startet der neue.',
      priority: 2,
    });
  });
});
