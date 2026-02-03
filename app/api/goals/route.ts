import { NextRequest, NextResponse } from 'next/server';
import { createGoal, fetchGoals } from '@/lib/supabase/goals';
import { createGoalSchema } from '@/lib/schemas/goal.schema';

/**
 * GET /api/goals - Fetch goals with pagination
 * Query params:
 * - page: page number (default: 1)
 * - limit: items per page (default: 20, max: 100)
 * - status: filter by status (optional)
 * - category: filter by category (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;

    const { goals } = await fetchGoals({
      page,
      limit,
      status: status as 'active' | 'completed' | 'archived' | undefined,
      category: category as 'career' | 'fitness' | 'learning' | 'finance' | undefined,
    });

    // Return array directly for frontend compatibility
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
