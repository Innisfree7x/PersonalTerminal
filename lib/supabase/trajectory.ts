import { createClient } from '@/lib/auth/server';
import type {
  CommitTrajectoryBlocksInput,
  CreateTrajectoryGoalInput,
  CreateTrajectoryTaskPackageInput,
  CreateTrajectoryWindowInput,
  UpdateTrajectoryGoalInput,
  UpdateTrajectoryWindowInput,
} from '@/lib/schemas/trajectory.schema';
import type { Database } from '@/lib/supabase/types';
import { buildTaskPackageDates } from '@/lib/trajectory/planner';

type TrajectorySettingsRow = Database['public']['Tables']['trajectory_settings']['Row'];
type TrajectorySettingsInsert = Database['public']['Tables']['trajectory_settings']['Insert'];
type TrajectorySettingsUpdate = Database['public']['Tables']['trajectory_settings']['Update'];

type TrajectoryGoalRow = Database['public']['Tables']['trajectory_goals']['Row'];
type TrajectoryGoalInsert = Database['public']['Tables']['trajectory_goals']['Insert'];
type TrajectoryGoalUpdate = Database['public']['Tables']['trajectory_goals']['Update'];

type TrajectoryWindowRow = Database['public']['Tables']['trajectory_windows']['Row'];
type TrajectoryWindowInsert = Database['public']['Tables']['trajectory_windows']['Insert'];
type TrajectoryWindowUpdate = Database['public']['Tables']['trajectory_windows']['Update'];

type TrajectoryBlockRow = Database['public']['Tables']['trajectory_blocks']['Row'];
type TrajectoryBlockInsert = Database['public']['Tables']['trajectory_blocks']['Insert'];

type DailyTaskInsert = Database['public']['Tables']['daily_tasks']['Insert'];
type DailyTaskRow = Database['public']['Tables']['daily_tasks']['Row'];

export interface TrajectorySettingsRecord {
  id: string;
  hoursPerWeek: number;
  horizonMonths: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrajectoryGoalRecord {
  id: string;
  title: string;
  category: 'thesis' | 'gmat' | 'master_app' | 'internship' | 'other';
  dueDate: string | null;
  effortHours: number;
  bufferWeeks: number;
  priority: number;
  status: 'active' | 'done' | 'archived';
  commitmentMode: 'fixed' | 'flexible' | 'lead-time';
  fixedStartDate: string | null;
  fixedEndDate: string | null;
  leadTimeWeeks: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrajectoryWindowRecord {
  id: string;
  title: string;
  windowType: 'internship' | 'master_cycle' | 'exam_period' | 'other';
  startDate: string;
  endDate: string;
  confidence: 'low' | 'medium' | 'high';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrajectoryBlockRecord {
  id: string;
  goalId: string;
  title: string;
  startDate: string;
  endDate: string;
  weeklyHours: number;
  status: 'planned' | 'in_progress' | 'done' | 'skipped';
  source: string;
  createdAt: string;
  updatedAt: string;
}

function toSettingsRecord(row: TrajectorySettingsRow): TrajectorySettingsRecord {
  return {
    id: row.id,
    hoursPerWeek: row.hours_per_week,
    horizonMonths: row.horizon_months,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// TODO: regenerate Database types after migration 2026-04-19_crisis_mode applies,
// then drop `(row as any)` casts below.
function toGoalRecord(row: TrajectoryGoalRow): TrajectoryGoalRecord {
  const raw = row as unknown as Record<string, unknown>;
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    dueDate: row.due_date,
    effortHours: row.effort_hours,
    bufferWeeks: row.buffer_weeks,
    priority: row.priority,
    status: row.status,
    commitmentMode:
      (raw.commitment_mode as 'fixed' | 'flexible' | 'lead-time' | undefined) ??
      'flexible',
    fixedStartDate: (raw.fixed_start_date as string | null | undefined) ?? null,
    fixedEndDate: (raw.fixed_end_date as string | null | undefined) ?? null,
    leadTimeWeeks: (raw.lead_time_weeks as number | null | undefined) ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toWindowRecord(row: TrajectoryWindowRow): TrajectoryWindowRecord {
  return {
    id: row.id,
    title: row.title,
    windowType: row.window_type,
    startDate: row.start_date,
    endDate: row.end_date,
    confidence: row.confidence,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toBlockRecord(row: TrajectoryBlockRow): TrajectoryBlockRecord {
  return {
    id: row.id,
    goalId: row.goal_id,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date,
    weeklyHours: row.weekly_hours,
    status: row.status,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getOrCreateTrajectorySettings(userId: string): Promise<TrajectorySettingsRecord> {
  const supabase = createClient();

  const { data: existing, error } = await supabase
    .from('trajectory_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read trajectory settings: ${error.message}`);
  }

  if (existing) return toSettingsRecord(existing);

  const insertData: TrajectorySettingsInsert = {
    user_id: userId,
    hours_per_week: 8,
    horizon_months: 24,
  };

  const { data: created, error: createError } = await supabase
    .from('trajectory_settings')
    .insert(insertData)
    .select('*')
    .single();

  if (createError) {
    throw new Error(`Failed to initialize trajectory settings: ${createError.message}`);
  }

  return toSettingsRecord(created);
}

export async function updateTrajectorySettings(
  userId: string,
  input: { hoursPerWeek?: number | undefined; horizonMonths?: number | undefined }
): Promise<TrajectorySettingsRecord> {
  const supabase = createClient();
  const updateData: TrajectorySettingsUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (input.hoursPerWeek !== undefined) updateData.hours_per_week = input.hoursPerWeek;
  if (input.horizonMonths !== undefined) updateData.horizon_months = input.horizonMonths;

  const { data, error } = await supabase
    .from('trajectory_settings')
    .update(updateData)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update trajectory settings: ${error.message}`);
  }

  if (!data) {
    // Row doesn't exist yet — upsert with defaults + user overrides
    const defaults = { hours_per_week: 8, horizon_months: 24 };
    const upsertData = { user_id: userId, ...defaults, ...updateData };
    const { data: upserted, error: upsertError } = await supabase
      .from('trajectory_settings')
      .upsert(upsertData, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (upsertError) {
      throw new Error(`Failed to upsert trajectory settings: ${upsertError.message}`);
    }
    return toSettingsRecord(upserted);
  }

  return toSettingsRecord(data);
}

export async function listTrajectoryGoals(userId: string): Promise<TrajectoryGoalRecord[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('trajectory_goals')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true })
    .limit(500);

  if (error) {
    throw new Error(`Failed to list trajectory goals: ${error.message}`);
  }

  return (data || []).map(toGoalRecord);
}

export async function createTrajectoryGoal(
  userId: string,
  input: CreateTrajectoryGoalInput
): Promise<TrajectoryGoalRecord> {
  const supabase = createClient();

  const insertData: Record<string, unknown> = {
    user_id: userId,
    title: input.title,
    category: input.category,
    effort_hours: input.effortHours,
    buffer_weeks: input.bufferWeeks,
    priority: input.priority,
    status: input.status,
    commitment_mode: input.commitmentMode,
  };

  if (input.commitmentMode === 'fixed') {
    insertData.fixed_start_date = input.fixedStartDate;
    insertData.fixed_end_date = input.fixedEndDate;
    insertData.due_date = input.dueDate ?? input.fixedEndDate;
  } else if (input.commitmentMode === 'flexible') {
    insertData.due_date = input.dueDate;
  } else {
    insertData.due_date = input.dueDate;
    insertData.lead_time_weeks = input.leadTimeWeeks;
  }

  const { data, error } = await supabase
    .from('trajectory_goals')
    .insert(insertData as TrajectoryGoalInsert)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create trajectory goal: ${error.message}`);
  }

  return toGoalRecord(data);
}

export async function updateTrajectoryGoal(
  userId: string,
  goalId: string,
  input: UpdateTrajectoryGoalInput
): Promise<TrajectoryGoalRecord> {
  const supabase = createClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) updateData.title = input.title;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.dueDate !== undefined) updateData.due_date = input.dueDate;
  if (input.effortHours !== undefined) updateData.effort_hours = input.effortHours;
  if (input.bufferWeeks !== undefined) updateData.buffer_weeks = input.bufferWeeks;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.status !== undefined) updateData.status = input.status;

  if (input.commitmentMode !== undefined) {
    updateData.commitment_mode = input.commitmentMode;
    if (input.commitmentMode === 'fixed') {
      updateData.lead_time_weeks = null;
    } else if (input.commitmentMode === 'flexible') {
      updateData.fixed_start_date = null;
      updateData.fixed_end_date = null;
      updateData.lead_time_weeks = null;
    } else {
      updateData.fixed_start_date = null;
      updateData.fixed_end_date = null;
    }
  }
  if (input.fixedStartDate !== undefined) updateData.fixed_start_date = input.fixedStartDate;
  if (input.fixedEndDate !== undefined) updateData.fixed_end_date = input.fixedEndDate;
  if (input.leadTimeWeeks !== undefined) updateData.lead_time_weeks = input.leadTimeWeeks;

  const { data, error } = await supabase
    .from('trajectory_goals')
    .update(updateData as TrajectoryGoalUpdate)
    .eq('id', goalId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to update trajectory goal: ${error.message}`);
  }

  return toGoalRecord(data);
}

export async function deleteTrajectoryGoal(userId: string, goalId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('trajectory_goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete trajectory goal: ${error.message}`);
  }
}

export async function getTrajectoryGoalById(
  userId: string,
  goalId: string
): Promise<TrajectoryGoalRecord | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('trajectory_goals')
    .select('*')
    .eq('id', goalId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch trajectory goal: ${error.message}`);
  }

  return data ? toGoalRecord(data) : null;
}

export async function listTrajectoryWindows(userId: string): Promise<TrajectoryWindowRecord[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('trajectory_windows')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: true })
    .limit(500);

  if (error) {
    throw new Error(`Failed to list trajectory windows: ${error.message}`);
  }

  return (data || []).map(toWindowRecord);
}

export async function createTrajectoryWindow(
  userId: string,
  input: CreateTrajectoryWindowInput
): Promise<TrajectoryWindowRecord> {
  const supabase = createClient();

  const insertData: TrajectoryWindowInsert = {
    user_id: userId,
    title: input.title,
    window_type: input.windowType,
    start_date: input.startDate,
    end_date: input.endDate,
    confidence: input.confidence,
    notes: input.notes ?? null,
  };

  const { data, error } = await supabase
    .from('trajectory_windows')
    .insert(insertData)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create trajectory window: ${error.message}`);
  }

  return toWindowRecord(data);
}

export async function updateTrajectoryWindow(
  userId: string,
  windowId: string,
  input: UpdateTrajectoryWindowInput
): Promise<TrajectoryWindowRecord> {
  const supabase = createClient();

  const updateData: TrajectoryWindowUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) updateData.title = input.title;
  if (input.windowType !== undefined) updateData.window_type = input.windowType;
  if (input.startDate !== undefined) updateData.start_date = input.startDate;
  if (input.endDate !== undefined) updateData.end_date = input.endDate;
  if (input.confidence !== undefined) updateData.confidence = input.confidence;
  if (input.notes !== undefined) updateData.notes = input.notes ?? null;

  const { data, error } = await supabase
    .from('trajectory_windows')
    .update(updateData)
    .eq('id', windowId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to update trajectory window: ${error.message}`);
  }

  return toWindowRecord(data);
}

export async function deleteTrajectoryWindow(userId: string, windowId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('trajectory_windows')
    .delete()
    .eq('id', windowId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete trajectory window: ${error.message}`);
  }
}

export async function listTrajectoryBlocks(userId: string): Promise<TrajectoryBlockRecord[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('trajectory_blocks')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: true })
    .limit(1000);

  if (error) {
    throw new Error(`Failed to list trajectory blocks: ${error.message}`);
  }

  return (data || []).map(toBlockRecord);
}

export async function commitTrajectoryBlocks(
  userId: string,
  input: CommitTrajectoryBlocksInput
): Promise<TrajectoryBlockRecord[]> {
  const supabase = createClient();

  const rows: TrajectoryBlockInsert[] = input.blocks.map((block) => ({
    user_id: userId,
    goal_id: block.goalId,
    title: block.title,
    start_date: block.startDate,
    end_date: block.endDate,
    weekly_hours: block.weeklyHours,
    status: block.status,
    source: 'trajectory_v1',
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('trajectory_blocks')
    .upsert(rows, { onConflict: 'user_id,goal_id,start_date,end_date' })
    .select('*');

  if (error) {
    throw new Error(`Failed to commit trajectory blocks: ${error.message}`);
  }

  return (data || []).map(toBlockRecord);
}

export async function createTrajectoryTaskPackage(
  userId: string,
  goal: TrajectoryGoalRecord,
  input: CreateTrajectoryTaskPackageInput
): Promise<{ created: DailyTaskRow[]; skippedExisting: boolean }> {
  const supabase = createClient();

  const titlePrefix = `[Trajectory] ${goal.title} - Step `;
  const { data: existing, error: existingError } = await supabase
    .from('daily_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('source', 'goal')
    .eq('source_id', goal.id)
    .gte('date', input.startDate)
    .lte('date', input.endDate)
    .order('date', { ascending: true });

  if (existingError) {
    throw new Error(`Failed to inspect existing trajectory tasks: ${existingError.message}`);
  }

  const existingTrajectoryTasks = (existing || []).filter((task) => task.title.startsWith(titlePrefix));
  if (existingTrajectoryTasks.length >= input.taskCount) {
    return { created: existingTrajectoryTasks, skippedExisting: true };
  }

  const dates = buildTaskPackageDates(input.startDate, input.endDate, input.taskCount);
  const inserts: DailyTaskInsert[] = dates.map((date, index) => ({
    user_id: userId,
    date,
    title: `${titlePrefix}${index + 1}/${dates.length}`,
    completed: false,
    source: 'goal',
    source_id: goal.id,
    time_estimate: null,
  }));

  const { data: created, error: createError } = await supabase
    .from('daily_tasks')
    .insert(inserts)
    .select('*');

  if (createError) {
    throw new Error(`Failed to create trajectory task package: ${createError.message}`);
  }

  return { created: created || [], skippedExisting: false };
}
