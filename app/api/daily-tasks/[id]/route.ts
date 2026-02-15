import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/server';
import type { Database } from '@/lib/supabase/types';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError, apiErrorResponse } from '@/lib/api/server-errors';

type DailyTaskUpdate = Database['public']['Tables']['daily_tasks']['Update'];
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
 * PATCH /api/daily-tasks/[id] - Update a daily task
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const supabase = createClient();
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
      return apiErrorResponse(400, 'BAD_REQUEST', 'No fields to update');
    }

    const { data, error } = await supabase
      .from('daily_tasks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update daily task: ${error.message}`);
    }

    if (!data) {
      return apiErrorResponse(404, 'NOT_FOUND', 'Task not found');
    }

    return NextResponse.json(toDailyTaskResponse(data));
  } catch (error) {
    return handleRouteError(error, 'Failed to update daily task', `Error updating daily task ${params.id}`);
  }
}

/**
 * DELETE /api/daily-tasks/[id] - Delete a daily task
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const supabase = createClient();
    const { id } = params;

    const { error } = await supabase
      .from('daily_tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to delete daily task: ${error.message}`);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error, 'Failed to delete daily task', `Error deleting daily task ${params.id}`);
  }
}
