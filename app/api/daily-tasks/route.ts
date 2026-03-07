import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/server';
import { createDailyTaskSchema } from '@/lib/schemas/dailyTask.schema';
import type { Database } from '@/lib/supabase/types';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { createApiTraceContext, withApiTraceHeaders } from '@/lib/api/observability';
import { applyPrivateSWRPolicy } from '@/lib/api/responsePolicy';
import { enforceTrustedMutationOrigin } from '@/lib/api/csrf';

type DailyTaskInsert = Database['public']['Tables']['daily_tasks']['Insert'];
type DailyTaskRow = Pick<
  Database['public']['Tables']['daily_tasks']['Row'],
  'id' | 'date' | 'title' | 'completed' | 'source' | 'source_id' | 'time_estimate' | 'created_at'
>;

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
  const trace = createApiTraceContext(request, '/api/daily-tasks');
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return withApiTraceHeaders(errorResponse, trace, { metricName: 'daily_tasks_get' });

  try {
    const supabase = createClient();
    const dateParam = request.nextUrl.searchParams.get('date');
    const date = dateParam ?? (new Date().toISOString().split('T')[0] ?? ''); // YYYY-MM-DD

    const { data, error } = await supabase
      .from('daily_tasks')
      .select('id, date, title, completed, source, source_id, time_estimate, created_at')
      .eq('user_id', user.id)
      .eq('date', date)
      .order('completed', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch daily tasks: ${error.message}`);
    }

    const response = applyPrivateSWRPolicy(NextResponse.json((data || []).map(toDailyTaskResponse)), {
      maxAgeSeconds: 10,
      staleWhileRevalidateSeconds: 30,
    });
    return withApiTraceHeaders(response, trace, { metricName: 'daily_tasks_get' });
  } catch (error) {
    const response = handleRouteError(error, 'Failed to fetch daily tasks', 'Error fetching daily tasks');
    return withApiTraceHeaders(response, trace, { metricName: 'daily_tasks_get' });
  }
}

/**
 * POST /api/daily-tasks - Create a new daily task
 */
export async function POST(request: NextRequest) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

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
