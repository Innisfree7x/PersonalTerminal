import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

type DailyTaskUpdate = Database['public']['Tables']['daily_tasks']['Update'];

/**
 * PATCH /api/daily-tasks/[id] - Update a daily task
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const updateData: DailyTaskUpdate = {
      title: body.title,
      completed: body.completed,
      time_estimate: body.timeEstimate || null,
    };

    const { data, error } = await supabase
      .from('daily_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update daily task: ${error.message}`);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error updating daily task ${params.id}:`, error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to update daily task' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/daily-tasks/[id] - Delete a daily task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { error } = await supabase.from('daily_tasks').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete daily task: ${error.message}`);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting daily task ${params.id}:`, error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to delete daily task' },
      { status: 500 }
    );
  }
}
