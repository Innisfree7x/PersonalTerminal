import { NextRequest, NextResponse } from 'next/server';
import { fetchCoursesWithExercises, createCourse } from '@/lib/supabase/courses';
import { createCourseSchema } from '@/lib/schemas/course.schema';

/**
 * GET /api/courses - Fetch all courses with exercise progress
 */
export async function GET(request: NextRequest) {
  try {
    const courses = await fetchCoursesWithExercises();
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses - Create a new course with exercise progress entries
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod
    const validatedData = createCourseSchema.parse(body);

    const course = await createCourse(validatedData);

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);

    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { message: 'Validation error', errors: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create course' },
      { status: 500 }
    );
  }
}
