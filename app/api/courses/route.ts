import { NextRequest, NextResponse } from 'next/server';
import { fetchCoursesWithExercises, createCourse } from '@/lib/supabase/courses';
import { createCourseSchema } from '@/lib/schemas/course.schema';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';

/**
 * GET /api/courses - Fetch all courses with exercise progress
 */
export async function GET(_request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const courses = await fetchCoursesWithExercises(user.id);
    return NextResponse.json(courses);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch courses', 'Error fetching courses');
  }
}

/**
 * POST /api/courses - Create a new course with exercise progress entries
 */
export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();

    // Validate input with Zod
    const validatedData = createCourseSchema.parse(body);

    const course = await createCourse(user.id, validatedData);

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    return handleRouteError(error, 'Failed to create course', 'Error creating course');
  }
}
