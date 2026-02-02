import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { createDailyTaskSchema } from '@/lib/schemas/dailyTask.schema';
import type { Database } from '@/lib/supabase/types';

type DailyTaskInsert = Database['public']['Tables']['daily_tasks']['Insert'];
type DailyTaskUpdate = Database['public']['Tables']['daily_tasks']['Update'];

/**
 * GET /api/daily-tasks - Fetch daily tasks for a specific date
 * Query params: date (YYYY-MM-DD, defaults to today)
 */
export async function GET(request: NextRequest) {
  try {
    const dateParam = request.nextUrl.searchParams.get('date');
    const date = dateParam || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { data, error } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('date', date)
      .order('completed', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch daily tasks: ${error.message}`);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching daily tasks:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch daily tasks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/daily-tasks - Create a new daily task
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod
    const validatedData = createDailyTaskSchema.parse(body);

    const insertData: DailyTaskInsert = {
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

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating daily task:', error);

    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { message: 'Validation error', errors: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create daily task' },
      { status: 500 }
    );
  }
}
