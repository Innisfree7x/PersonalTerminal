import { z } from 'zod';
import {
  campusConnectorPayloadSchema,
  type CampusConnectorExamInput,
  type CampusConnectorGradeInput,
  type CampusConnectorModuleInput,
} from '@/lib/schemas/kit-sync.schema';

export const KIT_CAMPUS_ACADEMIC_CONNECTOR_VERSION = 'kit-campus-academic-v1';
export const KIT_CAMPUS_ACADEMIC_EXPORT_TYPE = 'innis_kit_campus_academic_export';
export const KIT_CAMPUS_ACADEMIC_EXPORT_VERSION = 1;

const campusAcademicExportSchema = z.object({
  exportType: z.literal(KIT_CAMPUS_ACADEMIC_EXPORT_TYPE),
  exportVersion: z.literal(KIT_CAMPUS_ACADEMIC_EXPORT_VERSION),
  generatedAt: z.string().datetime({ offset: true }),
  sourceUrl: z.string().trim().url().max(2048),
  modules: campusConnectorPayloadSchema.shape.modules,
  grades: campusConnectorPayloadSchema.shape.grades,
  exams: campusConnectorPayloadSchema.shape.exams,
});

const blockedLabels = new Set([
  'Dashboard',
  'Magazin',
  'Persönlicher Arbeitsraum',
  'Lernerfolge',
  'Meine Kurse und Gruppen',
  'Kommunikation',
  'Support',
  'Abonnieren',
  'Hilfe',
  'Nachrichtenzentrale',
  'Suche',
  'Datenschutz',
  'Impressum',
  'Barrierefreiheit',
]);

function normalizeText(value: string | null | undefined) {
  return value?.replace(/\s+/g, ' ').trim() ?? '';
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stableHash(parts: Array<string | null | undefined>) {
  const input = parts.map((part) => part ?? '').join('|');
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function normalizeHeader(value: string) {
  return normalizeText(value).toLowerCase();
}

function findColumnIndex(headers: string[], matchers: string[]) {
  return headers.findIndex((header) => matchers.some((matcher) => header.includes(matcher)));
}

function pickCell(cells: string[], index: number) {
  return index >= 0 ? normalizeText(cells[index]) : '';
}

function parseCredits(value: string) {
  if (!value) return null;
  const match = value.replace(',', '.').match(/\d+(?:\.\d+)?/);
  return match ? Number.parseFloat(match[0]) : null;
}

function parseGradeValue(value: string) {
  const match = value.replace(',', '.').match(/[1-5](?:\.\d)?/);
  return match ? Number.parseFloat(match[0]) : null;
}

function inferStatus(value: string): CampusConnectorModuleInput['status'] {
  const text = normalizeHeader(value);
  if (!text) return 'active';
  if (text.includes('bestanden') || text.includes('abgeschlossen') || text.includes('completed')) return 'completed';
  if (text.includes('abgemeldet') || text.includes('withdrawn') || text.includes('dropped')) return 'dropped';
  if (text.includes('geplant') || text.includes('planned')) return 'planned';
  if (text.includes('unbekannt') || text.includes('unknown')) return 'unknown';
  return 'active';
}

function parseGermanDate(value: string) {
  const match = value.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!match) return null;
  const dayRaw = match[1];
  const monthRaw = match[2];
  const yearRaw = match[3];
  if (!dayRaw || !monthRaw || !yearRaw) return null;
  const day = Number.parseInt(dayRaw, 10);
  const month = Number.parseInt(monthRaw, 10);
  const year = Number.parseInt(yearRaw, 10);
  if (!day || !month || !year) return null;
  return { day, month, year };
}

function parseGermanTime(value: string) {
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hourRaw = match[1];
  const minuteRaw = match[2];
  if (!hourRaw || !minuteRaw) return null;
  return {
    hour: Number.parseInt(hourRaw, 10),
    minute: Number.parseInt(minuteRaw, 10),
  };
}

function createIsoDateTime(dateText: string, timeText?: string | null) {
  const date = parseGermanDate(dateText);
  if (!date) return null;

  const time = parseGermanTime(timeText ?? '');
  const instance = new Date(
    date.year,
    date.month - 1,
    date.day,
    time?.hour ?? 0,
    time?.minute ?? 0,
    0,
    0
  );

  if (Number.isNaN(instance.getTime())) return null;
  return instance.toISOString();
}

function parseSemesterLabel(value: string | null | undefined) {
  const text = normalizeText(value);
  if (!text) return null;
  const match = text.match(/\b(?:WS|SS)\s*\d{4}\b/i);
  return match ? match[0].replace(/\s+/, ' ').toUpperCase() : null;
}

function extractModuleCodeAndTitle(rawValue: string) {
  const text = normalizeText(rawValue);
  if (!text) {
    return { moduleCode: null, title: null };
  }

  const prefixed = text.match(/^(\d{5,})\s*[–-]\s*(.+)$/);
  if (prefixed?.[1] && prefixed[2]) {
    return { moduleCode: prefixed[1], title: prefixed[2].trim() };
  }

  const codeOnly = text.match(/\b(\d{5,})\b/);
  if (codeOnly?.[1]) {
    const cleanedTitle = text.replace(codeOnly[1], '').replace(/^[–-]\s*/, '').trim();
    return {
      moduleCode: codeOnly[1],
      title: cleanedTitle || text,
    };
  }

  return { moduleCode: null, title: text };
}

type TableRow = { cells: string[] };
type ExtractedTable = { headers: string[]; rows: TableRow[] };

function extractTables(doc: Document): ExtractedTable[] {
  return Array.from(doc.querySelectorAll('table')).map((table) => {
    const headerCells = Array.from(table.querySelectorAll('thead th'));
    const fallbackHeaderCells = headerCells.length === 0
      ? Array.from(table.querySelectorAll('tr')).find((row) => row.querySelector('th'))?.querySelectorAll('th') ?? []
      : [];
    const headerSource = headerCells.length > 0 ? headerCells : Array.from(fallbackHeaderCells);
    const headers = headerSource.map((cell) => normalizeHeader(cell.textContent ?? ''));

    const rows = Array.from(table.querySelectorAll('tr'))
      .filter((row) => row.querySelectorAll('td').length > 0)
      .map((row) => ({
        cells: Array.from(row.querySelectorAll('td')).map((cell) => normalizeText(cell.textContent ?? '')),
      }))
      .filter((row) => row.cells.some(Boolean));

    return { headers, rows };
  }).filter((table) => table.headers.length > 0 && table.rows.length > 0);
}

function inferSourceUpdatedAt() {
  return new Date().toISOString();
}

function buildModuleExternalId(moduleCode: string | null, title: string, semesterLabel: string | null) {
  if (moduleCode) return `module:${moduleCode}`;
  return `module:${slugify(title)}:${slugify(semesterLabel ?? 'unknown')}:${stableHash([title, semesterLabel])}`;
}

function extractModulesFromTables(tables: ExtractedTable[]): CampusConnectorModuleInput[] {
  const results = new Map<string, CampusConnectorModuleInput>();

  for (const table of tables) {
    const titleIndex = findColumnIndex(table.headers, ['modul', 'titel', 'veranstaltung', 'bezeichnung', 'name']);
    const creditsIndex = findColumnIndex(table.headers, ['ects', 'lp', 'credit']);
    const semesterIndex = findColumnIndex(table.headers, ['semester', 'term']);
    const statusIndex = findColumnIndex(table.headers, ['status']);
    const codeIndex = findColumnIndex(table.headers, ['nummer', 'nr.', 'modulnr', 'modulcode', 'code']);

    const looksLikeModuleTable = titleIndex >= 0 && (creditsIndex >= 0 || semesterIndex >= 0 || statusIndex >= 0 || codeIndex >= 0);
    if (!looksLikeModuleTable) continue;

    for (const row of table.rows) {
      const codeCell = pickCell(row.cells, codeIndex);
      const titleCell = pickCell(row.cells, titleIndex);
      const parsed = extractModuleCodeAndTitle(titleCell || codeCell);
      const moduleCode = parsed.moduleCode ?? (codeCell.match(/\d{5,}/)?.[0] ?? null);
      const title = parsed.title ?? null;
      if (!title || blockedLabels.has(title)) continue;

      const semesterLabel = parseSemesterLabel(pickCell(row.cells, semesterIndex));
      const externalId = buildModuleExternalId(moduleCode, title, semesterLabel);
      results.set(externalId, {
        externalId,
        moduleCode,
        title,
        status: inferStatus(pickCell(row.cells, statusIndex)),
        semesterLabel,
        credits: parseCredits(pickCell(row.cells, creditsIndex)),
        sourceUpdatedAt: inferSourceUpdatedAt(),
      });
    }
  }

  return Array.from(results.values());
}

function extractGradesFromTables(tables: ExtractedTable[]): CampusConnectorGradeInput[] {
  const grades = new Map<string, CampusConnectorGradeInput>();

  for (const table of tables) {
    const titleIndex = findColumnIndex(table.headers, ['modul', 'titel', 'veranstaltung', 'bezeichnung', 'name']);
    const gradeIndex = findColumnIndex(table.headers, ['note', 'bewertung', 'ergebnis']);
    const examDateIndex = findColumnIndex(table.headers, ['prüfungsdatum', 'datum', 'termin']);
    const publishedIndex = findColumnIndex(table.headers, ['bekannt', 'veröffentlicht', 'published']);
    const codeIndex = findColumnIndex(table.headers, ['nummer', 'nr.', 'modulnr', 'modulcode', 'code']);

    const looksLikeGradeTable = titleIndex >= 0 && gradeIndex >= 0;
    if (!looksLikeGradeTable) continue;

    for (const row of table.rows) {
      const titleCell = pickCell(row.cells, titleIndex);
      const codeCell = pickCell(row.cells, codeIndex);
      const gradeLabel = pickCell(row.cells, gradeIndex);
      if (!gradeLabel || blockedLabels.has(titleCell)) continue;

      const parsed = extractModuleCodeAndTitle(titleCell || codeCell);
      const moduleCode = parsed.moduleCode ?? (codeCell.match(/\d{5,}/)?.[0] ?? null);
      const title = parsed.title ?? titleCell;
      if (!title) continue;

      const moduleExternalId = buildModuleExternalId(moduleCode, title, parseSemesterLabel(titleCell));
      const examDateParts = parseGermanDate(pickCell(row.cells, examDateIndex));
      const examDate = examDateParts
        ? `${examDateParts.year}-${String(examDateParts.month).padStart(2, '0')}-${String(examDateParts.day).padStart(2, '0')}`
        : null;
      const publishedAt = createIsoDateTime(pickCell(row.cells, publishedIndex));
      const externalGradeId = `grade:${moduleExternalId}:${slugify(gradeLabel)}:${examDate ?? publishedAt ?? stableHash([title, gradeLabel])}`;

      grades.set(externalGradeId, {
        externalGradeId,
        moduleExternalId,
        gradeValue: parseGradeValue(gradeLabel),
        gradeLabel,
        examDate,
        publishedAt,
        sourceUpdatedAt: inferSourceUpdatedAt(),
      });
    }
  }

  return Array.from(grades.values());
}

function extractExamsFromTables(tables: ExtractedTable[]): CampusConnectorExamInput[] {
  const exams = new Map<string, CampusConnectorExamInput>();

  for (const table of tables) {
    const titleIndex = findColumnIndex(table.headers, ['prüfung', 'klausur', 'termin', 'veranstaltung', 'modul', 'titel']);
    const dateIndex = findColumnIndex(table.headers, ['datum', 'termin']);
    const timeIndex = findColumnIndex(table.headers, ['uhrzeit', 'zeit']);
    const locationIndex = findColumnIndex(table.headers, ['raum', 'ort', 'hörsaal']);
    const codeIndex = findColumnIndex(table.headers, ['nummer', 'nr.', 'modulnr', 'modulcode', 'code']);
    const gradeIndex = findColumnIndex(table.headers, ['note', 'bewertung', 'ergebnis']);

    const hasExamHeader = table.headers.some((header) => ['prüfung', 'klausur', 'termin'].some((matcher) => header.includes(matcher)));
    const looksLikeExamTable =
      titleIndex >= 0 &&
      dateIndex >= 0 &&
      gradeIndex < 0 &&
      (hasExamHeader || timeIndex >= 0 || locationIndex >= 0);
    if (!looksLikeExamTable) continue;

    for (const row of table.rows) {
      const titleCell = pickCell(row.cells, titleIndex);
      const dateCell = pickCell(row.cells, dateIndex);
      if (!titleCell || !dateCell) continue;

      const parsed = extractModuleCodeAndTitle(titleCell || pickCell(row.cells, codeIndex));
      const moduleCode = parsed.moduleCode ?? (pickCell(row.cells, codeIndex).match(/\d{5,}/)?.[0] ?? null);
      const title = parsed.title ?? titleCell;
      const startsAt = createIsoDateTime(dateCell, pickCell(row.cells, timeIndex));
      if (!startsAt) continue;

      const semesterLabel = parseSemesterLabel(titleCell);
      const moduleExternalId = moduleCode || title ? buildModuleExternalId(moduleCode, title, semesterLabel) : null;
      const location = pickCell(row.cells, locationIndex) || null;
      const externalId = `exam:${moduleExternalId ?? slugify(title)}:${startsAt}`;

      exams.set(externalId, {
        externalId,
        moduleExternalId,
        title,
        description: null,
        location,
        startsAt,
        endsAt: null,
        allDay: !parseGermanTime(pickCell(row.cells, timeIndex)),
        sourceUpdatedAt: inferSourceUpdatedAt(),
      });
    }
  }

  return Array.from(exams.values());
}

function deriveModulesFromGrades(grades: CampusConnectorGradeInput[]) {
  return grades.map((grade) => ({
    externalId: grade.moduleExternalId,
    moduleCode: grade.moduleExternalId.replace(/^module:/, '').match(/^\d{5,}$/)?.[0] ?? null,
    title: grade.moduleExternalId.replace(/^module:/, '').replace(/^[a-z]+:/, '').replace(/[-:]+/g, ' ').trim() || grade.moduleExternalId,
    status: 'active' as const,
    semesterLabel: null,
    credits: null,
    sourceUpdatedAt: grade.sourceUpdatedAt ?? null,
  }));
}

function deriveModulesFromExams(exams: CampusConnectorExamInput[]) {
  return exams
    .filter((exam) => exam.moduleExternalId)
    .map((exam) => ({
      externalId: exam.moduleExternalId!,
      moduleCode: exam.moduleExternalId?.replace(/^module:/, '').match(/^\d{5,}$/)?.[0] ?? null,
      title: exam.title,
      status: 'active' as const,
      semesterLabel: null,
      credits: null,
      sourceUpdatedAt: exam.sourceUpdatedAt ?? null,
    }));
}

function dedupeModules(modules: CampusConnectorModuleInput[]) {
  const map = new Map<string, CampusConnectorModuleInput>();
  for (const moduleRow of modules) {
    const current = map.get(moduleRow.externalId);
    if (!current) {
      map.set(moduleRow.externalId, moduleRow);
      continue;
    }

    map.set(moduleRow.externalId, {
      externalId: moduleRow.externalId,
      moduleCode: current.moduleCode ?? moduleRow.moduleCode ?? null,
      title:
        current.title && !current.title.startsWith('module:')
          ? current.title
          : moduleRow.title,
      status: current.status !== 'active' ? current.status : moduleRow.status,
      semesterLabel: current.semesterLabel ?? moduleRow.semesterLabel ?? null,
      credits: current.credits ?? moduleRow.credits ?? null,
      sourceUpdatedAt: current.sourceUpdatedAt ?? moduleRow.sourceUpdatedAt ?? null,
    });
  }
  return Array.from(map.values());
}

export function buildCampusAcademicExport(doc: Document, sourceUrl: string) {
  const tables = extractTables(doc);
  const modules = extractModulesFromTables(tables);
  const grades = extractGradesFromTables(tables);
  const exams = extractExamsFromTables(tables);

  return {
    exportType: KIT_CAMPUS_ACADEMIC_EXPORT_TYPE,
    exportVersion: KIT_CAMPUS_ACADEMIC_EXPORT_VERSION,
    generatedAt: new Date().toISOString(),
    sourceUrl,
    modules: dedupeModules([...modules, ...deriveModulesFromGrades(grades), ...deriveModulesFromExams(exams)]),
    grades,
    exams,
  };
}

export function parseCampusAcademicExport(rawValue: string) {
  const parsed = JSON.parse(rawValue) as unknown;
  return campusAcademicExportSchema.parse(parsed);
}

export type CampusAcademicExport = z.infer<typeof campusAcademicExportSchema>;
