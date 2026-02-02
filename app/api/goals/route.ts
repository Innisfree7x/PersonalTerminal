import { NextRequest, NextResponse } from 'next/server';
import { createGoal, fetchGoals } from '@/lib/supabase/goals';
import { createGoalSchema } from '@/lib/schemas/goal.schema';

/**
 * GET /api/goals - Fetch all goals
 */
export async function GET() {
  try {
    const goals = await fetchGoals();
    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/goals - Create a new goal
 */
export async function POST(request: NextRequest) {
  try {
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
    
    const goal = await createGoal(validatedData);
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);
    
    // Check if it's a Zod validation error
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { message: 'Validation error', errors: error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create goal' },
      { status: 500 }
    );
  }
}
