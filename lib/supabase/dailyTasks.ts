import { createClient } from '@/lib/auth/server';
import type { CreateDailyTaskInput } from '@/lib/schemas/dailyTask.schema';
import type { Database } from '@/lib/supabase/types';

type DailyTaskInsert = Database['public']['Tables']['daily_tasks']['Insert'];
type DailyTaskUpdate = Database['public']['Tables']['daily_tasks']['Update'];
type DailyTaskRow = Database['public']['Tables']['daily_tasks']['Row'];

export interface DailyTaskRecord {
  id: string;
  date: string;
  title: string;
  completed: boolean;
  source: string | null;
  sourceId: string | null;
  timeEstimate: string | null;
  createdAt: string;
}

export type UpdateDailyTaskInput = Partial<
  Pick<CreateDailyTaskInput, 'title' | 'completed' | 'timeEstimate'>
>;

function toDailyTaskRecord(task: DailyTaskRow): DailyTaskRecord {
  return {
    id: task.id,
    date: task.date,
    title: task.title,
    completed: task.completed,
    source: task.source,
    sourceId: task.source_id,
    timeEstimate: task.time_estimate,
    createdAt: task.created_at,
  };
}

export async function createDailyTask(
  userId: string,
  data: CreateDailyTaskInput
): Promise<DailyTaskRecord> {
  const supabase = createClient();

  const insertData: DailyTaskInsert = {
    user_id: userId,
    date: data.date,
    title: data.title,
    completed: data.completed ?? false,
    source: data.source || null,
    source_id: data.sourceId || null,
    time_estimate: data.timeEstimate || null,
  };

  const { data: created, error } = await supabase
    .from('daily_tasks')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create daily task: ${error.message}`);
  }

  return toDailyTaskRecord(created);
}

export async function updateDailyTask(
  userId: string,
  taskId: string,
  data: UpdateDailyTaskInput
): Promise<DailyTaskRecord> {
  const supabase = createClient();

  const updateData: Partial<DailyTaskUpdate> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.completed !== undefined) updateData.completed = data.completed;
  if (data.timeEstimate !== undefined) updateData.time_estimate = data.timeEstimate;

  if (Object.keys(updateData).length === 0) {
    throw new Error('No fields to update');
  }

  const { data: updated, error } = await supabase
    .from('daily_tasks')
    .update(updateData)
    .eq('id', taskId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update daily task: ${error.message}`);
  }

  return toDailyTaskRecord(updated);
}

export async function deleteDailyTask(userId: string, taskId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('daily_tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete daily task: ${error.message}`);
  }
}
