import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { updateTrajectoryGoalSchema } from '@/lib/schemas/trajectory.schema';
import { deleteTrajectoryGoal, updateTrajectoryGoal } from '@/lib/supabase/trajectory';

interface Params {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const parsed = updateTrajectoryGoalSchema.parse(body);

    if (Object.keys(parsed).length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'No goal fields provided' } },
        { status: 400 }
      );
    }

    const updated = await updateTrajectoryGoal(user.id, params.id, parsed);
    return NextResponse.json(updated);
  } catch (error) {
    return handleRouteError(error, 'Failed to update trajectory goal', 'Error updating trajectory goal');
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    await deleteTrajectoryGoal(user.id, params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, 'Failed to delete trajectory goal', 'Error deleting trajectory goal');
  }
}
