import { NextRequest, NextResponse } from 'next/server';
import { updateGoal, deleteGoal } from '@/lib/supabase/goals';
import { createGoalSchema } from '@/lib/schemas/goal.schema';

/**
 * PATCH /api/goals/[id] - Update a goal
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const goalId = params.id;
    const body = await request.json();
    
    // Convert targetDate string to Date if needed
    const dataToValidate = {
      ...body,
      targetDate: body.targetDate
        ? typeof body.targetDate === 'string'
          ? new Date(body.targetDate)
          : body.targetDate
        : undefined,
    };
    
    // Validate input with Zod
    const validatedData = createGoalSchema.parse(dataToValidate);
    
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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
