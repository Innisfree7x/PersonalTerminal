import type { GoalRepository } from '@/lib/application/ports/goal-repository';
import { fetchGoals, createGoal, updateGoal, deleteGoal } from '@/lib/supabase/goals';
import type { Goal } from '@/lib/schemas/goal.schema';

export const goalRepository: GoalRepository = {
  async fetchGoals(userId: string): Promise<Goal[]> {
    const { goals } = await fetchGoals({ userId, limit: 200 });
    return goals;
  },
  createGoal,
  updateGoal,
  deleteGoal,
};
