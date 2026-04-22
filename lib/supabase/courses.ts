import { createClient } from '@/lib/auth/server';
import type { Database, SupabaseCourse, SupabaseExerciseProgress } from './types';
import type { Course, CreateCourseInput, ExerciseProgress, CourseWithExercises } from '../schemas/course.schema';

type CourseInsert = Database['public']['Tables']['courses']['Insert'];
type CourseUpdate = Database['public']['Tables']['courses']['Update'];
type ExerciseProgressInsert = Database['public']['Tables']['exercise_progress']['Insert'];
type IliasFavoriteRow = Database['public']['Tables']['kit_ilias_favorites']['Row'];
type CampusModuleRow = Database['public']['Tables']['kit_campus_modules']['Row'];

const DEFAULT_ILIAS_FAVORITE_ECTS = 5;
const DEFAULT_ILIAS_FAVORITE_EXERCISES = 12;
const DEFAULT_ILIAS_FAVORITE_SEMESTER = 'ILIAS';

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeCourseKey(title: string, semester: string | null | undefined): string {
  const normalizedTitle = normalizeWhitespace(title).toLocaleLowerCase('de');
  const normalizedSemester = normalizeWhitespace(semester ?? DEFAULT_ILIAS_FAVORITE_SEMESTER).toLocaleLowerCase('de');
  return `${normalizedTitle}::${normalizedSemester}`;
}

function normalizeMatchText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .toLocaleLowerCase('de')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeMatchText(value: string): string[] {
  const stopwords = new Set(['und', 'der', 'die', 'das', 'dem', 'den', 'des', 'für', 'mit', 'ab', 'modul', 'module']);
  return normalizeMatchText(value)
    .split(' ')
    .filter((token) => token.length > 2 && !stopwords.has(token));
}

function resolveFavoriteSemester(semesterLabel: string | null | undefined): string {
  const normalized = normalizeWhitespace(semesterLabel ?? '');
  return normalized.length > 0 ? normalized : DEFAULT_ILIAS_FAVORITE_SEMESTER;
}

function resolveFavoriteEcts(
  favorite: Pick<IliasFavoriteRow, 'title' | 'semester_label'>,
  campusModules: Pick<CampusModuleRow, 'title' | 'semester_label' | 'credits'>[]
): number {
  const favoriteTitle = normalizeMatchText(favorite.title);
  const favoriteSemester = normalizeCourseKey(favorite.title, favorite.semester_label).split('::')[1];
  const favoriteTokens = new Set(tokenizeMatchText(favorite.title));

  let bestMatch: Pick<CampusModuleRow, 'credits'> | null = null;
  let bestScore = 0;

  for (const campusModule of campusModules) {
    const moduleTitle = normalizeMatchText(campusModule.title);
    const moduleSemester = normalizeCourseKey(campusModule.title, campusModule.semester_label).split('::')[1];
    const moduleTokens = tokenizeMatchText(campusModule.title);

    let score = 0;
    if (moduleTitle === favoriteTitle) score += 100;
    if (moduleTitle.includes(favoriteTitle) || favoriteTitle.includes(moduleTitle)) score += 35;
    if (moduleSemester === favoriteSemester) score += 20;

    for (const token of moduleTokens) {
      if (favoriteTokens.has(token)) score += 10;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = campusModule;
    }
  }

  const credits = bestMatch?.credits;
  if (typeof credits === 'number' && credits >= 1 && credits <= 15) {
    return Number(credits.toFixed(1));
  }

  return DEFAULT_ILIAS_FAVORITE_ECTS;
}

export function buildIliasFavoriteCourseImports(
  favorites: Pick<IliasFavoriteRow, 'title' | 'semester_label'>[],
  existingCourses: Pick<SupabaseCourse, 'name' | 'semester'>[],
  campusModules: Pick<CampusModuleRow, 'title' | 'semester_label' | 'credits'>[]
): CreateCourseInput[] {
  const seenKeys = new Set(existingCourses.map((course) => normalizeCourseKey(course.name, course.semester)));
  const imports: CreateCourseInput[] = [];

  for (const favorite of favorites) {
    const key = normalizeCourseKey(favorite.title, favorite.semester_label);
    if (seenKeys.has(key)) continue;

    imports.push({
      name: normalizeWhitespace(favorite.title),
      ects: resolveFavoriteEcts(favorite, campusModules),
      numExercises: DEFAULT_ILIAS_FAVORITE_EXERCISES,
      semester: resolveFavoriteSemester(favorite.semester_label),
    });
    seenKeys.add(key);
  }

  return imports;
}

async function ensureCoursesFromIliasFavorites(userId: string): Promise<void> {
  const supabase = createClient();

  const [existingCoursesResult, favoritesResult, campusModulesResult] = await Promise.all([
    supabase.from('courses').select('id, name, semester').eq('user_id', userId),
    supabase
      .from('kit_ilias_favorites')
      .select('title, semester_label')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false }),
    supabase.from('kit_campus_modules').select('title, semester_label, credits').eq('user_id', userId),
  ]);

  if (existingCoursesResult.error) {
    throw new Error(`Failed to inspect existing courses: ${existingCoursesResult.error.message}`);
  }
  if (favoritesResult.error) {
    throw new Error(`Failed to inspect ILIAS favorites: ${favoritesResult.error.message}`);
  }
  if (campusModulesResult.error) {
    throw new Error(`Failed to inspect KIT modules: ${campusModulesResult.error.message}`);
  }

  const imports = buildIliasFavoriteCourseImports(
    favoritesResult.data ?? [],
    existingCoursesResult.data ?? [],
    campusModulesResult.data ?? []
  );

  if (imports.length === 0) return;

  const courseRows = imports.map((course) => ({
    ...courseToSupabaseInsert(course),
    user_id: userId,
  }));

  const { data: insertedCourses, error: insertCoursesError } = await supabase
    .from('courses')
    .insert(courseRows)
    .select('id, num_exercises');

  if (insertCoursesError) {
    throw new Error(`Failed to import ILIAS favorite courses: ${insertCoursesError.message}`);
  }

  const exerciseRows = (insertedCourses ?? []).flatMap((course) =>
    Array.from({ length: course.num_exercises }, (_, index) => ({
      user_id: userId,
      course_id: course.id,
      exercise_number: index + 1,
      completed: false,
    }))
  );

  if (exerciseRows.length === 0) return;

  const { error: exerciseError } = await supabase.from('exercise_progress').insert(exerciseRows);

  if (exerciseError) {
    await supabase.from('courses').delete().eq('user_id', userId).in(
      'id',
      (insertedCourses ?? []).map((course) => course.id)
    );
    throw new Error(`Failed to create exercise progress: ${exerciseError.message}`);
  }
}

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
    expectedGrade: row.expected_grade ?? undefined,
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
export function courseToSupabaseInsert(course: CreateCourseInput): Omit<CourseInsert, 'user_id'> {
  return {
    name: course.name,
    ects: course.ects,
    num_exercises: course.numExercises,
    exam_date: course.examDate ? (course.examDate.toISOString().split('T')[0] ?? '') : null,
    semester: course.semester,
  };
}

/**
 * Fetch all courses with their exercise progress in a single query
 */
export async function fetchCoursesWithExercises(userId: string): Promise<CourseWithExercises[]> {
  await ensureCoursesFromIliasFavorites(userId);
  const supabase = createClient();

  const { data, error } = await supabase
    .from('courses')
    .select('*, exercise_progress(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch courses: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((course) => ({
    ...supabaseCoursetoCourse(course),
    exercises: ((course as any).exercise_progress || [])
      .sort((a: SupabaseExerciseProgress, b: SupabaseExerciseProgress) => a.exercise_number - b.exercise_number)
      .map(supabaseExerciseProgressToExerciseProgress),
  }));
}

/**
 * Create a new course with exercise progress entries
 */
export async function createCourse(userId: string, course: CreateCourseInput): Promise<CourseWithExercises> {
  const supabase = createClient();
  const insertData = courseToSupabaseInsert(course);

  // Insert course
  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .insert({ ...insertData, user_id: userId })
    .select()
    .single();

  if (courseError) {
    throw new Error(`Failed to create course: ${courseError.message}`);
  }

  // Create exercise progress entries
  const exerciseProgressInserts: ExerciseProgressInsert[] = [];
  for (let i = 1; i <= course.numExercises; i++) {
        exerciseProgressInserts.push({
      user_id: userId,
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
export async function updateCourse(userId: string, id: string, updates: Partial<CreateCourseInput>): Promise<Course> {
  const supabase = createClient();
  const updateData: CourseUpdate = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.ects !== undefined) updateData.ects = updates.ects;
  if (updates.numExercises !== undefined) updateData.num_exercises = updates.numExercises;
  if (updates.examDate !== undefined) {
    updateData.exam_date = updates.examDate ? (updates.examDate.toISOString().split('T')[0] ?? '') : null;
  }
  if (updates.semester !== undefined) updateData.semester = updates.semester;
  if (updates.expectedGrade !== undefined) updateData.expected_grade = updates.expectedGrade ?? null;

  const { data, error } = await supabase
    .from('courses')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
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
      .eq('user_id', userId)
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
          user_id: userId,
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
        .eq('user_id', userId)
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
export async function deleteCourse(userId: string, id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete course: ${error.message}`);
  }
}

/**
 * Toggle exercise completion
 */
export async function toggleExerciseCompletion(
  userId: string,
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
    .eq('user_id', userId)
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
