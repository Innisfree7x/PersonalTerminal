import { NextRequest, NextResponse } from 'next/server';
import { toggleExerciseCompletion } from '@/lib/supabase/courses';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError, apiErrorResponse } from '@/lib/api/server-errors';

/**
 * PATCH /api/courses/[id]/exercises/[number] - Toggle exercise completion
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; number: string } }
) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const { id: courseId, number: exerciseNumberStr } = params;
    const exerciseNumber = parseInt(exerciseNumberStr, 10);

    if (isNaN(exerciseNumber)) {
      return apiErrorResponse(400, 'BAD_REQUEST', 'Invalid exercise number');
    }

    const body = await request.json();
    const { completed } = body;

    if (typeof completed !== 'boolean') {
      return apiErrorResponse(400, 'BAD_REQUEST', 'completed must be a boolean');
    }

    const exerciseProgress = await toggleExerciseCompletion(user.id, courseId, exerciseNumber, completed);

    return NextResponse.json(exerciseProgress);
  } catch (error) {
    return handleRouteError(
      error,
      'Failed to toggle exercise',
      `Error toggling exercise (course: ${params.id}, exercise: ${params.number})`
    );
  }
}
