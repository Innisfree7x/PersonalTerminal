import { describe, expect, it } from 'vitest';
import { buildTrajectoryMorningBriefing, type TrajectoryBriefOverview } from '@/lib/dashboard/trajectoryBriefing';

describe('buildTrajectoryMorningBriefing', () => {
  const baseOverview: TrajectoryBriefOverview = {
    goals: [
      { id: 'g1', title: 'GMAT', dueDate: '2026-11-30', status: 'active' },
      { id: 'g2', title: 'Thesis', dueDate: '2026-10-15', status: 'active' },
      { id: 'g3', title: 'Done Goal', dueDate: '2026-08-01', status: 'done' },
    ],
    computed: {
      generatedBlocks: [
        { goalId: 'g1', startDate: '2026-08-01', status: 'tight' },
        { goalId: 'g2', startDate: '2026-07-01', status: 'on_track' },
      ],
    },
  };

  it('returns the nearest active goal briefing with matching status', () => {
    const result = buildTrajectoryMorningBriefing(baseOverview, new Date('2026-10-01T00:00:00.000Z'));
    expect(result).not.toBeNull();
    expect(result?.goalId).toBe('g2');
    expect(result?.title).toBe('Thesis');
    expect(result?.status).toBe('on_track');
    expect(result?.statusLabel).toBe('on track');
    expect(result?.startDate).toBe('2026-07-01');
  });

  it('returns null when no active goal has a computed block', () => {
    const result = buildTrajectoryMorningBriefing(
      {
        goals: [{ id: 'g1', title: 'GMAT', dueDate: '2026-11-30', status: 'active' }],
        computed: { generatedBlocks: [] },
      },
      new Date('2026-10-01T00:00:00.000Z')
    );
    expect(result).toBeNull();
  });

  it('never returns negative daysUntil', () => {
    const result = buildTrajectoryMorningBriefing(
      {
        goals: [{ id: 'g1', title: 'Past Goal', dueDate: '2026-01-01', status: 'active' }],
        computed: { generatedBlocks: [{ goalId: 'g1', startDate: '2025-12-01', status: 'at_risk' }] },
      },
      new Date('2026-10-01T00:00:00.000Z')
    );
    expect(result?.daysUntil).toBe(0);
    expect(result?.statusLabel).toBe('at risk');
  });
});
