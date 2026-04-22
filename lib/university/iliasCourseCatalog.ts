import type { CreateCourseInput } from '@/lib/schemas/course.schema';

export type IliasImportedCourseCatalogEntry = {
  slug: string;
  name: string;
  ects: number;
  examDate: string | null;
  semester: string;
  aliases: string[];
};

const DEFAULT_SEMESTER = 'SS 2026';

export const ILIAS_IMPORTED_COURSE_CATALOG: readonly IliasImportedCourseCatalogEntry[] = [
  {
    slug: 'wirtschaftspolitik',
    name: 'Einführung in die Wirtschaftspolitik',
    ects: 4.5,
    examDate: '2026-08-04',
    semester: DEFAULT_SEMESTER,
    aliases: ['Einführung in die Wirtschaftspolitik', 'Wirtschaftspolitik'],
  },
  {
    slug: 'or',
    name: 'Einführung in das OR',
    ects: 9,
    examDate: '2026-08-11',
    semester: DEFAULT_SEMESTER,
    aliases: ['Einführung in das OR', 'Einführung in das Operations Research', 'Operations Research'],
  },
  {
    slug: 'scm',
    name: 'Taktisches & operatives SCM',
    ects: 4.5,
    examDate: '2026-08-12',
    semester: DEFAULT_SEMESTER,
    aliases: ['Taktisches & operatives SCM', 'Taktisches und operatives SCM', 'Supply Chain Management'],
  },
  {
    slug: 'investments',
    name: 'Investments',
    ects: 4.5,
    examDate: '2026-08-13',
    semester: DEFAULT_SEMESTER,
    aliases: ['Investments'],
  },
  {
    slug: 'vwl-2',
    name: 'VWL 2',
    ects: 5,
    examDate: '2026-08-20',
    semester: DEFAULT_SEMESTER,
    aliases: ['VWL 2', 'Volkswirtschaftslehre II', 'Volkswirtschaftslehre 2', 'Makroökonomie'],
  },
  {
    slug: 'python-fahrzeugtechnik',
    name: 'Python-Algorithmen für Fahrzeugtechnik',
    ects: 4,
    examDate: '2026-08-26',
    semester: DEFAULT_SEMESTER,
    aliases: ['Python-Algorithmen für Fahrzeugtechnik', 'Python Algorithmen für Fahrzeugtechnik'],
  },
  {
    slug: 'elektrotechnik-1',
    name: 'Elektrotechnik 1',
    ects: 3,
    examDate: '2026-09-15',
    semester: DEFAULT_SEMESTER,
    aliases: ['Elektrotechnik 1', 'Elektrotechnik I'],
  },
  {
    slug: 'nutzfahrzeugentwicklung',
    name: 'Grundsätze der Nutzfahrzeugentwicklung 1&2',
    ects: 4,
    examDate: '2026-09-18',
    semester: DEFAULT_SEMESTER,
    aliases: [
      'Grundsätze der Nutzfahrzeugentwicklung 1&2',
      'Grundsätze der Nutzfahrzeugentwicklung 1 und 2',
      'Grundsaetze der Nutzfahrzeugentwicklung 1&2',
    ],
  },
  {
    slug: 'oeffentliche-einnahmen',
    name: 'Öffentliche Einnahmen',
    ects: 4.5,
    examDate: '2026-09-25',
    semester: DEFAULT_SEMESTER,
    aliases: ['Öffentliche Einnahmen', 'Oeffentliche Einnahmen'],
  },
  {
    slug: 'financial-data-science',
    name: 'Financial Data Science',
    ects: 9,
    examDate: null,
    semester: DEFAULT_SEMESTER,
    aliases: ['Financial Data Science', '10. Financial Data Science', '2530371 Financial Data Science'],
  },
];

const STOPWORDS = new Set(['und', 'der', 'die', 'das', 'dem', 'den', 'des', 'fuer', 'für', 'mit', 'ab', 'modul', 'module']);

const NORMALIZED_CATALOG = ILIAS_IMPORTED_COURSE_CATALOG.map((entry) => ({
  ...entry,
  normalizedAliases: Array.from(
    new Set([entry.name, ...entry.aliases].map((alias) => normalizeIliasImportedCourseText(alias)).filter(Boolean))
  ),
}));

export function normalizeIliasImportedCourseText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .toLocaleLowerCase('de')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeIliasImportedCourseText(value: string): string[] {
  return normalizeIliasImportedCourseText(value)
    .split(' ')
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function scoreAliasMatch(normalizedTitle: string, normalizedAlias: string): number {
  if (!normalizedTitle || !normalizedAlias) return 0;
  if (normalizedTitle === normalizedAlias) return 500 + normalizedAlias.length;
  if (normalizedTitle.includes(normalizedAlias)) return 380 + normalizedAlias.length;
  if (normalizedAlias.includes(normalizedTitle) && normalizedTitle.length >= 10) return 320 + normalizedTitle.length;

  const titleTokens = new Set(tokenizeIliasImportedCourseText(normalizedTitle));
  const aliasTokens = tokenizeIliasImportedCourseText(normalizedAlias);
  const matchedAliasTokens = aliasTokens.filter((token) => titleTokens.has(token)).length;

  if (matchedAliasTokens === aliasTokens.length && matchedAliasTokens >= 2) {
    return 250 + matchedAliasTokens * 25;
  }

  return 0;
}

export function matchIliasImportedCourseCatalog(title: string): IliasImportedCourseCatalogEntry | null {
  const normalizedTitle = normalizeIliasImportedCourseText(title);
  if (!normalizedTitle) return null;

  let bestMatch: IliasImportedCourseCatalogEntry | null = null;
  let bestScore = 0;

  for (const entry of NORMALIZED_CATALOG) {
    for (const alias of entry.normalizedAliases) {
      const score = scoreAliasMatch(normalizedTitle, alias);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }
  }

  return bestScore >= 250 ? bestMatch : null;
}

export function buildIliasImportedCourseInput(entry: IliasImportedCourseCatalogEntry): CreateCourseInput {
  return {
    name: entry.name,
    ects: entry.ects,
    numExercises: 12,
    examDate: entry.examDate ? new Date(`${entry.examDate}T00:00:00.000Z`) : undefined,
    semester: entry.semester,
  };
}
