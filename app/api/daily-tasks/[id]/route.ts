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

    // Build update object with only provided fields (partial update)
    const updateData: Partial<DailyTaskUpdate> = {};
    
    if (body.title !== undefined) {
      updateData.title = body.title;
    }
    if (body.completed !== undefined) {
      updateData.completed = body.completed;
    }
    if (body.timeEstimate !== undefined) {
      updateData.time_estimate = body.timeEstimate;
    }

    // Don't update if no fields provided
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('daily_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update daily task: ${error.message}`);
    }

    if (!data) {
      return NextResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      );
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
  _request: NextRequest,
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
