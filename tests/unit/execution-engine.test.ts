import { addDays } from 'date-fns';
import { describe, expect, test } from 'vitest';
import {
  computeDailyExecutionScore,
  pickNextBestAction,
  rankExecutionCandidates,
  type ExecutionCandidate,
} from '@/lib/application/use-cases/execution-engine';

describe('execution-engine', () => {
  test('prioritizes overdue/high-impact items first', () => {
    const candidates: ExecutionCandidate[] = [
      {
        id: 'goal-1',
        type: 'goal',
        title: 'Update portfolio',
        dueDate: addDays(new Date(), 3),
        impact: 4,
        effort: 3,
        payload: { goalId: 'goal-1' },
      },
      {
        id: 'interview-1',
        type: 'interview',
        title: 'Interview prep',
        dueDate: addDays(new Date(), -1),
        impact: 5,
        effort: 2,
        payload: { applicationId: 'app-1' },
      },
    ];

    const ranked = rankExecutionCandidates(candidates);
    expect(ranked[0]?.id).toBe('interview-1');
    expect(ranked[0]?.urgencyLabel).toBe('overdue');
  });

  test('returns primary plus two alternatives max', () => {
    const candidates: ExecutionCandidate[] = [
      {
        id: 'a',
        type: 'daily-task',
        title: 'A',
        impact: 3,
        effort: 2,
        payload: { taskId: 'a' },
      },
      {
        id: 'b',
        type: 'daily-task',
        title: 'B',
        impact: 4,
        effort: 3,
        payload: { taskId: 'b' },
      },
      {
        id: 'c',
        type: 'homework',
        title: 'C',
        impact: 4,
        effort: 3,
        payload: { courseId: 'c', exerciseNumber: 1 },
      },
      {
        id: 'd',
        type: 'goal',
        title: 'D',
        impact: 2,
        effort: 2,
        payload: { goalId: 'd' },
      },
    ];

    const result = pickNextBestAction(candidates);
    expect(result.primary).not.toBeNull();
    expect(result.alternatives).toHaveLength(2);
  });

  test('computes execution score with penalties and bonuses', () => {
    const high = computeDailyExecutionScore({
      openCandidates: 4,
      overdueCandidates: 0,
      completedToday: 5,
      plannedToday: 5,
    });

    const low = computeDailyExecutionScore({
      openCandidates: 14,
      overdueCandidates: 3,
      completedToday: 1,
      plannedToday: 8,
    });

    expect(high).toBeGreaterThan(low);
    expect(high).toBeGreaterThanOrEqual(80);
    expect(low).toBeLessThanOrEqual(45);
  });
});
