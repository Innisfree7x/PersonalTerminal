import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Database } from '@/lib/supabase/types';

type CourseRow = Database['public']['Tables']['courses']['Row'];
type CourseInsert = Database['public']['Tables']['courses']['Insert'];
type ExerciseProgressInsert = Database['public']['Tables']['exercise_progress']['Insert'];

const SEMESTER = 'SoSe 2026';

const modules = [
  { name: 'Einführung in das OR', ects: 9, examDate: '2026-08-11', numExercises: 1 },
  { name: 'Taktisches und operatives SCM', ects: 4.5, examDate: '2026-08-12', numExercises: 1 },
  { name: 'Investments', ects: 4.5, examDate: '2026-08-13', numExercises: 1 },
  { name: 'VWL 2 / Makroökonomie', ects: 5, examDate: '2026-08-20', numExercises: 1 },
  { name: 'Python Algos Fahrzeugtechnik', ects: 4, examDate: '2026-08-26', numExercises: 1 },
  { name: 'Elektrotechnik 1', ects: 3, examDate: '2026-09-15', numExercises: 1 },
  { name: 'Grundsätze Nutzfahrzeugentwicklung', ects: 4, examDate: '2026-09-18', numExercises: 1 },
  { name: 'Öffentliche Einnahmen', ects: 4.5, examDate: '2026-09-25', numExercises: 1 },
  { name: 'Financial Data Science', ects: 9, examDate: null, numExercises: 12 },
] satisfies Array<{
  name: string;
  ects: number;
  examDate: string | null;
  numExercises: number;
}>;

function loadEnvVars() {
  for (const envPath of [join(process.cwd(), '.env.local'), join(process.cwd(), 'File_Explorer.env.local')]) {
    try {
      const content = readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key, ...valueParts] = trimmed.split('=');
        if (!key || valueParts.length === 0) continue;
        if (!process.env[key]) process.env[key] = valueParts.join('=').trim();
      }
      return;
    } catch {
      // Try next env file.
    }
  }
}

async function getAuthenticatedUserId(supabase: ReturnType<typeof createClient<Database>>) {
  const email = process.env.INNIS_COURSE_SEED_EMAIL;
  const password = process.env.INNIS_COURSE_SEED_PASSWORD;
  if (!email || !password) {
    throw new Error('Set INNIS_COURSE_SEED_EMAIL and INNIS_COURSE_SEED_PASSWORD to seed courses via RLS.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    throw new Error(`Course seed login failed: ${error?.message ?? 'no user returned'}`);
  }

  return data.user.id;
}

async function syncExercises(
  supabase: ReturnType<typeof createClient<Database>>,
  userId: string,
  courseId: string,
  desiredCount: number
) {
  const { data, error } = await supabase
    .from('exercise_progress')
    .select('exercise_number')
    .eq('user_id', userId)
    .eq('course_id', courseId);

  if (error) throw new Error(`Failed to fetch exercises for ${courseId}: ${error.message}`);

  const existingNumbers = new Set((data ?? []).map((row) => row.exercise_number));
  const missing: ExerciseProgressInsert[] = [];

  for (let exerciseNumber = 1; exerciseNumber <= desiredCount; exerciseNumber += 1) {
    if (existingNumbers.has(exerciseNumber)) continue;
    missing.push({
      user_id: userId,
      course_id: courseId,
      exercise_number: exerciseNumber,
      completed: false,
    });
  }

  if (missing.length > 0) {
    const { error: insertError } = await supabase.from('exercise_progress').insert(missing);
    if (insertError) throw new Error(`Failed to create exercises for ${courseId}: ${insertError.message}`);
  }

  const extraNumbers = Array.from(existingNumbers).filter((number) => number > desiredCount);
  if (extraNumbers.length > 0) {
    const { error: deleteError } = await supabase
      .from('exercise_progress')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .in('exercise_number', extraNumbers);
    if (deleteError) throw new Error(`Failed to trim exercises for ${courseId}: ${deleteError.message}`);
  }
}

async function upsertCourse(
  supabase: ReturnType<typeof createClient<Database>>,
  userId: string,
  module: (typeof modules)[number]
) {
  const { data: existing, error: existingError } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', userId)
    .eq('semester', SEMESTER)
    .eq('name', module.name)
    .maybeSingle();

  if (existingError) throw new Error(`Failed to inspect ${module.name}: ${existingError.message}`);

  const row: Omit<CourseInsert, 'user_id'> = {
    name: module.name,
    ects: module.ects,
    num_exercises: module.numExercises,
    exam_date: module.examDate,
    semester: SEMESTER,
  };

  let course: CourseRow;
  if (existing) {
    const { data, error } = await supabase
      .from('courses')
      .update(row)
      .eq('user_id', userId)
      .eq('id', existing.id)
      .select('*')
      .single();
    if (error || !data) throw new Error(`Failed to update ${module.name}: ${error?.message ?? 'no data'}`);
    course = data;
  } else {
    const { data, error } = await supabase
      .from('courses')
      .insert({ ...row, user_id: userId })
      .select('*')
      .single();
    if (error || !data) throw new Error(`Failed to create ${module.name}: ${error?.message ?? 'no data'}`);
    course = data;
  }

  await syncExercises(supabase, userId, course.id, module.numExercises);
  return course;
}

async function main() {
  loadEnvVars();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  const userId = await getAuthenticatedUserId(supabase);

  for (const module of modules) {
    const course = await upsertCourse(supabase, userId, module);
    console.log(`Seeded ${course.name} (${course.ects} ECTS, ${course.semester})`);
  }

  console.log(`Done. Seeded ${modules.length} SoSe 2026 modules.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
