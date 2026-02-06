import { NextRequest, NextResponse } from 'next/server';
import { updateCourse, deleteCourse, fetchCoursesWithExercises } from '@/lib/supabase/courses';
import type { CreateCourseInput } from '@/lib/schemas/course.schema';
import { requireApiAuth } from '@/lib/api/auth';

/**
 * GET /api/courses/[id] - Get a single course with exercises
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;
    
    // Fetch all courses with exercises, then find the one we need
    const courses = await fetchCoursesWithExercises();
    const course = courses.find((c) => c.id === id);
    
    if (!course) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(course);
  } catch (error) {
    console.error(`Error fetching course ${params.id}:`, error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/courses/[id] - Update a course
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { errorResponse } = await requireApiAuth();
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

    const course = await updateCourse(id, updates);

    return NextResponse.json(course);
  } catch (error) {
    console.error(`Error updating course ${params.id}:`, error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to update course' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/courses/[id] - Delete a course
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;

    await deleteCourse(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting course ${params.id}:`, error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to delete course' },
      { status: 500 }
    );
  }
}
