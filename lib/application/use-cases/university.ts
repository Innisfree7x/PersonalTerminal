import type { CourseWithExercises, CreateCourseInput, Course, ExerciseProgress } from '@/lib/schemas/course.schema';
import type { UniversityRepository } from '@/lib/application/ports/university-repository';

export async function fetchUniversityCourses(
  repository: UniversityRepository,
  userId: string
): Promise<CourseWithExercises[]> {
  return repository.fetchCoursesWithExercises(userId);
}

export async function createUniversityCourse(
  repository: UniversityRepository,
  userId: string,
  data: CreateCourseInput
): Promise<CourseWithExercises> {
  return repository.createCourse(userId, data);
}

export async function updateUniversityCourse(
  repository: UniversityRepository,
  userId: string,
  id: string,
  data: Partial<CreateCourseInput>
): Promise<Course> {
  return repository.updateCourse(userId, id, data);
}

export async function deleteUniversityCourse(
  repository: UniversityRepository,
  userId: string,
  id: string
): Promise<void> {
  return repository.deleteCourse(userId, id);
}

export async function toggleUniversityExercise(
  repository: UniversityRepository,
  userId: string,
  courseId: string,
  exerciseNumber: number,
  completed: boolean
): Promise<ExerciseProgress> {
  return repository.toggleExerciseCompletion(userId, courseId, exerciseNumber, completed);
}
