import { NextRequest, NextResponse } from 'next/server';
import { updateCourse, deleteCourse } from '@/lib/supabase/courses';
import { createCourseSchema } from '@/lib/schemas/course.schema';

/**
 * PATCH /api/courses/[id] - Update a course
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Partial validation
    const updates: any = {};
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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
