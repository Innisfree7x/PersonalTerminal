import type { CreateDailyTaskInput } from '@/lib/schemas/dailyTask.schema';
import type { DailyTaskRecord, UpdateDailyTaskInput } from '@/lib/supabase/dailyTasks';

export interface DailyTaskRepository {
  createTask(userId: string, data: CreateDailyTaskInput): Promise<DailyTaskRecord>;
  updateTask(userId: string, taskId: string, data: UpdateDailyTaskInput): Promise<DailyTaskRecord>;
  deleteTask(userId: string, taskId: string): Promise<void>;
}
