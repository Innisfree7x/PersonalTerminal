import type { DailyTaskRepository } from '@/lib/application/ports/daily-task-repository';
import {
  createDailyTask,
  updateDailyTask,
  deleteDailyTask,
} from '@/lib/supabase/dailyTasks';

export const dailyTaskRepository: DailyTaskRepository = {
  createTask: createDailyTask,
  updateTask: updateDailyTask,
  deleteTask: deleteDailyTask,
};
