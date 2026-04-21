import type { SupabaseClient } from '@supabase/supabase-js';

export interface KitCourseRow {
  id: string;
  title: string;
  moduleCode: string | null;
  credits: number | null;
  status: 'active' | 'completed' | 'dropped' | 'planned' | 'unknown';
  semesterLabel: string | null;
  matchedExamDate: string | null;
  matchedExamTitle: string | null;
}

export interface KitCoursesResult {
  semesters: string[];
  modules: KitCourseRow[];
  totalCredits: number;
}

interface ExamEventRow {
  title: string;
  starts_at: string;
}

const STOPWORDS = new Set([
  'und',
  'der',
  'die',
  'das',
  'in',
  'das',
  'das',
  'fur',
  'mit',
  'von',
  'zur',
  'zum',
  'einfuhrung',
  'taktisches',
  'operatives',
  'grundsatze',
]);

function normalizeToken(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function significantTokens(title: string): string[] {
  return normalizeToken(title)
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

export function matchExamForModule(
  moduleTitle: string,
  exams: ExamEventRow[]
): ExamEventRow | null {
  const modTokens = significantTokens(moduleTitle);
  if (modTokens.length === 0) return null;

  let bestMatch: { exam: ExamEventRow; overlap: number } | null = null;

  for (const exam of exams) {
    const examTokens = new Set(significantTokens(exam.title));
    const overlap = modTokens.filter((t) => examTokens.has(t)).length;
    if (overlap === 0) continue;
    if (!bestMatch || overlap > bestMatch.overlap) {
      bestMatch = { exam, overlap };
    }
  }

  if (!bestMatch) return null;
  const minOverlap = Math.max(1, Math.min(2, Math.floor(modTokens.length / 2)));
  return bestMatch.overlap >= minOverlap ? bestMatch.exam : null;
}

export async function listKitCoursesForSemesters(
  supabase: SupabaseClient,
  userId: string,
  semesterLabels: string[]
): Promise<KitCoursesResult> {
  const modulesQuery = supabase
    .from('kit_campus_modules')
    .select('id, title, module_code, credits, status, semester_label')
    .eq('user_id', userId)
    .order('title', { ascending: true });

  const scoped =
    semesterLabels.length > 0
      ? modulesQuery.in('semester_label', semesterLabels)
      : modulesQuery;

  const { data: modulesData, error: modulesError } = await scoped;
  if (modulesError) {
    throw new Error(`Failed to fetch KIT modules: ${modulesError.message}`);
  }

  const todayIso = new Date().toISOString();
  const { data: examsData, error: examsError } = await supabase
    .from('kit_campus_events')
    .select('title, starts_at')
    .eq('user_id', userId)
    .eq('kind', 'exam')
    .gte('starts_at', todayIso)
    .order('starts_at', { ascending: true });

  if (examsError) {
    throw new Error(`Failed to fetch KIT exam events: ${examsError.message}`);
  }

  const exams = (examsData ?? []) as ExamEventRow[];

  const modules: KitCourseRow[] = (modulesData ?? []).map((row) => {
    const match = matchExamForModule(row.title, exams);
    return {
      id: row.id,
      title: row.title,
      moduleCode: row.module_code,
      credits: row.credits,
      status: row.status,
      semesterLabel: row.semester_label,
      matchedExamDate: match?.starts_at ?? null,
      matchedExamTitle: match?.title ?? null,
    };
  });

  const totalCredits = modules.reduce((sum, m) => sum + (m.credits ?? 0), 0);

  return {
    semesters: semesterLabels,
    modules,
    totalCredits,
  };
}

export async function listAvailableSemesters(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('kit_campus_modules')
    .select('semester_label')
    .eq('user_id', userId)
    .not('semester_label', 'is', null);

  if (error) {
    throw new Error(`Failed to fetch KIT semesters: ${error.message}`);
  }

  const set = new Set<string>();
  for (const row of data ?? []) {
    if (row.semester_label) set.add(row.semester_label);
  }
  return Array.from(set).sort().reverse();
}
