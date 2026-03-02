import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { commitTrajectoryBlocksSchema } from '@/lib/schemas/trajectory.schema';
import { commitTrajectoryBlocks, listTrajectoryGoals } from '@/lib/supabase/trajectory';

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const parsed = commitTrajectoryBlocksSchema.parse(body);

    const goalIds = Array.from(new Set(parsed.blocks.map((block) => block.goalId)));
    const userGoals = await listTrajectoryGoals(user.id);
    const userGoalIdSet = new Set(userGoals.map((goal) => goal.id));
    const hasForeignGoal = goalIds.some((goalId) => !userGoalIdSet.has(goalId));

    if (hasForeignGoal) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'One or more goal IDs are not owned by user' } },
        { status: 403 }
      );
    }

    const committed = await commitTrajectoryBlocks(user.id, parsed);
    return NextResponse.json({ blocks: committed });
  } catch (error) {
    return handleRouteError(error, 'Failed to commit trajectory blocks', 'Error committing trajectory blocks');
  }
}
