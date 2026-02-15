'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth, createClient } from '@/lib/auth/server';
import { createDailyTaskSchema, type CreateDailyTaskInput } from '@/lib/schemas/dailyTask.schema';
import type { Database } from '@/lib/supabase/types';

type DailyTaskInsert = Database['public']['Tables']['daily_tasks']['Insert'];
type DailyTaskRow = Database['public']['Tables']['daily_tasks']['Row'];
type DailyTaskUpdate = Database['public']['Tables']['daily_tasks']['Update'];
type CreateDailyTaskActionInput = Omit<CreateDailyTaskInput, 'completed'> & { completed?: boolean };

function toDailyTaskResponse(task: DailyTaskRow) {
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

export async function createDailyTaskAction(data: CreateDailyTaskActionInput) {
  const user = await requireAuth();
  const supabase = createClient();
  const validated = createDailyTaskSchema.parse(data);

  const insertData: DailyTaskInsert = {
    user_id: user.id,
    date: validated.date,
    title: validated.title,
    completed: validated.completed ?? false,
    source: validated.source || null,
    source_id: validated.sourceId || null,
    time_estimate: validated.timeEstimate || null,
  };

  const { data: created, error } = await supabase
    .from('daily_tasks')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create daily task: ${error.message}`);
  }

  revalidatePath('/today');
  return toDailyTaskResponse(created);
}

export async function updateDailyTaskAction(
  id: string,
  data: Partial<Pick<CreateDailyTaskInput, 'title' | 'completed' | 'timeEstimate'>>
) {
  const user = await requireAuth();
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
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update daily task: ${error.message}`);
  }

  revalidatePath('/today');
  return toDailyTaskResponse(updated);
}

export async function deleteDailyTaskAction(id: string): Promise<void> {
  const user = await requireAuth();
  const supabase = createClient();

  const { error } = await supabase
    .from('daily_tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to delete daily task: ${error.message}`);
  }

  revalidatePath('/today');
}
