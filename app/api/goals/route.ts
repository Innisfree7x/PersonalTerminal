import { NextRequest, NextResponse } from 'next/server';
import { createGoal, fetchGoals } from '@/lib/supabase/goals';
import { createGoalSchema } from '@/lib/schemas/goal.schema';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';

/**
 * GET /api/goals - Fetch goals with pagination
 * Query params:
 * - page: page number (default: 1)
 * - limit: items per page (default: 20, max: 100)
 * - status: filter by status (optional)
 * - category: filter by category (optional)
 */
export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;

    const { goals } = await fetchGoals({
      userId: user.id,
      page,
      limit,
      status: status as 'active' | 'completed' | 'archived' | undefined,
      category: category as 'career' | 'fitness' | 'learning' | 'finance' | undefined,
    });

    // Return array directly for frontend compatibility
    return NextResponse.json(goals);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch goals', 'Error fetching goals');
  }
}

/**
 * POST /api/goals - Create a new goal
 */
export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

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
    
    const goal = await createGoal(user.id, validatedData);
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    return handleRouteError(error, 'Failed to create goal', 'Error creating goal');
  }
}
