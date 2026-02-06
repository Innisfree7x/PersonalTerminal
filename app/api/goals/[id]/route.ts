import { NextRequest, NextResponse } from 'next/server';
import { updateGoal, deleteGoal } from '@/lib/supabase/goals';
import { createGoalSchema } from '@/lib/schemas/goal.schema';
import { requireApiAuth } from '@/lib/api/auth';

/**
 * PATCH /api/goals/[id] - Update a goal
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const goalId = params.id;
    const body = await request.json();
    
    // Allow partial updates - only validate provided fields
    const dataToUpdate: Partial<typeof body> = {};
    
    // Build update object with only provided fields
    if (body.title !== undefined) dataToUpdate.title = body.title;
    if (body.category !== undefined) dataToUpdate.category = body.category;
    if (body.status !== undefined) dataToUpdate.status = body.status;
    if (body.priority !== undefined) dataToUpdate.priority = body.priority;
    if (body.description !== undefined) dataToUpdate.description = body.description;
    if (body.metrics !== undefined) dataToUpdate.metrics = body.metrics;
    if (body.milestones !== undefined) dataToUpdate.milestones = body.milestones;
    if (body.notes !== undefined) dataToUpdate.notes = body.notes;
    
    // Handle targetDate conversion
    if (body.targetDate !== undefined) {
      dataToUpdate.targetDate = typeof body.targetDate === 'string'
        ? new Date(body.targetDate)
        : body.targetDate;
    }
    
    // Ensure at least one field to update
    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { message: 'No fields to update' },
        { status: 400 }
      );
    }
    
    // For partial updates, use partial schema validation
    const validatedData = createGoalSchema.partial().parse(dataToUpdate) as Partial<import('@/lib/schemas/goal.schema').CreateGoalInput>;
    
    const goal = await updateGoal(goalId, validatedData);
    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    
    // Check if it's a Zod validation error
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { message: 'Validation error', errors: error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to update goal' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/goals/[id] - Delete a goal
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const goalId = params.id;
    await deleteGoal(goalId);
    return NextResponse.json({ message: 'Goal deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to delete goal' },
      { status: 500 }
    );
  }
}
