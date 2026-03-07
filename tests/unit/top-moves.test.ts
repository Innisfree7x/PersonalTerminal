import { describe, expect, it } from 'vitest';
import type { RankedExecutionCandidate } from '@/lib/application/use-cases/execution-engine';
import { buildWindowMoveCandidates, resolveMoveDestination } from '@/lib/dashboard/topMoves';

function candidate(input: Partial<RankedExecutionCandidate>): RankedExecutionCandidate {
  return {
    id: 'move-1',
    type: 'daily-task',
    title: 'Default move',
    score: 42,
    urgencyLabel: 'normal',
    reasons: [],
    impact: 3,
    effort: 3,
    payload: {},
    ...input,
  };
}

describe('dashboard top moves helpers', () => {
  it('resolves contextual destination urls by move type', () => {
    expect(
      resolveMoveDestination(
        candidate({ type: 'daily-task', payload: { taskId: 't-1' } })
      ).href
    ).toContain('/today?source=top_moves&taskId=t-1');

    expect(
      resolveMoveDestination(
        candidate({ type: 'homework', payload: { courseId: 'c-1', exerciseNumber: 7 } })
      ).href
    ).toContain('/university?source=top_moves&courseId=c-1&exerciseNumber=7');

    expect(
      resolveMoveDestination(
        candidate({ type: 'goal', payload: { goalId: 'g-1' } })
      ).href
    ).toContain('/goals?source=top_moves&goalId=g-1');

    expect(
      resolveMoveDestination(
        candidate({ type: 'interview', payload: { applicationId: 'a-1' } })
      ).href
    ).toContain('/career?source=top_moves&applicationId=a-1');
  });

  it('builds upcoming opportunity window candidates sorted by start date', () => {
    const windows = [
      { id: 'w-3', title: 'Master cycle', startDate: '2026-06-20', endDate: '2026-07-20', confidence: 'medium' as const },
      { id: 'w-1', title: 'Internship Q2', startDate: '2026-05-05', endDate: '2026-06-05', confidence: 'high' as const },
      { id: 'w-2', title: 'Internship Q3', startDate: '2026-05-15', endDate: '2026-06-15', confidence: 'medium' as const },
    ];

    const result = buildWindowMoveCandidates(windows, {
      now: new Date('2026-05-01T00:00:00.000Z'),
      maxDaysUntilStart: 45,
      limit: 2,
    });

    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe('w-1');
    expect(result[1]?.id).toBe('w-2');
    expect(result[0]?.subtitle).toContain('in 4d');
  });

  it('filters out windows outside the configured horizon', () => {
    const result = buildWindowMoveCandidates(
      [
        { id: 'w-old', title: 'Old', startDate: '2026-04-01', endDate: '2026-04-20', confidence: 'low' as const },
        { id: 'w-far', title: 'Far', startDate: '2026-09-01', endDate: '2026-10-01', confidence: 'medium' as const },
      ],
      {
        now: new Date('2026-05-01T00:00:00.000Z'),
        maxDaysUntilStart: 45,
      }
    );

    expect(result).toHaveLength(0);
  });
});
