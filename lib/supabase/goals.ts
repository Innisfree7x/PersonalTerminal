import { createClient } from '@/lib/auth/server';
import { Goal, CreateGoalInput } from '@/lib/schemas/goal.schema';
import { SupabaseGoal, Database } from './types';

type GoalInsert = Database['public']['Tables']['goals']['Insert'];

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
export function goalToSupabaseInsert(goal: CreateGoalInput): Omit<GoalInsert, 'user_id'> {
  return {
    title: goal.title,
    description: goal.description || null,
    target_date: goal.targetDate.toISOString().split('T')[0] ?? '', // YYYY-MM-DD format
    category: goal.category,
    metrics_current: goal.metrics?.current ?? null,
    metrics_target: goal.metrics?.target ?? null,
    metrics_unit: goal.metrics?.unit ?? null,
  };
}

/**
 * Fetch goals from Supabase with optional pagination and filters
 */
export async function fetchGoals(options: {
  userId: string;
  page?: number;
  limit?: number;
  status?: 'active' | 'completed' | 'archived' | undefined;
  category?: 'career' | 'fitness' | 'learning' | 'finance' | undefined;
}): Promise<{ goals: Goal[]; total: number }> {
  const { userId, page = 1, limit = 20, status, category } = options;
  const supabase = createClient();

  // Build query
  let query = supabase
    .from('goals')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }
  if (category) {
    query = query.eq('category', category);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query
    .range(from, to)
    .order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch goals: ${error.message}`);
  }

  return {
    goals: (data || []).map(supabaseGoalToGoal),
    total: count || 0,
  };
}

/**
 * Create a new goal in Supabase
 */
export async function createGoal(userId: string, goal: CreateGoalInput): Promise<Goal> {
  const supabase = createClient();
  const insertData = goalToSupabaseInsert(goal);

  const { data, error } = await supabase
    .from('goals')
    .insert({ ...insertData, user_id: userId })
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
export async function updateGoal(userId: string, goalId: string, goal: Partial<CreateGoalInput>): Promise<Goal> {
  const supabase = createClient();
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  
  if (goal.title !== undefined) updateData.title = goal.title;
  if (goal.description !== undefined) updateData.description = goal.description;
  if (goal.targetDate !== undefined) {
    updateData.target_date = goal.targetDate.toISOString().split('T')[0] ?? '';
  }
  if (goal.category !== undefined) updateData.category = goal.category;
  if (goal.metrics !== undefined) {
    updateData.metrics_current = goal.metrics?.current ?? null;
    updateData.metrics_target = goal.metrics?.target ?? null;
    updateData.metrics_unit = goal.metrics?.unit ?? null;
  }

  const { data, error } = await supabase
    .from('goals')
    .update(updateData)
    .eq('id', goalId)
    .eq('user_id', userId)
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
export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete goal: ${error.message}`);
  }
}
