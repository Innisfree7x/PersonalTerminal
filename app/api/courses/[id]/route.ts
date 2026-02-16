import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/server';
import {
  updateCourse,
  deleteCourse,
  supabaseCoursetoCourse,
  supabaseExerciseProgressToExerciseProgress,
} from '@/lib/supabase/courses';
import type { CreateCourseInput } from '@/lib/schemas/course.schema';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError, apiErrorResponse } from '@/lib/api/server-errors';

/**
 * GET /api/courses/[id] - Get a single course with exercises
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;
    const supabase = createClient();

    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (courseError || !courseData) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }

    const { data: exercisesData, error: exercisesError } = await supabase
      .from('exercise_progress')
      .select('*')
      .eq('course_id', id)
      .eq('user_id', user.id)
      .order('exercise_number', { ascending: true });

    if (exercisesError) {
      throw new Error(`Failed to fetch course exercises: ${exercisesError.message}`);
    }

    const course = {
      ...supabaseCoursetoCourse(courseData),
      exercises: (exercisesData || []).map(supabaseExerciseProgressToExerciseProgress),
    };

    return NextResponse.json(course);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch course', `Error fetching course ${params.id}`);
  }
}

/**
 * PATCH /api/courses/[id] - Update a course
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;
    const body = await request.json();

    // Partial validation
    const updates: Partial<CreateCourseInput> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.ects !== undefined) updates.ects = body.ects;
    if (body.numExercises !== undefined) updates.numExercises = body.numExercises;
    if (body.examDate !== undefined) {
      updates.examDate = body.examDate ? new Date(body.examDate) : undefined;
    }
    if (body.semester !== undefined) updates.semester = body.semester;

    if (Object.keys(updates).length === 0) {
      return apiErrorResponse(400, 'BAD_REQUEST', 'No fields to update');
    }

    const course = await updateCourse(user.id, id, updates);

    return NextResponse.json(course);
  } catch (error) {
    return handleRouteError(error, 'Failed to update course', `Error updating course ${params.id}`);
  }
}

/**
 * DELETE /api/courses/[id] - Delete a course
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;

    await deleteCourse(user.id, id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error, 'Failed to delete course', `Error deleting course ${params.id}`);
  }
}
