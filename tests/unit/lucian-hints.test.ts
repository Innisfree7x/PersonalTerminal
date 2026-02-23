import { describe, expect, test } from 'vitest';
import { getLucianHint, type LucianContext } from '@/lib/lucian/hints';

function createContext(overrides: Partial<LucianContext> = {}): LucianContext {
  return {
    courses: [],
    todayTasks: [],
    recentSessions: [],
    applications: [],
    nowIso: '2026-02-23T15:00:00',
    ...overrides,
  };
}

describe('lucian hints', () => {
  test('returns critical warning for exam today', () => {
    const hint = getLucianHint(
      createContext({
        nowIso: '2026-02-23T10:00:00',
        courses: [{ name: 'LA II', examDate: '2026-02-23' }],
      }),
    );

    expect(hint).not.toBeNull();
    expect(hint?.priority).toBe(0);
    expect(hint?.mood).toBe('warning');
    expect(hint?.text).toContain('LA II');
  });

  test('returns urgent warning when exam is near and focus is stale', () => {
    const hint = getLucianHint(
      createContext({
        nowIso: '2026-02-23T16:20:00',
        courses: [{ name: 'Theo Info', examDate: '2026-02-28' }],
        recentSessions: [{ startedAt: '2026-02-20T07:30:00', durationSeconds: 1800 }],
      }),
    );

    expect(hint).not.toBeNull();
    expect(hint?.priority).toBe(1);
    expect(hint?.mood).toBe('warning');
    expect(hint?.text).toContain('Theo Info');
  });

  test('returns early idle warning for exam in two weeks window', () => {
    const hint = getLucianHint(
      createContext({
        nowIso: '2026-02-23T09:00:00',
        courses: [{ name: 'Diskrete Mathe', examDate: '2026-03-05' }],
      }),
    );

    expect(hint).not.toBeNull();
    expect(hint?.priority).toBe(2);
    expect(hint?.mood).toBe('idle');
    expect(hint?.text).toContain('Diskrete Mathe');
  });

  test('returns task-pressure warning after 14:00 with no completed tasks', () => {
    const hint = getLucianHint(
      createContext({
        nowIso: '2026-02-23T14:15:00',
        todayTasks: [
          { title: 'Übungsblatt', completed: false, date: '2026-02-23' },
          { title: 'Bewerbung', completed: false, date: '2026-02-23' },
        ],
      }),
    );

    expect(hint).not.toBeNull();
    expect(hint?.priority).toBe(3);
    expect(hint?.mood).toBe('warning');
  });

  test('picks the stalest active application first', () => {
    const hint = getLucianHint(
      createContext({
        nowIso: '2026-02-25T12:00:00',
        applications: [
          { company: 'Apex Labs', status: 'pending', updatedAt: '2026-01-30T09:00:00' },
          { company: 'Nexa Systems', status: 'interview', updatedAt: '2026-02-08T09:00:00' },
          { company: 'Rejected Corp', status: 'rejected', updatedAt: '2026-01-01T09:00:00' },
        ],
      }),
    );

    expect(hint).not.toBeNull();
    expect(hint?.priority).toBe(3);
    expect(hint?.mood).toBe('idle');
    expect(hint?.text).toContain('Apex Labs');
  });

  test('returns null when nothing is urgent', () => {
    const hint = getLucianHint(
      createContext({
        nowIso: '2026-02-23T10:30:00',
        todayTasks: [{ title: 'Read notes', completed: true, date: '2026-02-23' }],
        recentSessions: [{ startedAt: '2026-02-23T08:00:00', durationSeconds: 1500 }],
      }),
    );

    expect(hint).toBeNull();
  });
});
