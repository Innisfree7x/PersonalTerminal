import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { createTrajectoryGoalSchema } from '@/lib/schemas/trajectory.schema';
import { createTrajectoryGoal, listTrajectoryGoals } from '@/lib/supabase/trajectory';

export async function GET() {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const goals = await listTrajectoryGoals(user.id);
    return NextResponse.json(goals);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch trajectory goals', 'Error fetching trajectory goals');
  }
}

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const parsed = createTrajectoryGoalSchema.parse(body);

    const goal = await createTrajectoryGoal(user.id, parsed);
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    return handleRouteError(error, 'Failed to create trajectory goal', 'Error creating trajectory goal');
  }
}
