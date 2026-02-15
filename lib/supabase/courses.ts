import { createClient } from '@/lib/auth/server';
import type { Database, SupabaseCourse, SupabaseExerciseProgress } from './types';
import type { Course, CreateCourseInput, ExerciseProgress, CourseWithExercises } from '../schemas/course.schema';

type CourseInsert = Database['public']['Tables']['courses']['Insert'];
type CourseUpdate = Database['public']['Tables']['courses']['Update'];
type ExerciseProgressInsert = Database['public']['Tables']['exercise_progress']['Insert'];

/**
 * Converts Supabase Course Row to our Course type
 */
export function supabaseCoursetoCourse(row: SupabaseCourse): Course {
  return {
    id: row.id,
    name: row.name,
    ects: row.ects,
    numExercises: row.num_exercises,
    examDate: row.exam_date ? new Date(row.exam_date) : undefined,
    semester: row.semester,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Converts Supabase ExerciseProgress Row to our ExerciseProgress type
 */
export function supabaseExerciseProgressToExerciseProgress(row: SupabaseExerciseProgress): ExerciseProgress {
  return {
    id: row.id,
    courseId: row.course_id,
    exerciseNumber: row.exercise_number,
    completed: row.completed,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Converts our Course type to Supabase Insert format
 */
export function courseToSupabaseInsert(course: CreateCourseInput): CourseInsert {
  return {
    name: course.name,
    ects: course.ects,
    num_exercises: course.numExercises,
    exam_date: course.examDate ? (course.examDate.toISOString().split('T')[0] ?? '') : null,
    semester: course.semester,
  };
}

/**
 * Fetch all courses with their exercise progress
 */
export async function fetchCoursesWithExercises(): Promise<CourseWithExercises[]> {
  const supabase = createClient();

  // Fetch all courses
  const { data: coursesData, error: coursesError } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (coursesError) {
    throw new Error(`Failed to fetch courses: ${coursesError.message}`);
  }

  if (!coursesData || coursesData.length === 0) {
    return [];
  }

  // Fetch all exercise progress for all courses
  const courseIds = coursesData.map((c) => c.id);
  const { data: exercisesData, error: exercisesError } = await supabase
    .from('exercise_progress')
    .select('*')
    .in('course_id', courseIds)
    .order('exercise_number', { ascending: true });

  if (exercisesError) {
    throw new Error(`Failed to fetch exercise progress: ${exercisesError.message}`);
  }

  // Group exercises by course
  const exercisesByCourse: Record<string, ExerciseProgress[]> = {};
  (exercisesData || []).forEach((ex) => {
    const courseId = ex.course_id;
    if (!exercisesByCourse[courseId]) {
      exercisesByCourse[courseId] = [];
    }
    exercisesByCourse[courseId]?.push(supabaseExerciseProgressToExerciseProgress(ex));
  });

  // Combine courses with exercises
  return coursesData.map((course) => ({
    ...supabaseCoursetoCourse(course),
    exercises: exercisesByCourse[course.id] || [],
  }));
}

/**
 * Create a new course with exercise progress entries
 */
export async function createCourse(course: CreateCourseInput): Promise<CourseWithExercises> {
  const supabase = createClient();
  const insertData = courseToSupabaseInsert(course);

  // Insert course
  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .insert(insertData)
    .select()
    .single();

  if (courseError) {
    throw new Error(`Failed to create course: ${courseError.message}`);
  }

  // Create exercise progress entries
  const exerciseProgressInserts: ExerciseProgressInsert[] = [];
  for (let i = 1; i <= course.numExercises; i++) {
    exerciseProgressInserts.push({
      course_id: courseData.id,
      exercise_number: i,
      completed: false,
    });
  }

  const { data: exercisesData, error: exercisesError } = await supabase
    .from('exercise_progress')
    .insert(exerciseProgressInserts)
    .select();

  if (exercisesError) {
    throw new Error(`Failed to create exercise progress: ${exercisesError.message}`);
  }

  return {
    ...supabaseCoursetoCourse(courseData),
    exercises: exercisesData.map(supabaseExerciseProgressToExerciseProgress),
  };
}

/**
 * Update a course
 */
export async function updateCourse(id: string, updates: Partial<CreateCourseInput>): Promise<Course> {
  const supabase = createClient();
  const updateData: CourseUpdate = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.ects !== undefined) updateData.ects = updates.ects;
  if (updates.numExercises !== undefined) updateData.num_exercises = updates.numExercises;
  if (updates.examDate !== undefined) {
    updateData.exam_date = updates.examDate ? (updates.examDate.toISOString().split('T')[0] ?? '') : null;
  }
  if (updates.semester !== undefined) updateData.semester = updates.semester;

  const { data, error } = await supabase
    .from('courses')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update course: ${error.message}`);
  }

  // Sync exercise_progress entries when numExercises changes
  if (updates.numExercises !== undefined) {
    const newCount = updates.numExercises;

    // Get current exercise entries
    const { data: existingExercises, error: fetchError } = await supabase
      .from('exercise_progress')
      .select('exercise_number')
      .eq('course_id', id)
      .order('exercise_number', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch exercises: ${fetchError.message}`);
    }

    const currentCount = existingExercises?.length ?? 0;

    if (newCount > currentCount) {
      // Add missing exercise entries
      const newExercises: ExerciseProgressInsert[] = [];
      for (let i = currentCount + 1; i <= newCount; i++) {
        newExercises.push({
          course_id: id,
          exercise_number: i,
          completed: false,
        });
      }
      const { error: insertError } = await supabase
        .from('exercise_progress')
        .insert(newExercises);

      if (insertError) {
        throw new Error(`Failed to create new exercises: ${insertError.message}`);
      }
    } else if (newCount < currentCount) {
      // Remove excess exercise entries (highest numbers first)
      const { error: deleteError } = await supabase
        .from('exercise_progress')
        .delete()
        .eq('course_id', id)
        .gt('exercise_number', newCount);

      if (deleteError) {
        throw new Error(`Failed to remove excess exercises: ${deleteError.message}`);
      }
    }
  }

  return supabaseCoursetoCourse(data);
}

/**
 * Delete a course (CASCADE deletes exercise_progress)
 */
export async function deleteCourse(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('courses').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete course: ${error.message}`);
  }
}

/**
 * Toggle exercise completion
 */
export async function toggleExerciseCompletion(
  courseId: string,
  exerciseNumber: number,
  completed: boolean
): Promise<ExerciseProgress> {
  const supabase = createClient();
  const updateData = {
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from('exercise_progress')
    .update(updateData)
    .eq('course_id', courseId)
    .eq('exercise_number', exerciseNumber)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to toggle exercise: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned from database');
  }

  return supabaseExerciseProgressToExerciseProgress(data);
}
