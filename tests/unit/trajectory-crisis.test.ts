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
});
