import { Goal, Metrics } from '@/lib/schemas/goal.schema';

/**
 * Calculates progress percentage for a goal with metrics
 * Returns a number between 0 and 100
 */
export function calculateProgress(metrics: Metrics): number {
  if (metrics.target === 0) return 0;
  return Math.min(Math.round((metrics.current / metrics.target) * 100), 100);
}

/**
 * Converts a Goal to CreateGoalInput for editing
 */
export function goalToCreateInput(goal: Goal): Omit<Goal, 'id' | 'createdAt'> {
  const { id, createdAt, ...rest } = goal;
  return rest;
}
