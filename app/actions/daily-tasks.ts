'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth/server';
import { createDailyTaskSchema, type CreateDailyTaskInput } from '@/lib/schemas/dailyTask.schema';
import { dailyTaskRepository } from '@/lib/infrastructure/supabase/repositories/dailyTaskRepository';
import { recordFlowMetric } from '@/lib/ops/flowMetrics';
import {
  createUserDailyTask,
  updateUserDailyTask,
  deleteUserDailyTask,
} from '@/lib/application/use-cases/daily-tasks';
import type { UpdateDailyTaskInput } from '@/lib/supabase/dailyTasks';

type CreateDailyTaskActionInput = Omit<CreateDailyTaskInput, 'completed'> & { completed?: boolean };

export async function createDailyTaskAction(data: CreateDailyTaskActionInput) {
  const startedAt = Date.now();
  let userId: string | null = null;

  try {
    const user = await requireAuth();
    userId = user.id;
    const validated = createDailyTaskSchema.parse(data);
    const created = await createUserDailyTask(dailyTaskRepository, user.id, validated);

    revalidatePath('/today');

    await recordFlowMetric({
      flow: 'create_task',
      status: 'success',
      durationMs: Date.now() - startedAt,
      userId,
      route: '/today',
      context: {
        source: validated.source ?? 'manual',
        hasTimeEstimate: Boolean(validated.timeEstimate),
      },
    });

    return created;
  } catch (error) {
    if (userId) {
      await recordFlowMetric({
        flow: 'create_task',
        status: 'failure',
        durationMs: Date.now() - startedAt,
        userId,
        route: '/today',
        errorCode: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
      });
    }
    throw error;
  }
}

export async function updateDailyTaskAction(
  id: string,
  data: UpdateDailyTaskInput
) {
  const user = await requireAuth();
  const updated = await updateUserDailyTask(dailyTaskRepository, user.id, id, data);

  revalidatePath('/today');
  return updated;
}

export async function deleteDailyTaskAction(id: string): Promise<void> {
  const user = await requireAuth();
  await deleteUserDailyTask(dailyTaskRepository, user.id, id);

  revalidatePath('/today');
}
