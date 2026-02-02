import { supabase } from './client';
import { Goal, CreateGoalInput } from '@/lib/schemas/goal.schema';
import { SupabaseGoal, Database } from './types';

type GoalInsert = Database['public']['Tables']['goals']['Insert'];
type GoalUpdate = Database['public']['Tables']['goals']['Update'];

/**
 * Converts Supabase Goal Row to our Goal type
 */
export function supabaseGoalToGoal(row: SupabaseGoal): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    targetDate: new Date(row.target_date),
    category: row.category,
    metrics: row.metrics_current !== null && row.metrics_target !== null && row.metrics_unit
      ? {
          current: row.metrics_current,
          target: row.metrics_target,
          unit: row.metrics_unit,
        }
      : undefined,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Converts our Goal type to Supabase Insert format
 */
export function goalToSupabaseInsert(goal: CreateGoalInput): GoalInsert {
  return {
    title: goal.title,
    description: goal.description || null,
    target_date: goal.targetDate.toISOString().split('T')[0], // YYYY-MM-DD format
    category: goal.category,
    metrics_current: goal.metrics?.current ?? null,
    metrics_target: goal.metrics?.target ?? null,
    metrics_unit: goal.metrics?.unit ?? null,
  };
}

/**
 * Fetch all goals from Supabase
 */
export async function fetchGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch goals: ${error.message}`);
  }

  return data.map(supabaseGoalToGoal);
}

/**
 * Create a new goal in Supabase
 */
export async function createGoal(goal: CreateGoalInput): Promise<Goal> {
  const insertData = goalToSupabaseInsert(goal);

  const { data, error } = await supabase
    .from('goals')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create goal: ${error.message}`);
  }

  return supabaseGoalToGoal(data);
}

/**
 * Update an existing goal in Supabase
 */
export async function updateGoal(goalId: string, goal: CreateGoalInput): Promise<Goal> {
  const updateData: GoalUpdate = {
    ...goalToSupabaseInsert(goal),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('goals')
    .update(updateData)
    .eq('id', goalId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update goal: ${error.message}`);
  }

  return supabaseGoalToGoal(data);
}

/**
 * Delete a goal from Supabase
 */
export async function deleteGoal(goalId: string): Promise<void> {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId);

  if (error) {
    throw new Error(`Failed to delete goal: ${error.message}`);
  }
}
