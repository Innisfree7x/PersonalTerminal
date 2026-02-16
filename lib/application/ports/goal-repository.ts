import type { CreateGoalInput, Goal } from '@/lib/schemas/goal.schema';

export interface GoalRepository {
  fetchGoals(userId: string): Promise<Goal[]>;
  createGoal(userId: string, data: CreateGoalInput): Promise<Goal>;
  updateGoal(userId: string, goalId: string, data: Partial<CreateGoalInput>): Promise<Goal>;
  deleteGoal(userId: string, goalId: string): Promise<void>;
}
