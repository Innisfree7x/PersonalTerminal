import { NextRequest, NextResponse } from 'next/server';
import { toggleExerciseCompletion } from '@/lib/supabase/courses';

/**
 * PATCH /api/courses/[id]/exercises/[number] - Toggle exercise completion
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; number: string } }
) {
  try {
    const { id: courseId, number: exerciseNumberStr } = params;
    const exerciseNumber = parseInt(exerciseNumberStr, 10);

    if (isNaN(exerciseNumber)) {
      return NextResponse.json(
        { message: 'Invalid exercise number' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { completed } = body;

    if (typeof completed !== 'boolean') {
      return NextResponse.json(
        { message: 'completed must be a boolean' },
        { status: 400 }
      );
    }

    const exerciseProgress = await toggleExerciseCompletion(courseId, exerciseNumber, completed);

    return NextResponse.json(exerciseProgress);
  } catch (error) {
    console.error(`Error toggling exercise ${params.number} for course ${params.id}:`, error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to toggle exercise' },
      { status: 500 }
    );
  }
}
