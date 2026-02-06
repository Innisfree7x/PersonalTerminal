import { NextRequest, NextResponse } from 'next/server';
import { toggleExerciseCompletion } from '@/lib/supabase/courses';
import { requireApiAuth } from '@/lib/api/auth';

/**
 * PATCH /api/courses/[id]/exercises/[number] - Toggle exercise completion
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; number: string } }
) {
  const { errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    console.log('📡 [API] PATCH /api/courses/[id]/exercises/[number] called');
    console.log('📡 [API] Params:', params);
    
    const { id: courseId, number: exerciseNumberStr } = params;
    const exerciseNumber = parseInt(exerciseNumberStr, 10);

    if (isNaN(exerciseNumber)) {
      console.error('❌ [API] Invalid exercise number:', exerciseNumberStr);
      return NextResponse.json(
        { message: 'Invalid exercise number' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { completed } = body;
    console.log('📡 [API] Request body:', { completed, exerciseNumber });

    if (typeof completed !== 'boolean') {
      console.error('❌ [API] Invalid completed value:', completed);
      return NextResponse.json(
        { message: 'completed must be a boolean' },
        { status: 400 }
      );
    }

    console.log('🔵 [API] Calling toggleExerciseCompletion...', { courseId, exerciseNumber, completed });
    const exerciseProgress = await toggleExerciseCompletion(courseId, exerciseNumber, completed);
    console.log('✅ [API] Exercise toggled successfully!', exerciseProgress);

    return NextResponse.json(exerciseProgress);
  } catch (error) {
    console.error('❌ [API] Error toggling exercise:', error);
    console.error(`❌ [API] Course: ${params.id}, Exercise: ${params.number}`);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to toggle exercise' },
      { status: 500 }
    );
  }
}
