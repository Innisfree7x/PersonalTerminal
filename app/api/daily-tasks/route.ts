import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/server';
import { createDailyTaskSchema } from '@/lib/schemas/dailyTask.schema';
import type { Database } from '@/lib/supabase/types';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';

type DailyTaskInsert = Database['public']['Tables']['daily_tasks']['Insert'];
type DailyTaskRow = Database['public']['Tables']['daily_tasks']['Row'];

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

/**
 * GET /api/daily-tasks - Fetch daily tasks for a specific date
 * Query params: date (YYYY-MM-DD, defaults to today)
 */
export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const supabase = createClient();
    const dateParam = request.nextUrl.searchParams.get('date');
    const date = dateParam ?? (new Date().toISOString().split('T')[0] ?? ''); // YYYY-MM-DD

    const { data, error } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .order('completed', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch daily tasks: ${error.message}`);
    }

    return NextResponse.json((data || []).map(toDailyTaskResponse));
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch daily tasks', 'Error fetching daily tasks');
  }
}

/**
 * POST /api/daily-tasks - Create a new daily task
 */
export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const supabase = createClient();
    const body = await request.json();

    // Validate input with Zod
    const validatedData = createDailyTaskSchema.parse(body);

    const insertData: DailyTaskInsert = {
      user_id: user.id,
      date: validatedData.date,
      title: validatedData.title,
      completed: validatedData.completed ?? false,
      source: validatedData.source || null,
      source_id: validatedData.sourceId || null,
      time_estimate: validatedData.timeEstimate || null,
    };

    const { data, error } = await supabase
      .from('daily_tasks')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create daily task: ${error.message}`);
    }

    return NextResponse.json(toDailyTaskResponse(data), { status: 201 });
  } catch (error) {
    return handleRouteError(error, 'Failed to create daily task', 'Error creating daily task');
  }
}
