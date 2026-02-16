import type { CreateDailyTaskInput } from '@/lib/schemas/dailyTask.schema';
import type { DailyTaskRepository } from '@/lib/application/ports/daily-task-repository';
import type { DailyTaskRecord, UpdateDailyTaskInput } from '@/lib/supabase/dailyTasks';

export async function createUserDailyTask(
  repository: DailyTaskRepository,
  userId: string,
  data: CreateDailyTaskInput
): Promise<DailyTaskRecord> {
  return repository.createTask(userId, data);
}

export async function updateUserDailyTask(
  repository: DailyTaskRepository,
  userId: string,
  taskId: string,
  data: UpdateDailyTaskInput
): Promise<DailyTaskRecord> {
  return repository.updateTask(userId, taskId, data);
}

export async function deleteUserDailyTask(
  repository: DailyTaskRepository,
  userId: string,
  taskId: string
): Promise<void> {
  return repository.deleteTask(userId, taskId);
}
