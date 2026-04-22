import { createClient } from '@/lib/auth/server';
import type { Database, SupabaseCourse, SupabaseExerciseProgress } from './types';
import type { Course, CreateCourseInput, ExerciseProgress, CourseWithExercises } from '../schemas/course.schema';
import {
  buildIliasImportedCourseInput,
  matchIliasImportedCourseCatalog,
  normalizeIliasImportedCourseText,
} from '@/lib/university/iliasCourseCatalog';

type CourseInsert = Database['public']['Tables']['courses']['Insert'];
type CourseUpdate = Database['public']['Tables']['courses']['Update'];
type ExerciseProgressInsert = Database['public']['Tables']['exercise_progress']['Insert'];
type IliasFavoriteRow = Database['public']['Tables']['kit_ilias_favorites']['Row'];
type ExistingCourseImportRow = Pick<
  SupabaseCourse,
  'id' | 'name' | 'semester' | 'ects' | 'num_exercises' | 'exam_date' | 'expected_grade' | 'created_at'
> & {
  exercise_progress: Pick<
    SupabaseExerciseProgress,
    'id' | 'exercise_number' | 'completed' | 'completed_at' | 'created_at'
  >[];
};

function getCatalogSlug(title: string): string | null {
  return matchIliasImportedCourseCatalog(title)?.slug ?? null;
}

function getCompletedExerciseCount(course: ExistingCourseImportRow): number {
  return course.exercise_progress.filter((exercise) => exercise.completed).length;
}

export function buildIliasFavoriteCourseImports(
  favorites: Pick<IliasFavoriteRow, 'title' | 'semester_label'>[],
  existingCourses: Pick<SupabaseCourse, 'name' | 'semester'>[],
  _unusedCampusModules: unknown[] = []
): CreateCourseInput[] {
  const seenCatalogSlugs = new Set(existingCourses.map((course) => getCatalogSlug(course.name)).filter(Boolean));
  const imports: CreateCourseInput[] = [];

  for (const favorite of favorites) {
    const matchedCatalogCourse = matchIliasImportedCourseCatalog(favorite.title);
    if (!matchedCatalogCourse || seenCatalogSlugs.has(matchedCatalogCourse.slug)) continue;
    imports.push(buildIliasImportedCourseInput(matchedCatalogCourse));
    seenCatalogSlugs.add(matchedCatalogCourse.slug);
  }

  return imports;
}

export function collectIliasFavoriteIdsForCourseDeletion(
  courseName: string,
  favorites: Pick<IliasFavoriteRow, 'id' | 'title'>[]
): string[] {
  const slug = getCatalogSlug(courseName);
  if (!slug) return [];

  return favorites.filter((favorite) => getCatalogSlug(favorite.title) === slug).map((favorite) => favorite.id);
}

function chooseCourseKeeper(courses: ExistingCourseImportRow[]): ExistingCourseImportRow {
  const [keeper] = [...courses].sort((left, right) => {
    const completedDelta = getCompletedExerciseCount(right) - getCompletedExerciseCount(left);
    if (completedDelta !== 0) return completedDelta;

    const leftCreatedAt = new Date(left.created_at).getTime();
    const rightCreatedAt = new Date(right.created_at).getTime();
    if (leftCreatedAt !== rightCreatedAt) return leftCreatedAt - rightCreatedAt;

    return left.id.localeCompare(right.id);
  });

  if (!keeper) {
    throw new Error('Cannot choose a course keeper from an empty course set.');
  }

  return keeper;
}

function buildMergedExerciseCompletionMap(courses: ExistingCourseImportRow[]): Map<number, string | null> {
  const completedExercises = new Map<number, string | null>();

  for (const course of courses) {
    for (const exercise of course.exercise_progress) {
      if (!exercise.completed) continue;
      if (exercise.exercise_number < 1 || exercise.exercise_number > 12) continue;

      const completedAt = exercise.completed_at ?? exercise.created_at ?? null;
      const previousCompletedAt = completedExercises.get(exercise.exercise_number);
      if (!previousCompletedAt || (completedAt && completedAt < previousCompletedAt)) {
        completedExercises.set(exercise.exercise_number, completedAt);
      }
    }
  }

  return completedExercises;
}

function isUntouchedAutoImportedCourse(course: ExistingCourseImportRow): boolean {
  const hasExamDate = Boolean(course.exam_date);
  const hasExpectedGrade = course.expected_grade !== null && course.expected_grade !== undefined;
  return (
    course.num_exercises === 12 &&
    getCompletedExerciseCount(course) === 0 &&
    !hasExamDate &&
    !hasExpectedGrade
  );
}

function looksLikeObviousImportedJunk(title: string): boolean {
  return /@/i.test(title) || /^\s*\d{5,}/.test(title) || /\b(?:wise|ws|ss)\b/i.test(title);
}

async function syncCourseExerciseShape(
  userId: string,
  courseId: string,
  currentExercises: ExistingCourseImportRow['exercise_progress'],
  desiredCount: number
) {
  const supabase = createClient();
  const existingNumbers = new Set(currentExercises.map((exercise) => exercise.exercise_number));
  const missingExercises: ExerciseProgressInsert[] = [];

  for (let exerciseNumber = 1; exerciseNumber <= desiredCount; exerciseNumber += 1) {
    if (existingNumbers.has(exerciseNumber)) continue;
    missingExercises.push({
      user_id: userId,
      course_id: courseId,
      exercise_number: exerciseNumber,
      completed: false,
    });
  }

  if (missingExercises.length > 0) {
    const { error } = await supabase.from('exercise_progress').insert(missingExercises);
    if (error) {
      throw new Error(`Failed to create missing exercises: ${error.message}`);
    }
  }

  if (currentExercises.some((exercise) => exercise.exercise_number > desiredCount)) {
    const { error } = await supabase
      .from('exercise_progress')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .gt('exercise_number', desiredCount);

    if (error) {
      throw new Error(`Failed to trim excess exercises: ${error.message}`);
    }
  }
}

async function mergeCompletedExercisesIntoCourse(
  userId: string,
  courseId: string,
  completedExercises: Map<number, string | null>
) {
  const supabase = createClient();

  for (const [exerciseNumber, completedAt] of Array.from(completedExercises.entries())) {
    const { error } = await supabase
      .from('exercise_progress')
      .update({
        completed: true,
        completed_at: completedAt ?? new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('exercise_number', exerciseNumber);

    if (error) {
      throw new Error(`Failed to merge exercise progress: ${error.message}`);
    }
  }
}

async function deleteCoursesAndExercises(userId: string, courseIds: string[]) {
  if (courseIds.length === 0) return;
  const supabase = createClient();

  const { error: exercisesError } = await supabase
    .from('exercise_progress')
    .delete()
    .eq('user_id', userId)
    .in('course_id', courseIds);

  if (exercisesError) {
    throw new Error(`Failed to delete duplicate exercise progress: ${exercisesError.message}`);
  }

  const { error: coursesError } = await supabase
    .from('courses')
    .delete()
    .eq('user_id', userId)
    .in('id', courseIds);

  if (coursesError) {
    throw new Error(`Failed to delete duplicate courses: ${coursesError.message}`);
  }
}

async function ensureCoursesFromIliasFavorites(userId: string): Promise<void> {
  const supabase = createClient();

  const [existingCoursesResult, favoritesResult] = await Promise.all([
    supabase
      .from('courses')
      .select('id, name, semester, ects, num_exercises, exam_date, expected_grade, created_at, exercise_progress(id, exercise_number, completed, completed_at, created_at)')
      .eq('user_id', userId),
    supabase
      .from('kit_ilias_favorites')
      .select('id, title, semester_label')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false }),
  ]);

  if (existingCoursesResult.error) {
    throw new Error(`Failed to inspect existing courses: ${existingCoursesResult.error.message}`);
  }
  if (favoritesResult.error) {
    throw new Error(`Failed to inspect ILIAS favorites: ${favoritesResult.error.message}`);
  }

  const existingCourses = (existingCoursesResult.data ?? []) as ExistingCourseImportRow[];
  const favorites = favoritesResult.data ?? [];
  const unmatchedFavoriteTitles = new Set<string>();
  const matchedCoursesBySlug = new Map<string, ExistingCourseImportRow[]>();

  for (const favorite of favorites) {
    if (!getCatalogSlug(favorite.title)) {
      unmatchedFavoriteTitles.add(normalizeIliasImportedCourseText(favorite.title));
    }
  }

  for (const course of existingCourses) {
    const slug = getCatalogSlug(course.name);
    if (!slug) continue;
    const bucket = matchedCoursesBySlug.get(slug) ?? [];
    bucket.push(course);
    matchedCoursesBySlug.set(slug, bucket);
  }

  for (const [slug, courses] of Array.from(matchedCoursesBySlug.entries())) {
    const matchedCatalogCourse = matchIliasImportedCourseCatalog(courses[0]?.name ?? '');
    if (!matchedCatalogCourse) continue;

    const keeper = chooseCourseKeeper(courses);
    const duplicateIds = courses.filter((course) => course.id !== keeper.id).map((course) => course.id);
    const canonicalCourseInput = buildIliasImportedCourseInput(matchedCatalogCourse);
    const canonicalInsert = courseToSupabaseInsert(canonicalCourseInput);
    const shouldUpdateKeeper =
      keeper.name !== canonicalCourseInput.name ||
      keeper.ects !== canonicalCourseInput.ects ||
      keeper.semester !== canonicalCourseInput.semester ||
      keeper.num_exercises !== canonicalCourseInput.numExercises ||
      (keeper.exam_date ?? null) !== canonicalInsert.exam_date;

    if (shouldUpdateKeeper) {
      const { error } = await supabase
        .from('courses')
        .update({
          name: canonicalCourseInput.name,
          ects: canonicalCourseInput.ects,
          semester: canonicalCourseInput.semester,
          num_exercises: canonicalCourseInput.numExercises,
          exam_date: canonicalInsert.exam_date ?? null,
        })
        .eq('user_id', userId)
        .eq('id', keeper.id);

      if (error) {
        throw new Error(`Failed to normalize imported course ${slug}: ${error.message}`);
      }
    }

    await syncCourseExerciseShape(userId, keeper.id, keeper.exercise_progress, canonicalCourseInput.numExercises);
    await mergeCompletedExercisesIntoCourse(userId, keeper.id, buildMergedExerciseCompletionMap(courses));
    await deleteCoursesAndExercises(userId, duplicateIds);
  }

  const staleCourseIds = existingCourses
    .filter((course) => {
      if (getCatalogSlug(course.name)) return false;
      if (!isUntouchedAutoImportedCourse(course)) return false;

      const normalizedName = normalizeIliasImportedCourseText(course.name);
      return unmatchedFavoriteTitles.has(normalizedName) || looksLikeObviousImportedJunk(course.name);
    })
    .map((course) => course.id);

  await deleteCoursesAndExercises(userId, staleCourseIds);

  const imports = buildIliasFavoriteCourseImports(favorites, existingCourses);

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

  const { data: courseData, error: courseLookupError } = await supabase
    .from('courses')
    .select('id, name')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (courseLookupError) {
    throw new Error(`Failed to load course for deletion: ${courseLookupError.message}`);
  }

  if (courseData) {
    const { data: favorites, error: favoritesError } = await supabase
      .from('kit_ilias_favorites')
      .select('id, title')
      .eq('user_id', userId);

    if (favoritesError) {
      throw new Error(`Failed to inspect ILIAS favorites: ${favoritesError.message}`);
    }

    const favoriteIds = collectIliasFavoriteIdsForCourseDeletion(courseData.name, favorites ?? []);
    if (favoriteIds.length > 0) {
      const { error: favoriteDeleteError } = await supabase
        .from('kit_ilias_favorites')
        .delete()
        .eq('user_id', userId)
        .in('id', favoriteIds);

      if (favoriteDeleteError) {
        throw new Error(`Failed to delete linked ILIAS favorites: ${favoriteDeleteError.message}`);
      }
    }
  }

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
