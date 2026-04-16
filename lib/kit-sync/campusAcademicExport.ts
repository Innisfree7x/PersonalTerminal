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

function normalizeAcademicDashes(value: string) {
  return value.replace(/[‐‑‒–—−]/g, '–');
}

function decodeBasicHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
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

function isStandaloneGradeCell(value: string) {
  return /^(?:[1-4](?:[.,]\d)?|5(?:[.,]0)?)$/.test(normalizeText(value));
}

function isRecognizedGradeCell(value: string) {
  const text = normalizeText(value);
  return (
    isStandaloneGradeCell(text) ||
    /^(?:be|nb|an|mbe)$/i.test(text) ||
    /^\([1-5](?:[.,]\d)?\)$/.test(text) ||
    /^[1-5](?:[.,]\d)?\s*\d$/.test(text)
  );
}

function inferStatus(value: string): CampusConnectorModuleInput['status'] {
  const text = normalizeHeader(value);
  if (!text) return 'active';
  if (text === 'be' || text === 'mbe') return 'completed';
  if (text === 'an') return 'planned';
  if (text === 'nb') return 'unknown';
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
  const text = normalizeAcademicDashes(normalizeText(rawValue));
  if (!text) {
    return { moduleCode: null, title: null };
  }

  const trimAggregateTail = (value: string) => {
    const normalized = normalizeText(value);
    if (!normalized) return normalized;

    const aggregateTailMatchers = [
      /\s+[A-ZÄÖÜ][A-Za-zÄÖÜäöü0-9()/:,.'\- ]{2,120}?(?:Module wählen|Teilleistungen wählen)\b/,
      /\s+(?:Berufspraktikum|Bachelorarbeit|Orientierungsprüfung|Mathematik ab \d{2}\.\d{2}\.\d{4}|Statistik)\b/,
    ];

    let stripped = normalized;
    for (const matcher of aggregateTailMatchers) {
      const match = stripped.match(matcher);
      if (typeof match?.index === 'number' && match.index > 10) {
        stripped = stripped.slice(0, match.index).trim();
        break;
      }
    }

    return stripped
      .replace(/\s+(?:PF|WP|FW|PI)(?:\s+\d+(?:,\d+)?){0,2}\s*$/i, '')
      .trim();
  };

  const structuredCode = text.match(/^([A-Z0-9ÄÖÜ]+(?:-[A-Z0-9ÄÖÜ]+)*-\d{5,}|\d{5,})\s*[–-]\s*(.+)$/i);
  if (structuredCode?.[1] && structuredCode[2]) {
    const numericCode = structuredCode[1].match(/\d{5,}/)?.[0] ?? structuredCode[1];
    return { moduleCode: numericCode, title: trimAggregateTail(structuredCode[2]) };
  }

  const prefixed = text.match(/^(\d{5,})\s*[–-]\s*(.+)$/);
  if (prefixed?.[1] && prefixed[2]) {
    return { moduleCode: prefixed[1], title: trimAggregateTail(prefixed[2]) };
  }

  const codeOnly = text.match(/\b(\d{5,})\b/);
  if (codeOnly?.[1]) {
    const cleanedTitle = text
      .replace(/^[A-Z0-9ÄÖÜ]+(?:-[A-Z0-9ÄÖÜ]+)*-\d{5,}\s*[–-]\s*/i, '')
      .replace(codeOnly[1], '')
      .replace(/^[–-]\s*/, '')
      .trim();
    return {
      moduleCode: codeOnly[1],
      title: trimAggregateTail(cleanedTitle || text),
    };
  }

  return { moduleCode: null, title: trimAggregateTail(text) };
}

function looksLikeAggregateAcademicTitle(value: string | null | undefined) {
  const text = normalizeHeader(value ?? '');
  if (!text) return false;

  return (
    text.endsWith('module waehlen') ||
    text.endsWith('module wählen') ||
    text.endsWith('teilleistungen waehlen') ||
    text.endsWith('teilleistungen wählen')
  );
}

type TableRow = { cells: string[] };
type ExtractedTable = { headers: string[]; rows: TableRow[] };

function isLikelyHeaderRow(cells: string[]) {
  const normalized = cells.map((cell) => normalizeHeader(cell));
  if (normalized.length === 0) return false;

  const headerHints = ['titel', 'modul', 'note', 'datum', 'status', 'art', 'ects', 'lp', 'uhrzeit', 'hörsaal', 'raum', 'semester'];
  const matches = normalized.filter((cell) => headerHints.some((hint) => cell.includes(hint))).length;
  return matches >= 2;
}

function extractTableRows(table: Element) {
  return Array.from(table.querySelectorAll('tr'))
    .filter((row) => row.closest('table') === table)
    .map((row) => {
    const cells = Array.from(row.children)
      .filter((child): child is HTMLTableCellElement => child instanceof HTMLTableCellElement)
      .map((cell) => normalizeText(cell.textContent ?? ''));
    return { cells };
  }).filter((row) => row.cells.some(Boolean));
}

function extractTablesFromDocument(doc: Document): ExtractedTable[] {
  const tableRoots = [doc, ...collectOpenShadowRoots(doc)];
  const tables = tableRoots.flatMap((root) => {
    try {
      return Array.from(root.querySelectorAll('table'));
    } catch {
      return [];
    }
  });

  return tables.map((table) => {
    const rawRows = extractTableRows(table);
    if (rawRows.length === 0) {
      return { headers: [], rows: [] };
    }

    const theadHeaders = Array.from(table.querySelectorAll('thead th, thead td')).map((cell) =>
      normalizeHeader(cell.textContent ?? '')
    );

    const firstHeaderCandidate = rawRows.find((row) => isLikelyHeaderRow(row.cells));
    const fallbackHeaders = firstHeaderCandidate?.cells.map((cell) => normalizeHeader(cell)) ?? [];
    const headers = theadHeaders.some(Boolean) ? theadHeaders : fallbackHeaders;

    const rows = rawRows.filter((row) => {
      if (!row.cells.some(Boolean)) return false;
      if (headers.length > 0 && row.cells.length === headers.length) {
        const normalizedRow = row.cells.map((cell) => normalizeHeader(cell));
        const headerMatchCount = normalizedRow.filter((cell, index) => cell === headers[index]).length;
        if (headerMatchCount >= Math.max(2, Math.floor(headers.length / 2))) {
          return false;
        }
      }

      return true;
    });

    return { headers, rows };
  }).filter((table) => table.rows.length > 0);
}

function collectOpenShadowRoots(root: ParentNode) {
  const shadowRoots: ShadowRoot[] = [];
  const seen = new Set<ParentNode>();

  const visit = (currentRoot: ParentNode) => {
    if (seen.has(currentRoot)) {
      return;
    }

    seen.add(currentRoot);

    try {
      const elements = Array.from(currentRoot.querySelectorAll('*')) as Element[];
      for (const element of elements) {
        const shadowRoot = (element as HTMLElement & { shadowRoot?: ShadowRoot | null }).shadowRoot;
        if (shadowRoot && !seen.has(shadowRoot)) {
          shadowRoots.push(shadowRoot);
          visit(shadowRoot);
        }
      }
    } catch {
      // Ignore shadow traversal failures and keep parsing regular DOM.
    }
  };

  visit(root);
  return shadowRoots;
}

function collectDocuments(doc: Document, seen: Set<Document> = new Set()) {
  if (seen.has(doc)) {
    return [];
  }

  seen.add(doc);
  const documents = [doc];

  for (const frame of Array.from(doc.querySelectorAll('iframe, frame'))) {
    try {
      const frameDoc = (frame as HTMLIFrameElement).contentDocument;
      if (frameDoc) {
        documents.push(...collectDocuments(frameDoc, seen));
      }
    } catch {
      // Ignore cross-origin frames and keep parsing the current document.
    }
  }

  return documents;
}

function extractTables(doc: Document) {
  return collectDocuments(doc).flatMap((frameDoc) => extractTablesFromDocument(frameDoc));
}

function inferSourceUpdatedAt() {
  return new Date().toISOString();
}

function hasStatusSignal(value: string) {
  const text = normalizeHeader(value);
  return Boolean(
    text &&
      (text.includes('bestanden') ||
        text.includes('abgeschlossen') ||
        text.includes('active') ||
        text.includes('aktiv') ||
        text.includes('begonnen') ||
        text.includes('planned') ||
        text.includes('geplant') ||
        text.includes('dropped') ||
        text.includes('nicht bestanden') ||
        text.includes('unknown') ||
        text.includes('unbekannt'))
  );
}

function buildModuleExternalId(moduleCode: string | null, title: string, semesterLabel: string | null) {
  if (moduleCode) return `module:${moduleCode}`;
  return `module:${slugify(title)}:${slugify(semesterLabel ?? 'unknown')}:${stableHash([title, semesterLabel])}`;
}

function findFirstCell(cells: string[], startIndex: number, predicate: (value: string) => boolean) {
  for (let index = startIndex; index < cells.length; index += 1) {
    if (predicate(cells[index] ?? '')) {
      return cells[index] ?? '';
    }
  }
  return '';
}

function findFallbackTitleIndex(cells: string[]) {
  for (let index = 0; index < cells.length; index += 1) {
    const cell = normalizeText(cells[index]);
    if (!cell || blockedLabels.has(cell)) continue;

    const normalizedTitle = normalizeHeader(cell);
    if (
      normalizedTitle.includes('titel (mit kennung)') ||
      normalizedTitle.includes('persönlicher studienablaufplan') ||
      normalizedTitle.includes('teilleistungen') ||
      normalizedTitle.includes('orientierungsprüfung')
    ) {
      continue;
    }

    if (hasStatusSignal(cell) || isStandaloneGradeCell(cell) || Boolean(parseGermanDate(cell))) {
      continue;
    }

    const parsedTitle = extractModuleCodeAndTitle(cell);
    if (!parsedTitle.title || !looksLikeAcademicTitleCell(cell)) continue;

    const tail = cells.slice(index + 1);
    const hasStrongerTrailingTitle =
      !parsedTitle.moduleCode &&
      !/[–-]/.test(cell) &&
      tail.some((tailCell) => {
        const tailText = normalizeText(tailCell);
        if (!tailText) return false;
        const parsedTail = extractModuleCodeAndTitle(tailText);
        return Boolean(parsedTail.moduleCode || /[–-]/.test(tailText));
      });
    if (hasStrongerTrailingTitle) continue;
    const hasDate = tail.some((tailCell) => Boolean(parseGermanDate(tailCell)));
    const hasGrade = tail.some(isRecognizedGradeCell);
    const hasStatus = tail.some(hasStatusSignal);
    const creditValues = tail.map((tailCell) => parseCredits(tailCell)).filter((value): value is number => value !== null);
    const hasCredits = creditValues.length > 0;
    const looksLikeAggregate = !hasDate && !hasGrade && !hasStatus && creditValues.some((value) => value > 60);

    if (!looksLikeAggregate && (hasDate || hasGrade || hasStatus || hasCredits)) {
      return index;
    }
  }

  return cells.findIndex((cell) => Boolean(normalizeText(cell)));
}

function normalizeFallbackCells(cells: string[]) {
  const firstMeaningfulIndex = findFallbackTitleIndex(cells);
  if (firstMeaningfulIndex <= 0) return cells;
  return cells.slice(firstMeaningfulIndex);
}

function looksLikeAcademicTitleCell(value: string) {
  const text = normalizeText(value);
  if (!text) return false;
  const parsed = extractModuleCodeAndTitle(text);
  if (parsed.moduleCode) return true;
  if (/[–-]/.test(text)) return true;
  return /[A-Za-zÄÖÜäöü]/.test(text);
}

function isAcademicSnapshotFallbackRow(cells: string[]) {
  const normalizedCells = normalizeFallbackCells(cells);
  const titleCell = normalizeText(normalizedCells[0]);
  if (!titleCell) return false;
  if (blockedLabels.has(titleCell)) return false;
  if (/^(PF|WP|FW|PI)$/i.test(titleCell)) return false;

  const normalizedTitle = normalizeHeader(titleCell);
  if (
    normalizedTitle.includes('titel (mit kennung)') ||
    normalizedTitle.includes('persönlicher studienablaufplan') ||
    normalizedTitle.includes('teilleistungen') ||
    normalizedTitle.includes('orientierungsprüfung')
  ) {
    return false;
  }

  const parsedTitle = extractModuleCodeAndTitle(titleCell);
  if (parsedTitle.title && /^(PF|WP|FW|PI)$/i.test(parsedTitle.title)) return false;
  if (looksLikeAggregateAcademicTitle(parsedTitle.title)) return false;
  if (!parsedTitle.title || !looksLikeAcademicTitleCell(titleCell)) return false;

  const tail = normalizedCells.slice(1);
  const hasDate = tail.some((cell) => Boolean(parseGermanDate(cell)));
  const hasGrade = tail.some(isRecognizedGradeCell);
  const hasStatus = tail.some(hasStatusSignal);
  const creditValues = tail.map((cell) => parseCredits(cell)).filter((value): value is number => value !== null);
  const hasCredits = creditValues.length > 0;
  const looksLikeAggregate = !hasDate && !hasGrade && !hasStatus && creditValues.some((value) => value > 60);

  return !looksLikeAggregate && (hasDate || hasGrade || hasStatus || hasCredits);
}

function extractFallbackAcademicRows(tables: ExtractedTable[]) {
  const modules = new Map<string, CampusConnectorModuleInput>();
  const grades = new Map<string, CampusConnectorGradeInput>();

  for (const table of tables) {
    for (const row of table.rows) {
      if (!isAcademicSnapshotFallbackRow(row.cells)) continue;

      const normalizedCells = normalizeFallbackCells(row.cells);
      const titleCell = normalizeText(normalizedCells[0]);
      const parsedTitle = extractModuleCodeAndTitle(titleCell);
      const moduleCode = parsedTitle.moduleCode;
      const title = parsedTitle.title;
      if (!title) continue;

      const statusCell = normalizedCells[2] ?? findFirstCell(normalizedCells, 1, hasStatusSignal);
      const gradeCell = isRecognizedGradeCell(normalizedCells[3] ?? '')
        ? normalizedCells[3] ?? ''
        : findFirstCell(normalizedCells, 1, isRecognizedGradeCell);
      const dateCell = parseGermanDate(normalizedCells[4] ?? '') ? normalizedCells[4] ?? '' : findFirstCell(normalizedCells, 1, (cell) => Boolean(parseGermanDate(cell)));
      const creditCandidates = (normalizedCells.length >= 7 ? normalizedCells.slice(-2) : normalizedCells.slice(1))
        .map((cell) => parseCredits(cell))
        .filter((value): value is number => value !== null && value <= 60);
      const credits = creditCandidates.length > 0 ? creditCandidates[0] ?? null : null;
      const semesterLabel = parseSemesterLabel(titleCell);
      const externalId = buildModuleExternalId(moduleCode, title, semesterLabel);

      modules.set(externalId, {
        externalId,
        moduleCode,
        title,
        status: inferStatus(statusCell),
        semesterLabel,
        credits,
        sourceUpdatedAt: inferSourceUpdatedAt(),
      });

      if (gradeCell) {
        const examDateParts = parseGermanDate(dateCell);
        const examDate = examDateParts
          ? `${examDateParts.year}-${String(examDateParts.month).padStart(2, '0')}-${String(examDateParts.day).padStart(2, '0')}`
          : null;
        const externalGradeId = `grade:${externalId}:${slugify(gradeCell)}:${examDate ?? stableHash([title, gradeCell, dateCell])}`;

        grades.set(externalGradeId, {
          externalGradeId,
          moduleExternalId: externalId,
          gradeValue: parseGradeValue(gradeCell),
          gradeLabel: normalizeText(gradeCell),
          examDate,
          publishedAt: null,
          sourceUpdatedAt: inferSourceUpdatedAt(),
        });
      }
    }
  }

  return {
    modules: Array.from(modules.values()),
    grades: Array.from(grades.values()),
  };
}

function splitAcademicTextLine(line: string) {
  const structuredCells = line
    .split(/\t|\s{2,}/)
    .map((cell) => normalizeText(cell));
  if (structuredCells.length >= 6) {
    return structuredCells;
  }

  const compact = line.replace(/\u00a0/g, ' ').trim();
  if (!compact) {
    return [];
  }

  const pullTail = (pattern: RegExp) => {
    const match = compactParts.remaining.match(pattern);
    if (!match) return null;
    const value = normalizeText(match[1] ?? '');
    compactParts.remaining = compactParts.remaining.slice(0, match.index ?? compactParts.remaining.length).trimEnd();
    return value || null;
  };

  const compactParts = { remaining: compact };
  const sollLp = pullTail(/(?:^|\s)(\d+(?:,\d+)?)$/);
  const istLp = pullTail(/(?:^|\s)(\d+(?:,\d+)?)$/);
  const date = pullTail(/(?:^|\s)(\d{1,2}\.\d{1,2}\.\d{4})$/);
  const grade = pullTail(/(?:^|\s)(\([1-5](?:[.,]\d)?\)|[1-5](?:[.,]\d)?(?:\s*\d)?|be|nb|an|mbe)$/i);
  const art = pullTail(/(?:^|\s)(PF|WP|FW|PI)$/i);
  const title = normalizeText(compactParts.remaining);

  return [title, art ?? '', grade ?? '', grade ?? '', date ?? '', istLp ?? '', sollLp ?? ''];
}

function collectCodedAcademicSegments(rawText: string) {
  const relevant = sliceAcademicRelevantText(rawText);
  if (!relevant) return [];

  const compact = relevant
    .replace(/^.*?Titel\s*\(mit Kennung\)\s*(?:Art\s*Status\s*Note\s*Datum\s*Ist-LP\s*Soll-LP)?/i, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!compact) return [];

  const endIndex = compact.search(/Bitte beachten Sie:/i);
  const searchable = endIndex >= 0 ? compact.slice(0, endIndex).trim() : compact;
  const rowStartPattern = /(?:^|\s)((?:[A-ZÄÖÜ0-9]+(?:-[A-ZÄÖÜ0-9]+)*-\d{5,}|\d{5,})\s+[–-]\s+)/g;
  const starts: number[] = [];
  let match: RegExpExecArray | null;

  while ((match = rowStartPattern.exec(searchable))) {
    const prefix = match[1] ?? '';
    const startIndex = (match.index ?? 0) + match[0].length - prefix.length;
    starts.push(startIndex);
  }

  return starts.map((start, index) => searchable.slice(start, starts[index + 1] ?? searchable.length).trim()).filter(Boolean);
}

function sliceAcademicRelevantText(rawText: string) {
  const normalized = rawText.replace(/\r/g, '\n').replace(/\u00a0/g, ' ');

  const headerStart = normalized.search(/Titel\s*\(mit Kennung\)/i);
  const fallbackStart =
    headerStart >= 0
      ? headerStart
      : Math.max(
          normalized.search(/Persönlicher\s+Studienablaufplan/i),
          normalized.search(/Studiengangsdetails/i)
        );

  if (fallbackStart < 0) return '';

  const sliced = normalized.slice(fallbackStart);
  const endIndex = sliced.search(/Bitte beachten Sie:/i);
  return (endIndex >= 0 ? sliced.slice(0, endIndex) : sliced).trim();
}

function collectAcademicTextSegments(rawText: string) {
  const relevant = sliceAcademicRelevantText(rawText);
  if (!relevant) return [];

  const compact = relevant
    .replace(/^.*?Titel\s*\(mit Kennung\)\s*(?:Art\s*Status\s*Note\s*Datum\s*Ist-LP\s*Soll-LP)?/i, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!compact) return [];

  return compact
    .replace(/\s+(?=(?:[A-ZÄÖÜ]+(?:-[A-ZÄÖÜ0-9]+)*-\d{5,}\s+[–-]))/g, '\n')
    .replace(/\s+(?=(?:\d{2}-\d{3}-[A-Z]-\d{4}\s+[–-]))/g, '\n')
    .replace(
      /(\d+(?:,\d+)?\s+\d+(?:,\d+)?)(?=\s+(?:[A-ZÄÖÜ][A-Za-zÄÖÜäöü0-9()/:,.'\-]{2,120}?\s+(?:PF|WP|FW|PI)\b))/g,
      '$1\n'
    )
    .replace(
      /\s+(?=(?:[A-ZÄÖÜ][A-Za-zÄÖÜäöü0-9()/:,.'\- ]{2,120}?(?:Module wählen|Teilleistungen wählen|Berufspraktikum|Bachelorarbeit|Orientierungsprüfung|Mathematik ab \d{2}\.\d{2}\.\d{4}|Statistik)\b)\s+(?:PF|WP|FW|PI)\b)/g,
      '\n'
    )
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function collectAcademicTextLines(rawText: string) {
  const relevant = sliceAcademicRelevantText(rawText);
  const lineSplit = relevant
    .split('\n')
    .map((line) => line.replace(/\u00a0/g, ' ').trim())
    .filter(Boolean);
  const compactSegments = collectAcademicTextSegments(rawText);
  const codedSegments = collectCodedAcademicSegments(rawText);
  return Array.from(new Set([...lineSplit, ...compactSegments, ...codedSegments]));
}

function collectMergedAcademicLineCandidates(lines: string[], startIndex: number, maxWindow = 6) {
  const candidates: Array<{ text: string; consumed: number }> = [];
  let merged = '';

  for (let offset = 0; offset < maxWindow && startIndex + offset < lines.length; offset += 1) {
    const segment = normalizeText(lines[startIndex + offset] ?? '');
    if (!segment) continue;

    merged = merged ? `${merged} ${segment}` : segment;
    candidates.push({ text: merged, consumed: offset + 1 });
  }

  return candidates;
}

function extractHtmlTextFallback(value: string | null | undefined) {
  const html = value ?? '';
  if (!html) return '';

  return normalizeVisibleText(
    decodeBasicHtmlEntities(
      html
        .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<\/?(?:tr|thead|tbody|tfoot|table|div|section|article|header|footer|aside|main|ul|ol|li|p|br|hr|h[1-6]|td|th)\b[^>]*>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
    )
  );
}

function normalizeVisibleText(value: string | null | undefined) {
  return normalizeAcademicDashes(
    String(value ?? '')
      .replace(/\r/g, '\n')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

function extractShadowRootText(shadowRoot: ShadowRoot) {
  const candidates = [
    normalizeVisibleText(shadowRoot.textContent),
    normalizeVisibleText(shadowRoot.innerHTML),
    extractHtmlTextFallback(shadowRoot.innerHTML),
  ].filter(Boolean);

  return Array.from(new Set(candidates)).join('\n');
}

function extractDocumentText(doc: Document) {
  const shadowTexts = collectOpenShadowRoots(doc)
    .map((shadowRoot) => extractShadowRootText(shadowRoot))
    .filter(Boolean);

  const candidates = [
    normalizeVisibleText(doc.body?.innerText),
    normalizeVisibleText(doc.documentElement?.innerText),
    normalizeVisibleText(doc.body?.textContent),
    normalizeVisibleText(doc.documentElement?.textContent),
    normalizeAcademicDashes(normalizeText(doc.body?.textContent ?? '')),
    normalizeAcademicDashes(normalizeText(doc.documentElement?.textContent ?? '')),
    extractHtmlTextFallback(doc.body?.outerHTML),
    extractHtmlTextFallback(doc.documentElement?.outerHTML),
    ...shadowTexts,
  ]
    .filter(Boolean);

  return Array.from(new Set(candidates)).join('\n');
}

function extractFallbackAcademicRowsFromText(rawText: string) {
  const modules = new Map<string, CampusConnectorModuleInput>();
  const grades = new Map<string, CampusConnectorGradeInput>();
  const lines = collectAcademicTextLines(rawText);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line || normalizeHeader(line).includes('titel (mit kennung)')) {
      continue;
    }

    let consumed = 1;
    let cells: string[] = [];

    for (const candidate of collectMergedAcademicLineCandidates(lines, index)) {
      const candidateCells = splitAcademicTextLine(candidate.text);
      if (isAcademicSnapshotFallbackRow(candidateCells)) {
        cells = candidateCells;
        consumed = candidate.consumed;
        break;
      }
    }

    if (!isAcademicSnapshotFallbackRow(cells)) {
      continue;
    }

    const normalizedCells = normalizeFallbackCells(cells);
    const titleCell = normalizeText(normalizedCells[0]);
    const parsedTitle = extractModuleCodeAndTitle(titleCell);
    const moduleCode = parsedTitle.moduleCode;
    const title = parsedTitle.title;
    if (looksLikeAggregateAcademicTitle(title)) continue;
    if (!title) continue;

    const statusCell = normalizedCells[2] ?? findFirstCell(normalizedCells, 1, hasStatusSignal);
    const gradeCell = isRecognizedGradeCell(normalizedCells[3] ?? '')
      ? normalizedCells[3] ?? ''
      : findFirstCell(normalizedCells, 1, isRecognizedGradeCell);
    const dateCell = parseGermanDate(normalizedCells[4] ?? '')
      ? normalizedCells[4] ?? ''
      : findFirstCell(normalizedCells, 1, (cell) => Boolean(parseGermanDate(cell)));
    const creditCandidates = (normalizedCells.length >= 7 ? normalizedCells.slice(-2) : normalizedCells.slice(1))
      .map((cell) => parseCredits(cell))
      .filter((value): value is number => value !== null && value <= 60);
    const credits = creditCandidates.length > 0 ? creditCandidates[0] : null;
    const semesterLabel = parseSemesterLabel(titleCell);
    const externalId = buildModuleExternalId(moduleCode, title, semesterLabel);

    modules.set(externalId, {
      externalId,
      moduleCode,
      title,
      status: inferStatus(statusCell),
      semesterLabel,
      credits,
      sourceUpdatedAt: new Date().toISOString(),
    });

    if (gradeCell) {
      const examDateParts = parseGermanDate(dateCell);
      const examDate = examDateParts
        ? `${examDateParts.year}-${String(examDateParts.month).padStart(2, '0')}-${String(examDateParts.day).padStart(2, '0')}`
        : null;
      const externalGradeId = `grade:${externalId}:${slugify(gradeCell)}:${examDate ?? stableHash([title, gradeCell, dateCell])}`;

      grades.set(externalGradeId, {
        externalGradeId,
        moduleExternalId: externalId,
        gradeValue: parseGradeValue(gradeCell),
        gradeLabel: normalizeText(gradeCell),
        examDate,
        publishedAt: null,
        sourceUpdatedAt: new Date().toISOString(),
      });
    }

    index += consumed - 1;
  }

  return {
    modules: Array.from(modules.values()),
    grades: Array.from(grades.values()),
  };
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

function dedupeByKey<T>(items: T[], getKey: (item: T) => string) {
  const map = new Map<string, T>();
  for (const item of items) {
    const key = getKey(item);
    if (key) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

export function buildCampusAcademicExport(doc: Document, sourceUrl: string) {
  const tables = extractTables(doc);
  const modules = extractModulesFromTables(tables);
  const grades = extractGradesFromTables(tables);
  const exams = extractExamsFromTables(tables);
  const fallback =
    modules.length === 0 && grades.length === 0 ? extractFallbackAcademicRows(tables) : { modules: [], grades: [] };
  const documentTexts = collectDocuments(doc)
    .map((frameDoc) => extractDocumentText(frameDoc))
    .filter(Boolean)
    .join('\n');
  const textFallback =
    modules.length === 0 && grades.length === 0 && fallback.modules.length === 0 && fallback.grades.length === 0
      ? extractFallbackAcademicRowsFromText(documentTexts)
      : { modules: [], grades: [] };

  return {
    exportType: KIT_CAMPUS_ACADEMIC_EXPORT_TYPE,
    exportVersion: KIT_CAMPUS_ACADEMIC_EXPORT_VERSION,
    generatedAt: new Date().toISOString(),
    sourceUrl,
    modules: dedupeModules([
      ...modules,
      ...fallback.modules,
      ...textFallback.modules,
      ...deriveModulesFromGrades([...grades, ...fallback.grades, ...textFallback.grades]),
      ...deriveModulesFromExams(exams),
    ]),
    grades: dedupeByKey([...grades, ...fallback.grades, ...textFallback.grades], (grade) => grade.externalGradeId),
    exams: dedupeByKey(exams, (exam) => exam.externalId),
  };
}

export function parseCampusAcademicExport(rawValue: string) {
  const parsed = JSON.parse(rawValue) as unknown;
  return campusAcademicExportSchema.parse(parsed);
}

export type CampusAcademicExport = z.infer<typeof campusAcademicExportSchema>;
