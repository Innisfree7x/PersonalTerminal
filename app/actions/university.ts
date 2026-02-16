'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth/server';
import {
  createCourseSchema,
  type CreateCourseInput,
  type CourseWithExercises,
  type Course,
  type ExerciseProgress,
} from '@/lib/schemas/course.schema';
import { universityRepository } from '@/lib/infrastructure/supabase/repositories/universityRepository';
import {
  createUniversityCourse,
  deleteUniversityCourse,
  fetchUniversityCourses,
  toggleUniversityExercise,
  updateUniversityCourse,
} from '@/lib/application/use-cases/university';

/**
 * Server Action to create a course and seed exercise progress rows.
 */
export async function createCourseAction(data: CreateCourseInput): Promise<CourseWithExercises> {
  const user = await requireAuth();
  const validated = createCourseSchema.parse(data);
  const course = await createUniversityCourse(universityRepository, user.id, validated);
  revalidatePath('/university');
  return course;
}

export async function updateCourseAction(id: string, data: Partial<CreateCourseInput>): Promise<Course> {
  const user = await requireAuth();
  const parsed = createCourseSchema.partial().parse(data);
  const validated = Object.fromEntries(
    Object.entries(parsed).filter(([, value]) => value !== undefined)
  ) as Partial<CreateCourseInput>;
  const course = await updateUniversityCourse(universityRepository, user.id, id, validated);
  revalidatePath('/university');
  return course;
}

export async function deleteCourseAction(id: string): Promise<void> {
  const user = await requireAuth();
  await deleteUniversityCourse(universityRepository, user.id, id);
  revalidatePath('/university');
}

export async function toggleExerciseCompletionAction(
  courseId: string,
  exerciseNumber: number,
  completed: boolean
): Promise<ExerciseProgress> {
  const user = await requireAuth();
  const result = await toggleUniversityExercise(
    universityRepository,
    user.id,
    courseId,
    exerciseNumber,
    completed
  );
  revalidatePath('/university');
  revalidatePath('/today');
  return result;
}

export async function fetchCoursesAction(): Promise<CourseWithExercises[]> {
  const user = await requireAuth();
  return fetchUniversityCourses(universityRepository, user.id);
}
