import { describe, expect, it } from 'vitest';
import { detectCrises } from '@/lib/trajectory/crisis';

describe('detectCrises', () => {
  it('returns empty report when no goals', () => {
    const report = detectCrises({ goals: [], today: '2026-04-19' });
    expect(report.collisions).toEqual([]);
    expect(report.hasCrisis).toBe(false);
  });

  it('flags two overlapping fixed goals as FIXED_WINDOW_COLLISION', () => {
    const report = detectCrises({
      today: '2026-04-19',
      goals: [
        { id: 'a', title: 'Praktikum', status: 'active', effortHours: 640, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' },
        { id: 'b', title: 'Festival-Job', status: 'active', effortHours: 160, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-09-15', fixedEndDate: '2026-10-15' },
      ],
    });
    expect(report.collisions).toHaveLength(1);
    expect(report.collisions[0]?.code).toBe('FIXED_WINDOW_COLLISION');
    expect(report.collisions[0]?.conflictingGoalIds).toEqual(['a', 'b']);
    expect(report.hasCrisis).toBe(true);
  });

  it('does not flag disjoint fixed goals', () => {
    const report = detectCrises({
      today: '2026-04-19',
      goals: [
        { id: 'a', title: 'Job1', status: 'active', effortHours: 160, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' },
        { id: 'b', title: 'Job2', status: 'active', effortHours: 160, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-10-01', fixedEndDate: '2026-10-31' },
      ],
    });
    expect(report.collisions).toEqual([]);
  });

  it('deduplicates two fixed goals with identical window', () => {
    const report = detectCrises({
      today: '2026-04-19',
      goals: [
        { id: 'a', title: 'A', status: 'active', effortHours: 160, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' },
        { id: 'b', title: 'B', status: 'active', effortHours: 160, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' },
      ],
    });
    expect(report.collisions).toHaveLength(1);
    expect(report.collisions[0]?.conflictingGoalIds).toEqual(['a', 'b']);
  });

  it('flags fixed goal blocking a lead-time prep window as FIXED_BLOCKS_PREP', () => {
    const report = detectCrises({
      today: '2026-04-19',
      goals: [
        { id: 'praktikum', title: 'Praktikum', status: 'active', effortHours: 640, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-09-01', fixedEndDate: '2026-10-31' },
        { id: 'gmat', title: 'GMAT', status: 'active', effortHours: 200, bufferWeeks: 2,
          commitmentMode: 'lead-time', dueDate: '2027-04-15', leadTimeWeeks: 26 },
      ],
    });
    expect(report.collisions).toHaveLength(1);
    expect(report.collisions[0]?.code).toBe('FIXED_BLOCKS_PREP');
    expect(report.collisions[0]?.conflictingGoalIds).toEqual(['gmat', 'praktikum']);
  });

  it('flags fixed goal blocking a flexible prep window as FIXED_BLOCKS_PREP', () => {
    const report = detectCrises({
      today: '2026-04-19',
      goals: [
        { id: 'thesis', title: 'Thesis', status: 'active', effortHours: 400, bufferWeeks: 2,
          commitmentMode: 'flexible', dueDate: '2026-11-30' },
        { id: 'praktikum', title: 'Praktikum', status: 'active', effortHours: 640, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' },
      ],
    });
    expect(report.collisions.some((c) => c.code === 'FIXED_BLOCKS_PREP')).toBe(true);
  });

  it('flags lead-time goal with insufficient remaining time', () => {
    const report = detectCrises({
      today: '2027-03-01',
      goals: [
        { id: 'gmat', title: 'GMAT', status: 'active', effortHours: 150, bufferWeeks: 1,
          commitmentMode: 'lead-time', dueDate: '2027-04-15', leadTimeWeeks: 26 },
      ],
    });
    expect(report.collisions.some((c) => c.code === 'LEAD_TIME_TOO_SHORT')).toBe(true);
    expect(report.collisions[0]?.conflictingGoalIds).toEqual(['gmat']);
  });

  it('flags flexible goal with no free contiguous slot', () => {
    const report = detectCrises({
      today: '2026-04-19',
      goals: [
        { id: 'thesis', title: 'Thesis', status: 'active', effortHours: 160, bufferWeeks: 0,
          commitmentMode: 'flexible', dueDate: '2026-07-31' },
        { id: 'f1', title: 'Block 1', status: 'active', effortHours: 40, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-04-20', fixedEndDate: '2026-05-15' },
        { id: 'f2', title: 'Block 2', status: 'active', effortHours: 40, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-05-20', fixedEndDate: '2026-06-15' },
        { id: 'f3', title: 'Block 3', status: 'active', effortHours: 40, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-06-18', fixedEndDate: '2026-07-15' },
      ],
    });
    expect(report.collisions.some((c) => c.code === 'NO_FLEXIBLE_SLOT' && c.conflictingGoalIds[0] === 'thesis')).toBe(true);
  });

  it('does not flag flexible goal when an adequate slot exists', () => {
    const report = detectCrises({
      today: '2026-04-19',
      goals: [
        { id: 'thesis', title: 'Thesis', status: 'active', effortHours: 160, bufferWeeks: 0,
          commitmentMode: 'flexible', dueDate: '2026-12-31' },
      ],
    });
    expect(report.collisions.some((c) => c.code === 'NO_FLEXIBLE_SLOT')).toBe(false);
  });

  it('sorts collisions by window.startDate ascending', () => {
    const report = detectCrises({
      today: '2026-04-19',
      goals: [
        { id: 'a', title: 'A', status: 'active', effortHours: 40, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-11-01', fixedEndDate: '2026-11-30' },
        { id: 'b', title: 'B', status: 'active', effortHours: 40, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-11-15', fixedEndDate: '2026-12-15' },
        { id: 'c', title: 'C', status: 'active', effortHours: 40, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-08-01', fixedEndDate: '2026-08-31' },
        { id: 'd', title: 'D', status: 'active', effortHours: 40, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-08-15', fixedEndDate: '2026-09-15' },
      ],
    });
    const starts = report.collisions.map((c) => c.window.startDate);
    const sorted = [...starts].sort();
    expect(starts).toEqual(sorted);
  });

  it('dedups identical (code, ids, startDate) tuples', () => {
    const report = detectCrises({
      today: '2026-04-19',
      goals: [
        { id: 'a', title: 'A', status: 'active', effortHours: 40, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' },
        { id: 'b', title: 'B', status: 'active', effortHours: 40, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' },
      ],
    });
    const tuples = report.collisions.map(
      (c) => `${c.code}|${c.conflictingGoalIds.join(',')}|${c.window.startDate}`
    );
    expect(new Set(tuples).size).toBe(tuples.length);
  });

  describe('edge cases', () => {
    const base = <T extends Record<string, unknown>>(overrides: T) => ({
      id: 'x',
      title: 'X',
      status: 'active' as const,
      effortHours: 40,
      bufferWeeks: 0,
      ...overrides,
    });

    it('filters out done goals', () => {
      const report = detectCrises({
        today: '2026-04-19',
        goals: [
          base({ id: 'a', status: 'done' as const, commitmentMode: 'fixed' as const,
                 fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' }),
          base({ id: 'b', commitmentMode: 'fixed' as const,
                 fixedStartDate: '2026-09-15', fixedEndDate: '2026-10-15' }),
        ],
      });
      expect(report.collisions).toEqual([]);
    });

    it('filters out archived goals', () => {
      const report = detectCrises({
        today: '2026-04-19',
        goals: [
          base({ id: 'a', status: 'archived' as const, commitmentMode: 'fixed' as const,
                 fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' }),
          base({ id: 'b', commitmentMode: 'fixed' as const,
                 fixedStartDate: '2026-09-15', fixedEndDate: '2026-10-15' }),
        ],
      });
      expect(report.collisions).toEqual([]);
    });

    it('filters out fixed goals ending before today', () => {
      const report = detectCrises({
        today: '2026-04-19',
        goals: [
          base({ id: 'a', commitmentMode: 'fixed' as const,
                 fixedStartDate: '2025-01-01', fixedEndDate: '2025-12-31' }),
          base({ id: 'b', commitmentMode: 'fixed' as const,
                 fixedStartDate: '2025-06-01', fixedEndDate: '2025-11-30' }),
        ],
      });
      expect(report.collisions).toEqual([]);
    });

    it('filters out lead-time goals with eventDate in past', () => {
      const report = detectCrises({
        today: '2026-04-19',
        goals: [
          base({ id: 'a', commitmentMode: 'lead-time' as const,
                 dueDate: '2025-12-31', leadTimeWeeks: 12 }),
        ],
      });
      expect(report.collisions).toEqual([]);
    });

    it('treats single-day fixed window as inclusive', () => {
      const report = detectCrises({
        today: '2026-04-19',
        goals: [
          base({ id: 'a', commitmentMode: 'fixed' as const,
                 fixedStartDate: '2026-09-15', fixedEndDate: '2026-09-15' }),
          base({ id: 'b', commitmentMode: 'fixed' as const,
                 fixedStartDate: '2026-09-15', fixedEndDate: '2026-09-15' }),
        ],
      });
      expect(report.collisions).toHaveLength(1);
      expect(report.collisions[0]?.code).toBe('FIXED_WINDOW_COLLISION');
    });

    it('does not flag adjacent disjoint fixed windows (end N, start N+1)', () => {
      const report = detectCrises({
        today: '2026-04-19',
        goals: [
          base({ id: 'a', commitmentMode: 'fixed' as const,
                 fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' }),
          base({ id: 'b', commitmentMode: 'fixed' as const,
                 fixedStartDate: '2026-10-01', fixedEndDate: '2026-10-31' }),
        ],
      });
      expect(report.collisions).toEqual([]);
    });

    it('flags shared-day fixed windows (end N, start N)', () => {
      const report = detectCrises({
        today: '2026-04-19',
        goals: [
          base({ id: 'a', commitmentMode: 'fixed' as const,
                 fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' }),
          base({ id: 'b', commitmentMode: 'fixed' as const,
                 fixedStartDate: '2026-09-30', fixedEndDate: '2026-10-31' }),
        ],
      });
      expect(report.collisions).toHaveLength(1);
    });

    it('returns empty for single flexible goal with plenty of time', () => {
      const report = detectCrises({
        today: '2026-04-19',
        goals: [
          base({ id: 'a', commitmentMode: 'flexible' as const, dueDate: '2027-12-31', effortHours: 40 }),
        ],
      });
      expect(report.collisions).toEqual([]);
    });

    it('handles effortHours=0 flexible without crashing', () => {
      const report = detectCrises({
        today: '2026-04-19',
        goals: [
          base({ id: 'a', commitmentMode: 'flexible' as const, dueDate: '2027-12-31', effortHours: 0 }),
        ],
      });
      expect(report.collisions).toEqual([]);
    });

    it('skips NO_FLEXIBLE_SLOT for flexible with past dueDate (LATE_START priority)', () => {
      const report = detectCrises({
        today: '2026-04-19',
        goals: [
          base({ id: 'a', commitmentMode: 'flexible' as const, dueDate: '2026-03-01' }),
        ],
      });
      expect(report.collisions.some((c) => c.code === 'NO_FLEXIBLE_SLOT')).toBe(false);
    });

    it('dedupes duplicate goal IDs', () => {
      const report = detectCrises({
        today: '2026-04-19',
        goals: [
          base({ id: 'a', commitmentMode: 'fixed' as const,
                 fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' }),
          base({ id: 'a', commitmentMode: 'fixed' as const,
                 fixedStartDate: '2027-01-01', fixedEndDate: '2027-01-31' }),
        ],
      });
      expect(report.collisions).toEqual([]);
    });
  });
});
