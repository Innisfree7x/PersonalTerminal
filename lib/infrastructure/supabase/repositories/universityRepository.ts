import type { UniversityRepository } from '@/lib/application/ports/university-repository';
import {
  fetchCoursesWithExercises,
  createCourse,
  updateCourse,
  deleteCourse,
  toggleExerciseCompletion,
} from '@/lib/supabase/courses';

export const universityRepository: UniversityRepository = {
  fetchCoursesWithExercises,
  createCourse,
  updateCourse,
  deleteCourse,
  toggleExerciseCompletion,
};
