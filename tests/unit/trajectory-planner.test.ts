import { describe, expect, it } from 'vitest';
import { buildTaskPackageDates, computeTrajectoryPlan } from '@/lib/trajectory/planner';

describe('trajectory planner', () => {
  it('marks goal as at_risk when required start is in the past', () => {
    const result = computeTrajectoryPlan({
      goals: [
        {
          id: 'goal-1',
          title: 'GMAT Prep',
          dueDate: '2026-03-10',
          effortHours: 40,
          bufferWeeks: 0,
          status: 'active',
          commitmentMode: 'flexible',
        },
      ],
      capacityHoursPerWeek: 8,
      today: '2026-03-09',
    });

    expect(result.generatedBlocks[0]?.status).toBe('at_risk');
    expect(result.generatedBlocks[0]?.reasons).toContain('required_start_in_past');
  });

  it('marks exact 25% overlap as tight', () => {
    const result = computeTrajectoryPlan({
      goals: [
        {
          id: 'goal-1',
          title: 'Master Applications',
          dueDate: '2026-04-30',
          effortHours: 28,
          bufferWeeks: 0,
          status: 'active',
          commitmentMode: 'flexible',
        },
      ],
      existingBlocks: [
        {
          goalId: 'goal-existing',
          startDate: '2026-04-10',
          endDate: '2026-04-16',
          weeklyHours: 7,
          status: 'planned',
        },
      ],
      capacityHoursPerWeek: 7,
      today: '2026-03-01',
    });

    expect(result.generatedBlocks[0]?.overlapRatio).toBeCloseTo(0.25, 2);
    expect(result.generatedBlocks[0]?.status).toBe('tight');
  });

  it('marks 50% overlap as at_risk', () => {
    const result = computeTrajectoryPlan({
      goals: [
        {
          id: 'goal-1',
          title: 'Internship Push',
          dueDate: '2026-04-30',
          effortHours: 20,
          bufferWeeks: 0,
          status: 'active',
          commitmentMode: 'flexible',
        },
      ],
      existingBlocks: [
        {
          goalId: 'goal-existing',
          startDate: '2026-04-17',
          endDate: '2026-04-23',
          weeklyHours: 10,
          status: 'planned',
        },
      ],
      capacityHoursPerWeek: 10,
      today: '2026-03-01',
    });

    expect(result.generatedBlocks[0]?.overlapRatio).toBeCloseTo(0.5, 2);
    expect(result.generatedBlocks[0]?.status).toBe('at_risk');
  });

  it('builds deterministic task package dates', () => {
    const dates = buildTaskPackageDates('2026-03-01', '2026-03-10', 4);
    expect(dates).toEqual(['2026-03-01', '2026-03-03', '2026-03-06', '2026-03-08']);
  });
});
