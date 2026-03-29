(function () {
  const EXPORT_TYPE = 'innis_kit_campus_academic_export';
  const EXPORT_VERSION = 1;
  const STORAGE_KEY = 'innis:kit-campus-academic-export:v1';
  const BLOCKED_LABELS = new Set([
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

  // Browser-Connector und App-Parser laufen absichtlich mit spiegelnder Logik.
  // Änderungen an CAMPUS-Tabellen müssen deshalb hier und in
  // lib/kit-sync/campusAcademicExport.ts synchron gepflegt werden.

  function normalizeText(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  function slugify(value) {
    return normalizeText(value)
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function stableHash(parts) {
    return btoa(parts.map((part) => part || '').join('|')).replace(/[^a-z0-9]/gi, '').slice(0, 16);
  }

  function normalizeHeader(value) {
    return normalizeText(value).toLowerCase();
  }

  function findColumnIndex(headers, matchers) {
    return headers.findIndex((header) => matchers.some((matcher) => header.includes(matcher)));
  }

  function pickCell(cells, index) {
    return index >= 0 ? normalizeText(cells[index]) : '';
  }

  function parseCredits(value) {
    const match = normalizeText(value).replace(',', '.').match(/\d+(?:\.\d+)?/);
    return match ? Number.parseFloat(match[0]) : null;
  }

  function parseGradeValue(value) {
    const match = normalizeText(value).replace(',', '.').match(/[1-5](?:\.\d)?/);
    return match ? Number.parseFloat(match[0]) : null;
  }

  function inferStatus(value) {
    const text = normalizeHeader(value);
    if (!text) return 'active';
    if (text.includes('bestanden') || text.includes('abgeschlossen') || text.includes('completed')) return 'completed';
    if (text.includes('abgemeldet') || text.includes('withdrawn') || text.includes('dropped')) return 'dropped';
    if (text.includes('geplant') || text.includes('planned')) return 'planned';
    if (text.includes('unbekannt') || text.includes('unknown')) return 'unknown';
    return 'active';
  }

  function parseGermanDate(value) {
    const match = normalizeText(value).match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (!match) return null;
    return {
      day: Number.parseInt(match[1], 10),
      month: Number.parseInt(match[2], 10),
      year: Number.parseInt(match[3], 10),
    };
  }

  function parseGermanTime(value) {
    const match = normalizeText(value).match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return {
      hour: Number.parseInt(match[1], 10),
      minute: Number.parseInt(match[2], 10),
    };
  }

  function createIsoDateTime(dateText, timeText) {
    const date = parseGermanDate(dateText);
    if (!date) return null;
    const time = parseGermanTime(timeText || '');
    const instance = new Date(date.year, date.month - 1, date.day, time ? time.hour : 0, time ? time.minute : 0, 0, 0);
    return Number.isNaN(instance.getTime()) ? null : instance.toISOString();
  }

  function parseSemesterLabel(value) {
    const text = normalizeText(value);
    const match = text.match(/\b(?:WS|SS)\s*\d{4}\b/i);
    return match ? match[0].replace(/\s+/, ' ').toUpperCase() : null;
  }

  function extractModuleCodeAndTitle(rawValue) {
    const text = normalizeText(rawValue);
    if (!text) return { moduleCode: null, title: null };
    const prefixed = text.match(/^(\d{5,})\s*[–-]\s*(.+)$/);
    if (prefixed) return { moduleCode: prefixed[1], title: prefixed[2].trim() };
    const codeOnly = text.match(/\b(\d{5,})\b/);
    if (codeOnly) {
      const cleanedTitle = text.replace(codeOnly[1], '').replace(/^[–-]\s*/, '').trim();
      return { moduleCode: codeOnly[1], title: cleanedTitle || text };
    }
    return { moduleCode: null, title: text };
  }

  function extractTables(doc) {
    return Array.from(doc.querySelectorAll('table')).map((table) => {
      const headerCells = Array.from(table.querySelectorAll('thead th'));
      const fallbackHeaderRow = headerCells.length === 0 ? Array.from(table.querySelectorAll('tr')).find((row) => row.querySelector('th')) : null;
      const headerSource = headerCells.length > 0 ? headerCells : Array.from(fallbackHeaderRow ? fallbackHeaderRow.querySelectorAll('th') : []);
      const headers = headerSource.map((cell) => normalizeHeader(cell.textContent));
      const rows = Array.from(table.querySelectorAll('tr'))
        .filter((row) => row.querySelectorAll('td').length > 0)
        .map((row) => ({ cells: Array.from(row.querySelectorAll('td')).map((cell) => normalizeText(cell.textContent)) }))
        .filter((row) => row.cells.some(Boolean));
      return { headers: headers, rows: rows };
    }).filter((table) => table.headers.length > 0 && table.rows.length > 0);
  }

  function buildModuleExternalId(moduleCode, title, semesterLabel) {
    if (moduleCode) return 'module:' + moduleCode;
    return 'module:' + slugify(title) + ':' + slugify(semesterLabel || 'unknown') + ':' + stableHash([title, semesterLabel]);
  }

  function extractModulesFromTables(tables) {
    const results = new Map();
    tables.forEach((table) => {
      const titleIndex = findColumnIndex(table.headers, ['modul', 'titel', 'veranstaltung', 'bezeichnung', 'name']);
      const creditsIndex = findColumnIndex(table.headers, ['ects', 'lp', 'credit']);
      const semesterIndex = findColumnIndex(table.headers, ['semester', 'term']);
      const statusIndex = findColumnIndex(table.headers, ['status']);
      const codeIndex = findColumnIndex(table.headers, ['nummer', 'nr.', 'modulnr', 'modulcode', 'code']);
      if (titleIndex < 0 || (creditsIndex < 0 && semesterIndex < 0 && statusIndex < 0 && codeIndex < 0)) return;

      table.rows.forEach((row) => {
        const codeCell = pickCell(row.cells, codeIndex);
        const titleCell = pickCell(row.cells, titleIndex);
        const parsed = extractModuleCodeAndTitle(titleCell || codeCell);
        const moduleCode = parsed.moduleCode || ((codeCell.match(/\d{5,}/) || [])[0] || null);
        const title = parsed.title;
        if (!title || BLOCKED_LABELS.has(title)) return;
        const semesterLabel = parseSemesterLabel(pickCell(row.cells, semesterIndex));
        const externalId = buildModuleExternalId(moduleCode, title, semesterLabel);
        results.set(externalId, {
          externalId,
          moduleCode,
          title,
          status: inferStatus(pickCell(row.cells, statusIndex)),
          semesterLabel,
          credits: parseCredits(pickCell(row.cells, creditsIndex)),
          sourceUpdatedAt: new Date().toISOString(),
        });
      });
    });
    return Array.from(results.values());
  }

  function extractGradesFromTables(tables) {
    const grades = new Map();
    tables.forEach((table) => {
      const titleIndex = findColumnIndex(table.headers, ['modul', 'titel', 'veranstaltung', 'bezeichnung', 'name']);
      const gradeIndex = findColumnIndex(table.headers, ['note', 'bewertung', 'ergebnis']);
      const examDateIndex = findColumnIndex(table.headers, ['prüfungsdatum', 'datum', 'termin']);
      const publishedIndex = findColumnIndex(table.headers, ['bekannt', 'veröffentlicht', 'published']);
      const codeIndex = findColumnIndex(table.headers, ['nummer', 'nr.', 'modulnr', 'modulcode', 'code']);
      if (titleIndex < 0 || gradeIndex < 0) return;

      table.rows.forEach((row) => {
        const titleCell = pickCell(row.cells, titleIndex);
        const codeCell = pickCell(row.cells, codeIndex);
        const gradeLabel = pickCell(row.cells, gradeIndex);
        if (!gradeLabel || BLOCKED_LABELS.has(titleCell)) return;
        const parsed = extractModuleCodeAndTitle(titleCell || codeCell);
        const moduleCode = parsed.moduleCode || ((codeCell.match(/\d{5,}/) || [])[0] || null);
        const title = parsed.title || titleCell;
        if (!title) return;
        const moduleExternalId = buildModuleExternalId(moduleCode, title, parseSemesterLabel(titleCell));
        const examDateParts = parseGermanDate(pickCell(row.cells, examDateIndex));
        const examDate = examDateParts
          ? examDateParts.year + '-' + String(examDateParts.month).padStart(2, '0') + '-' + String(examDateParts.day).padStart(2, '0')
          : null;
        const publishedAt = createIsoDateTime(pickCell(row.cells, publishedIndex));
        const externalGradeId = 'grade:' + moduleExternalId + ':' + slugify(gradeLabel) + ':' + (examDate || publishedAt || stableHash([title, gradeLabel]));
        grades.set(externalGradeId, {
          externalGradeId,
          moduleExternalId,
          gradeValue: parseGradeValue(gradeLabel),
          gradeLabel,
          examDate,
          publishedAt,
          sourceUpdatedAt: new Date().toISOString(),
        });
      });
    });
    return Array.from(grades.values());
  }

  function extractExamsFromTables(tables) {
    const exams = new Map();
    tables.forEach((table) => {
      const titleIndex = findColumnIndex(table.headers, ['prüfung', 'klausur', 'termin', 'veranstaltung', 'modul', 'titel']);
      const dateIndex = findColumnIndex(table.headers, ['datum', 'termin']);
      const timeIndex = findColumnIndex(table.headers, ['uhrzeit', 'zeit']);
      const locationIndex = findColumnIndex(table.headers, ['raum', 'ort', 'hörsaal']);
      const codeIndex = findColumnIndex(table.headers, ['nummer', 'nr.', 'modulnr', 'modulcode', 'code']);
      const gradeIndex = findColumnIndex(table.headers, ['note', 'bewertung', 'ergebnis']);
      const hasExamHeader = table.headers.some((header) => ['prüfung', 'klausur', 'termin'].some((matcher) => header.includes(matcher)));
      if (titleIndex < 0 || dateIndex < 0 || gradeIndex >= 0 || (!hasExamHeader && timeIndex < 0 && locationIndex < 0)) return;

      table.rows.forEach((row) => {
        const titleCell = pickCell(row.cells, titleIndex);
        const dateCell = pickCell(row.cells, dateIndex);
        if (!titleCell || !dateCell) return;
        const parsed = extractModuleCodeAndTitle(titleCell || pickCell(row.cells, codeIndex));
        const moduleCode = parsed.moduleCode || ((pickCell(row.cells, codeIndex).match(/\d{5,}/) || [])[0] || null);
        const title = parsed.title || titleCell;
        const startsAt = createIsoDateTime(dateCell, pickCell(row.cells, timeIndex));
        if (!startsAt) return;
        const moduleExternalId = moduleCode || title ? buildModuleExternalId(moduleCode, title, parseSemesterLabel(titleCell)) : null;
        const location = pickCell(row.cells, locationIndex) || null;
        const externalId = 'exam:' + (moduleExternalId || slugify(title)) + ':' + startsAt;
        exams.set(externalId, {
          externalId,
          moduleExternalId,
          title,
          description: null,
          location,
          startsAt,
          endsAt: null,
          allDay: !parseGermanTime(pickCell(row.cells, timeIndex)),
          sourceUpdatedAt: new Date().toISOString(),
        });
      });
    });
    return Array.from(exams.values());
  }

  function deriveModulesFromGrades(grades) {
    return grades.map((grade) => ({
      externalId: grade.moduleExternalId,
      moduleCode: ((grade.moduleExternalId || '').replace(/^module:/, '').match(/^\d{5,}$/) || [])[0] || null,
      title: grade.moduleExternalId,
      status: 'active',
      semesterLabel: null,
      credits: null,
      sourceUpdatedAt: grade.sourceUpdatedAt || null,
    }));
  }

  function deriveModulesFromExams(exams) {
    return exams.filter((exam) => exam.moduleExternalId).map((exam) => ({
      externalId: exam.moduleExternalId,
      moduleCode: ((exam.moduleExternalId || '').replace(/^module:/, '').match(/^\d{5,}$/) || [])[0] || null,
      title: exam.title,
      status: 'active',
      semesterLabel: null,
      credits: null,
      sourceUpdatedAt: exam.sourceUpdatedAt || null,
    }));
  }

  function dedupeByExternalId(items) {
    const map = new Map();
    items.forEach((item) => {
      const current = map.get(item.externalId);
      if (!current) {
        map.set(item.externalId, item);
        return;
      }

      map.set(item.externalId, {
        externalId: item.externalId,
        moduleCode: current.moduleCode || item.moduleCode || null,
        title: current.title && !String(current.title).startsWith('module:') ? current.title : item.title,
        status: current.status !== 'active' ? current.status : item.status,
        semesterLabel: current.semesterLabel || item.semesterLabel || null,
        credits: current.credits ?? item.credits ?? null,
        sourceUpdatedAt: current.sourceUpdatedAt || item.sourceUpdatedAt || null,
      });
    });
    return Array.from(map.values());
  }

  function loadSnapshot() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { exportType: EXPORT_TYPE, exportVersion: EXPORT_VERSION, generatedAt: new Date().toISOString(), sourceUrl: window.location.href, modules: [], grades: [], exams: [] };
      const parsed = JSON.parse(raw);
      if (parsed && parsed.exportType === EXPORT_TYPE && parsed.exportVersion === EXPORT_VERSION) {
        return parsed;
      }
    } catch {}
    return { exportType: EXPORT_TYPE, exportVersion: EXPORT_VERSION, generatedAt: new Date().toISOString(), sourceUrl: window.location.href, modules: [], grades: [], exams: [] };
  }

  function saveSnapshot(snapshot) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }

  const tables = extractTables(document);
  const modules = extractModulesFromTables(tables);
  const grades = extractGradesFromTables(tables);
  const exams = extractExamsFromTables(tables);

  if (modules.length === 0 && grades.length === 0 && exams.length === 0) {
    alert('INNIS CAMPUS Export: Auf dieser Seite wurden keine Module, Noten oder Prüfungen erkannt. Öffne Studienaufbau, Notenspiegel oder Prüfungen und führe das Skript dort aus.');
    return;
  }

  const snapshot = loadSnapshot();
  snapshot.generatedAt = new Date().toISOString();
  snapshot.sourceUrl = window.location.href;
  snapshot.modules = dedupeByExternalId([].concat(snapshot.modules || [], modules, deriveModulesFromGrades(grades), deriveModulesFromExams(exams)));
  snapshot.grades = dedupeByExternalId([].concat(snapshot.grades || [], grades));
  snapshot.exams = dedupeByExternalId([].concat(snapshot.exams || [], exams));
  saveSnapshot(snapshot);

  const serialized = JSON.stringify(snapshot, null, 2);
  const filename = 'innis-kit-campus-academic-export-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.json';
  const blob = new Blob([serialized], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  const message = 'INNIS CAMPUS Export aktualisiert: ' + snapshot.modules.length + ' Module, ' + snapshot.grades.length + ' Noten, ' + snapshot.exams.length + ' Prüfungen.';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(serialized).then(
      function () { alert(message + ' JSON wurde kopiert und als Datei gespeichert.'); },
      function () { alert(message + ' JSON wurde als Datei gespeichert.'); }
    );
  } else {
    alert(message + ' JSON wurde als Datei gespeichert.');
  }
})();
