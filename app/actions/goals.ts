'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth/server';
import { createGoalSchema, type CreateGoalInput, type Goal } from '@/lib/schemas/goal.schema';
import { goalRepository } from '@/lib/infrastructure/supabase/repositories/goalRepository';
import { createUserGoal, deleteUserGoal, fetchUserGoals, updateUserGoal } from '@/lib/application/use-cases/goals';

export async function createGoalAction(data: CreateGoalInput): Promise<Goal> {
  const user = await requireAuth();
  const validated = createGoalSchema.parse(data);
  const goal = await createUserGoal(goalRepository, user.id, validated);
  revalidatePath('/goals');
  return goal;
}

export async function updateGoalAction(goalId: string, data: CreateGoalInput): Promise<Goal> {
  const user = await requireAuth();
  const parsed = createGoalSchema.partial().parse(data);
  const validated = Object.fromEntries(
    Object.entries(parsed).filter(([, value]) => value !== undefined)
  ) as Partial<CreateGoalInput>;
  const goal = await updateUserGoal(goalRepository, user.id, goalId, validated);
  revalidatePath('/goals');
  return goal;
}

export async function deleteGoalAction(goalId: string): Promise<void> {
  const user = await requireAuth();
  await deleteUserGoal(goalRepository, user.id, goalId);
  revalidatePath('/goals');
}

export async function fetchGoalsAction(): Promise<Goal[]> {
  const user = await requireAuth();
  return fetchUserGoals(goalRepository, user.id);
}
