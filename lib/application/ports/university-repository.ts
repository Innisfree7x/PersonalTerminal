import type { Course, CourseWithExercises, CreateCourseInput, ExerciseProgress } from '@/lib/schemas/course.schema';

export interface UniversityRepository {
  fetchCoursesWithExercises(userId: string): Promise<CourseWithExercises[]>;
  createCourse(userId: string, data: CreateCourseInput): Promise<CourseWithExercises>;
  updateCourse(userId: string, id: string, data: Partial<CreateCourseInput>): Promise<Course>;
  deleteCourse(userId: string, id: string): Promise<void>;
  toggleExerciseCompletion(
    userId: string,
    courseId: string,
    exerciseNumber: number,
    completed: boolean
  ): Promise<ExerciseProgress>;
}
