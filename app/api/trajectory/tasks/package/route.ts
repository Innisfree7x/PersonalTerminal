import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { createTrajectoryTaskPackageSchema } from '@/lib/schemas/trajectory.schema';
import { createTrajectoryTaskPackage, getTrajectoryGoalById } from '@/lib/supabase/trajectory';

function toDailyTaskResponse(task: {
  id: string;
  date: string;
  title: string;
  completed: boolean;
  source: string | null;
  source_id: string | null;
  time_estimate: string | null;
  created_at: string;
}) {
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

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const parsed = createTrajectoryTaskPackageSchema.parse(body);

    if (parsed.endDate < parsed.startDate) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'endDate must be greater than or equal to startDate' } },
        { status: 400 }
      );
    }

    const goal = await getTrajectoryGoalById(user.id, parsed.goalId);
    if (!goal) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Trajectory goal not found' } },
        { status: 404 }
      );
    }

    const { created, skippedExisting } = await createTrajectoryTaskPackage(user.id, goal, parsed);

    return NextResponse.json({
      skippedExisting,
      tasks: created.map(toDailyTaskResponse),
    });
  } catch (error) {
    return handleRouteError(error, 'Failed to create trajectory task package', 'Error creating trajectory task package');
  }
}
