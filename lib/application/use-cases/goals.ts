import type { CreateGoalInput, Goal } from '@/lib/schemas/goal.schema';
import type { GoalRepository } from '@/lib/application/ports/goal-repository';

export async function fetchUserGoals(repository: GoalRepository, userId: string): Promise<Goal[]> {
  return repository.fetchGoals(userId);
}

export async function createUserGoal(
  repository: GoalRepository,
  userId: string,
  data: CreateGoalInput
): Promise<Goal> {
  return repository.createGoal(userId, data);
}

export async function updateUserGoal(
  repository: GoalRepository,
  userId: string,
  goalId: string,
  data: Partial<CreateGoalInput>
): Promise<Goal> {
  return repository.updateGoal(userId, goalId, data);
}

export async function deleteUserGoal(
  repository: GoalRepository,
  userId: string,
  goalId: string
): Promise<void> {
  return repository.deleteGoal(userId, goalId);
}
