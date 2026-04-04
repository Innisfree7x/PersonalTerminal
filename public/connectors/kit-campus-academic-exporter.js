(async function () {
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

  function normalizeAcademicDashes(value) {
    return value.replace(/[‐‑‒–—−]/g, '–');
  }

  function decodeBasicHtmlEntities(value) {
    return value
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>');
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
    var str = parts.map(function (part) { return part || ''; }).join('|');
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = (Math.imul(hash, 31) + str.charCodeAt(i)) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
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

  function isStandaloneGradeCell(value) {
    return /^(?:[1-4](?:[.,]\d)?|5(?:[.,]0)?)$/.test(normalizeText(value));
  }

  function isRecognizedGradeCell(value) {
    const text = normalizeText(value);
    return (
      isStandaloneGradeCell(text) ||
      /^(?:be|nb|an|mbe)$/i.test(text) ||
      /^\([1-5](?:[.,]\d)?\)$/.test(text) ||
      /^[1-5](?:[.,]\d)?\s*\d$/.test(text)
    );
  }

  function inferStatus(value) {
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
    const text = normalizeAcademicDashes(normalizeText(rawValue));
    if (!text) return { moduleCode: null, title: null };

    function trimAggregateTail(value) {
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
    }

    const structuredCode = text.match(/^([A-Z0-9ÄÖÜ]+(?:-[A-Z0-9ÄÖÜ]+)*-\d{5,}|\d{5,})\s*[–-]\s*(.+)$/i);
    if (structuredCode) {
      const numericCodeMatch = structuredCode[1].match(/\d{5,}/);
      return { moduleCode: numericCodeMatch ? numericCodeMatch[0] : structuredCode[1], title: trimAggregateTail(structuredCode[2]) };
    }
    const prefixed = text.match(/^(\d{5,})\s*[–-]\s*(.+)$/);
    if (prefixed) return { moduleCode: prefixed[1], title: trimAggregateTail(prefixed[2]) };
    const codeOnly = text.match(/\b(\d{5,})\b/);
    if (codeOnly) {
      const cleanedTitle = text
        .replace(/^[A-Z0-9ÄÖÜ]+(?:-[A-Z0-9ÄÖÜ]+)*-\d{5,}\s*[–-]\s*/i, '')
        .replace(codeOnly[1], '')
        .replace(/^[–-]\s*/, '')
        .trim();
      return { moduleCode: codeOnly[1], title: trimAggregateTail(cleanedTitle || text) };
    }
    return { moduleCode: null, title: trimAggregateTail(text) };
  }

  function looksLikeAggregateAcademicTitle(value) {
    const text = normalizeHeader(value);
    if (!text) return false;

    return (
      text.endsWith('module waehlen') ||
      text.endsWith('module wählen') ||
      text.endsWith('teilleistungen waehlen') ||
      text.endsWith('teilleistungen wählen')
    );
  }

  function isLikelyHeaderRow(cells) {
    const normalized = cells.map((cell) => normalizeHeader(cell));
    if (normalized.length === 0) return false;
    const headerHints = ['titel', 'modul', 'note', 'datum', 'status', 'art', 'ects', 'lp', 'uhrzeit', 'hörsaal', 'raum', 'semester'];
    const matches = normalized.filter((cell) => headerHints.some((hint) => cell.includes(hint))).length;
    return matches >= 2;
  }

  function extractTableRows(table) {
    return Array.from(table.querySelectorAll('tr'))
      .filter((row) => row.closest('table') === table)
      .map((row) => ({
        cells: Array.from(row.children)
          .filter((cell) => cell.tagName === 'TH' || cell.tagName === 'TD')
          .map((cell) => normalizeText(cell.textContent)),
      })).filter((row) => row.cells.some(Boolean));
  }

  function collectOpenShadowRoots(root) {
    const shadowRoots = [];
    const seen = new Set();

    function visit(currentRoot) {
      if (!currentRoot || seen.has(currentRoot)) return;
      seen.add(currentRoot);

      try {
        const elements = Array.from(currentRoot.querySelectorAll('*'));
        for (const element of elements) {
          const shadowRoot = element && element.shadowRoot;
          if (shadowRoot && !seen.has(shadowRoot)) {
            shadowRoots.push(shadowRoot);
            visit(shadowRoot);
          }
        }
      } catch {}
    }

    visit(root);
    return shadowRoots;
  }

  function extractTablesFromDocument(doc) {
    const tableRoots = [doc].concat(collectOpenShadowRoots(doc));
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

      const theadHeaders = Array.from(table.querySelectorAll('thead th, thead td'))
        .map((cell) => normalizeHeader(cell.textContent));
      const firstHeaderCandidate = rawRows.find((row) => isLikelyHeaderRow(row.cells));
      const fallbackHeaders = firstHeaderCandidate ? firstHeaderCandidate.cells.map((cell) => normalizeHeader(cell)) : [];
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

      return { headers: headers, rows: rows };
    }).filter((table) => table.rows.length > 0);
  }

  function safeLocationHref(win) {
    try {
      return win.location && win.location.href ? win.location.href : 'unknown';
    } catch {
      return 'unavailable';
    }
  }

  function safeDocumentHref(doc, fallbackHref) {
    try {
      if (doc && doc.location && doc.location.href) {
        return doc.location.href;
      }
    } catch {}

    return fallbackHref || 'unknown';
  }

  function collectDocumentEntries(rootWindow, seenWindows, seenDocuments, depth) {
    if (!rootWindow || seenWindows.has(rootWindow)) {
      return [];
    }

    seenWindows.add(rootWindow);
    const entries = [];

    try {
      const rootDocument = rootWindow.document;
      if (rootDocument && !seenDocuments.has(rootDocument)) {
        seenDocuments.add(rootDocument);
        entries.push({
          doc: rootDocument,
          href: safeLocationHref(rootWindow),
          depth: depth,
          frameCount: Number(rootWindow.frames && rootWindow.frames.length) || 0,
        });
      }
    } catch {}

    try {
      const rootDocument = rootWindow.document;
      const parentHref = safeLocationHref(rootWindow);
      const frameNodes = Array.from(rootDocument.querySelectorAll('iframe, frame'));

      for (const frameNode of frameNodes) {
        try {
          const childWindow = frameNode.contentWindow;
          if (childWindow) {
            entries.push.apply(entries, collectDocumentEntries(childWindow, seenWindows, seenDocuments, depth + 1));
            continue;
          }

          const childDocument = frameNode.contentDocument;
          if (childDocument && !seenDocuments.has(childDocument)) {
            seenDocuments.add(childDocument);
            const childHref = safeDocumentHref(childDocument, parentHref);
            entries.push({
              doc: childDocument,
              href: childHref,
              depth: depth + 1,
              frameCount: Number((childDocument.defaultView && childDocument.defaultView.frames && childDocument.defaultView.frames.length) || 0),
            });

            const nestedNodes = Array.from(childDocument.querySelectorAll('iframe, frame'));
            if (nestedNodes.length > 0) {
              const syntheticWindow = childDocument.defaultView;
              if (syntheticWindow) {
                entries.push.apply(entries, collectDocumentEntries(syntheticWindow, seenWindows, seenDocuments, depth + 1));
              }
            }
          }
        } catch {}
      }
    } catch {}

    try {
      const frameCount = Number(rootWindow.frames && rootWindow.frames.length) || 0;
      for (let index = 0; index < frameCount; index += 1) {
        const childWindow = rootWindow.frames[index];
        entries.push.apply(entries, collectDocumentEntries(childWindow, seenWindows, seenDocuments, depth + 1));
      }
    } catch {}

    return entries;
  }

  function collectDocuments(doc) {
    const rootWindow = doc.defaultView || window;
    return collectDocumentEntries(rootWindow, new Set(), new Set(), 0);
  }

  function normalizeSameOriginUrl(rawValue) {
    if (!rawValue) return null;

    try {
      const url = new URL(rawValue, window.location.href);
      if (url.origin !== window.location.origin) return null;
      url.hash = '';
      return url.toString();
    } catch {
      return null;
    }
  }

  function collectCampusCandidateUrls() {
    const candidates = new Set();

    function addCandidate(rawValue) {
      const normalized = normalizeSameOriginUrl(rawValue);
      if (!normalized) return;
      if (!/contractview\.asp|notenspiegel|leistung|pruefung|exam|registration/i.test(normalized)) return;
      candidates.add(normalized);
    }

    function addHashRouteCandidates(rawRoute) {
      const hashRoute = normalizeText((rawRoute || '').replace(/^#!/, '').replace(/^\/+/, ''));
      if (!hashRoute) return;

      const currentDir = window.location.origin + window.location.pathname.replace(/[^/]*$/, '/');
      const strippedCampusStudent = hashRoute.replace(/^campus\/student\//i, '');
      const strippedCampus = hashRoute.replace(/^campus\//i, '');
      const variants = [
        hashRoute,
        '/' + hashRoute,
        currentDir + hashRoute,
        strippedCampusStudent,
        '/' + strippedCampusStudent,
        currentDir + strippedCampusStudent,
        strippedCampus,
        '/' + strippedCampus,
        currentDir + strippedCampus,
      ];

      variants.forEach((variant) => {
        if (variant && /contractview\.asp|notenspiegel|leistung|pruefung|exam|registration/i.test(variant)) {
          addCandidate(variant);
        }
      });
    }

    try {
      const hashRoute = (window.location.hash || '').replace(/^#!/, '').trim();
      if (hashRoute) {
        addHashRouteCandidates(hashRoute);
      }
    } catch {}

    try {
      Array.from(document.querySelectorAll('iframe[src], frame[src]')).forEach((frameNode) => {
        addCandidate(frameNode.getAttribute('src'));
      });
    } catch {}

    try {
      const entries = performance.getEntriesByType('resource');
      entries.forEach((entry) => {
        if (entry && typeof entry.name === 'string') {
          addCandidate(entry.name);
        }
      });
    } catch {}

    return Array.from(candidates);
  }

  async function fetchCandidateDocuments(candidateUrls) {
    const entries = [];

    for (const candidateUrl of candidateUrls) {
      try {
        const response = await fetch(candidateUrl, {
          credentials: 'include',
          redirect: 'follow',
        });

        if (!response.ok) {
          continue;
        }

        const html = await response.text();
        if (!html) continue;

        const parsedDoc = new DOMParser().parseFromString(html, 'text/html');
        entries.push({
          doc: parsedDoc,
          href: candidateUrl,
          depth: 99,
          frameCount: 0,
          fetched: true,
        });
      } catch {}
    }

    return entries;
  }

  async function loadCandidateDocumentsViaIframes(candidateUrls) {
    const entries = [];

    if (!document || !document.body) {
      return entries;
    }

    for (const candidateUrl of candidateUrls) {
      try {
        const entry = await new Promise((resolve) => {
          const iframe = document.createElement('iframe');
          let finished = false;

          function finalize(value) {
            if (finished) return;
            finished = true;
            try {
              iframe.remove();
            } catch {}
            resolve(value || null);
          }

          const timeoutId = window.setTimeout(function () {
            finalize(null);
          }, 4000);

          function handleLoad() {
            try {
              const childWindow = iframe.contentWindow;
              const childDocument = iframe.contentDocument || (childWindow && childWindow.document) || null;

              if (!childDocument) {
                window.clearTimeout(timeoutId);
                finalize(null);
                return;
              }

              const text = extractDocumentText(childDocument);
              const tableCount = extractTablesFromDocument(childDocument).length;

              if (!text && tableCount === 0) {
                window.clearTimeout(timeoutId);
                finalize(null);
                return;
              }

              window.clearTimeout(timeoutId);
              finalize({
                doc: childDocument,
                href: candidateUrl,
                depth: 98,
                frameCount: Number((childWindow && childWindow.frames && childWindow.frames.length) || 0),
                fetched: true,
                viaIframe: true,
              });
            } catch {
              window.clearTimeout(timeoutId);
              finalize(null);
            }
          }

          iframe.style.display = 'none';
          iframe.setAttribute('aria-hidden', 'true');
          iframe.addEventListener('load', handleLoad, { once: true });
          iframe.addEventListener('error', function () {
            window.clearTimeout(timeoutId);
            finalize(null);
          }, { once: true });
          iframe.src = candidateUrl;
          document.body.appendChild(iframe);
        });

        if (entry) {
          entries.push(entry);
        }
      } catch {}
    }

    return entries;
  }

  function mergeDocumentEntries(baseEntries, extraEntries) {
    const merged = [];
    const seenKeys = new Set();

    function pushEntry(entry) {
      if (!entry || !entry.doc) return;
      const key = (entry.href || 'unknown') + '::' + normalizeText(entry.doc.title || '');
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      merged.push(entry);
    }

    baseEntries.forEach(pushEntry);
    extraEntries.forEach(pushEntry);
    return merged;
  }

  function extractTablesFromEntries(documentEntries) {
    return documentEntries.flatMap((entry) =>
      extractTablesFromDocument(entry.doc).map((table) => ({
        headers: table.headers,
        rows: table.rows,
        sourceHref: entry.href,
        sourceDepth: entry.depth,
      }))
    );
  }

  function extractTextFromEntries(documentEntries) {
    return documentEntries
      .map((entry) => extractDocumentText(entry.doc))
      .filter(Boolean)
      .join('\n');
  }

  function extractTables(doc) {
    return extractTablesFromEntries(collectDocuments(doc));
  }

  function buildModuleExternalId(moduleCode, title, semesterLabel) {
    if (moduleCode) return 'module:' + moduleCode;
    return 'module:' + slugify(title) + ':' + slugify(semesterLabel || 'unknown') + ':' + stableHash([title, semesterLabel]);
  }

  function hasStatusSignal(value) {
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

  function findFirstCell(cells, startIndex, predicate) {
    for (let index = startIndex; index < cells.length; index += 1) {
      if (predicate(cells[index] || '')) {
        return cells[index] || '';
      }
    }
    return '';
  }

  function findFallbackTitleIndex(cells) {
    for (let index = 0; index < cells.length; index += 1) {
      const cell = normalizeText(cells[index]);
      if (!cell || BLOCKED_LABELS.has(cell)) continue;

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
      const creditValues = tail.map((tailCell) => parseCredits(tailCell)).filter((value) => value !== null);
      const hasCredits = creditValues.length > 0;
      const looksLikeAggregate = !hasDate && !hasGrade && !hasStatus && creditValues.some((value) => value > 60);

      if (!looksLikeAggregate && (hasDate || hasGrade || hasStatus || hasCredits)) {
        return index;
      }
    }

    return cells.findIndex((cell) => Boolean(normalizeText(cell)));
  }

  function normalizeFallbackCells(cells) {
    const firstMeaningfulIndex = findFallbackTitleIndex(cells);
    if (firstMeaningfulIndex <= 0) return cells;
    return cells.slice(firstMeaningfulIndex);
  }

  function looksLikeAcademicTitleCell(value) {
    const text = normalizeText(value);
    if (!text) return false;
    const parsed = extractModuleCodeAndTitle(text);
    if (parsed.moduleCode) return true;
    if (/[–-]/.test(text)) return true;
    return /[A-Za-zÄÖÜäöü]/.test(text);
  }

  function isAcademicSnapshotFallbackRow(cells) {
    const normalizedCells = normalizeFallbackCells(cells);
    const titleCell = normalizeText(normalizedCells[0]);
    if (!titleCell) return false;
    if (BLOCKED_LABELS.has(titleCell)) return false;
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
    const creditValues = tail.map((cell) => parseCredits(cell)).filter((value) => value !== null);
    const hasCredits = creditValues.length > 0;
    const looksLikeAggregate = !hasDate && !hasGrade && !hasStatus && creditValues.some((value) => value > 60);

    return !looksLikeAggregate && (hasDate || hasGrade || hasStatus || hasCredits);
  }

  function extractFallbackAcademicRows(tables) {
    const modules = new Map();
    const grades = new Map();

    tables.forEach((table) => {
      table.rows.forEach((row) => {
        if (!isAcademicSnapshotFallbackRow(row.cells)) return;

        const normalizedCells = normalizeFallbackCells(row.cells);
        const titleCell = normalizeText(normalizedCells[0]);
        const parsedTitle = extractModuleCodeAndTitle(titleCell);
        const moduleCode = parsedTitle.moduleCode;
        const title = parsedTitle.title;
        if (!title) return;

        const statusCell = normalizedCells[2] || findFirstCell(normalizedCells, 1, hasStatusSignal);
        const gradeCell = isRecognizedGradeCell(normalizedCells[3] || '')
          ? normalizedCells[3] || ''
          : findFirstCell(normalizedCells, 1, isRecognizedGradeCell);
        const dateCell = parseGermanDate(normalizedCells[4] || '')
          ? normalizedCells[4] || ''
          : findFirstCell(normalizedCells, 1, (cell) => Boolean(parseGermanDate(cell)));
        const creditCandidates = (normalizedCells.length >= 7 ? normalizedCells.slice(-2) : normalizedCells.slice(1))
          .map((cell) => parseCredits(cell))
          .filter((value) => value !== null && value <= 60);
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
            ? examDateParts.year + '-' + String(examDateParts.month).padStart(2, '0') + '-' + String(examDateParts.day).padStart(2, '0')
            : null;
          const externalGradeId = 'grade:' + externalId + ':' + slugify(gradeCell) + ':' + (examDate || stableHash([title, gradeCell, dateCell]));

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
      });
    });

    return {
      modules: Array.from(modules.values()),
      grades: Array.from(grades.values()),
    };
  }

  function splitAcademicTextLine(line) {
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

    const compactParts = { remaining: compact };
    function pullTail(pattern) {
      const match = compactParts.remaining.match(pattern);
      if (!match) return null;
      const value = normalizeText(match[1] || '');
      compactParts.remaining = compactParts.remaining.slice(0, typeof match.index === 'number' ? match.index : compactParts.remaining.length).trimEnd();
      return value || null;
    }

    const sollLp = pullTail(/(?:^|\s)(\d+(?:,\d+)?)$/);
    const istLp = pullTail(/(?:^|\s)(\d+(?:,\d+)?)$/);
    const date = pullTail(/(?:^|\s)(\d{1,2}\.\d{1,2}\.\d{4})$/);
    const grade = pullTail(/(?:^|\s)(\([1-5](?:[.,]\d)?\)|[1-5](?:[.,]\d)?(?:\s*\d)?|be|nb|an|mbe)$/i);
    const art = pullTail(/(?:^|\s)(PF|WP|FW|PI)$/i);
    const title = normalizeText(compactParts.remaining);

    return [title, art || '', grade || '', grade || '', date || '', istLp || '', sollLp || ''];
  }

  function collectCodedAcademicSegments(rawText) {
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
    const starts = [];
    let match;

    while ((match = rowStartPattern.exec(searchable))) {
      const prefix = match[1] || '';
      const startIndex = (typeof match.index === 'number' ? match.index : 0) + match[0].length - prefix.length;
      starts.push(startIndex);
    }

    return starts.map((start, index) => searchable.slice(start, starts[index + 1] || searchable.length).trim()).filter(Boolean);
  }

  function sliceAcademicRelevantText(rawText) {
    const normalized = rawText.replace(/\r/g, '\n').replace(/\u00a0/g, ' ');

    const headerStart = normalized.search(/Titel\s*\(mit Kennung\)/i);
    const fallbackStart = headerStart >= 0
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

  function collectAcademicTextSegments(rawText) {
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

  function collectAcademicTextLines(rawText) {
    const relevant = sliceAcademicRelevantText(rawText);
    const lineSplit = relevant
      .split('\n')
      .map((line) => line.replace(/\u00a0/g, ' ').trim())
      .filter(Boolean);
    const compactSegments = collectAcademicTextSegments(rawText);
    const codedSegments = collectCodedAcademicSegments(rawText);
    return Array.from(new Set(lineSplit.concat(compactSegments, codedSegments)));
  }

  function extractHtmlTextFallback(value) {
    const html = value || '';
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

  function normalizeVisibleText(value) {
    return normalizeAcademicDashes(
      String(value || '')
        .replace(/\r/g, '\n')
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    );
  }

  function extractShadowRootText(shadowRoot) {
    const candidates = [
      normalizeVisibleText(shadowRoot.textContent),
      normalizeVisibleText(shadowRoot.innerHTML),
      extractHtmlTextFallback(shadowRoot.innerHTML),
    ].filter(Boolean);

    return Array.from(new Set(candidates)).join('\n');
  }

  function extractDocumentText(doc) {
    const shadowTexts = collectOpenShadowRoots(doc)
      .map((shadowRoot) => extractShadowRootText(shadowRoot))
      .filter(Boolean);

    const candidates = [
      normalizeVisibleText(doc.body && doc.body.innerText),
      normalizeVisibleText(doc.documentElement && doc.documentElement.innerText),
      normalizeVisibleText(doc.body && doc.body.textContent),
      normalizeVisibleText(doc.documentElement && doc.documentElement.textContent),
      normalizeAcademicDashes(normalizeText((doc.body && doc.body.textContent) || '')),
      normalizeAcademicDashes(normalizeText((doc.documentElement && doc.documentElement.textContent) || '')),
      extractHtmlTextFallback(doc.body && doc.body.outerHTML),
      extractHtmlTextFallback(doc.documentElement && doc.documentElement.outerHTML),
    ]
      .concat(shadowTexts)
      .filter(Boolean);

    return Array.from(new Set(candidates)).join('\n');
  }

  function extractFallbackAcademicRowsFromText(rawText) {
    const modules = new Map();
    const grades = new Map();
    const lines = collectAcademicTextLines(rawText);

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!line || normalizeHeader(line).includes('titel (mit kennung)')) {
        continue;
      }

      let consumed = 1;
      let cells = splitAcademicTextLine(line);

      if (!isAcademicSnapshotFallbackRow(cells) && index + 1 < lines.length) {
        const merged = line + ' ' + lines[index + 1];
        const mergedCells = splitAcademicTextLine(merged);
        if (isAcademicSnapshotFallbackRow(mergedCells)) {
          cells = mergedCells;
          consumed = 2;
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

      const statusCell = normalizedCells[2] || findFirstCell(normalizedCells, 1, hasStatusSignal);
      const gradeCell = isRecognizedGradeCell(normalizedCells[3] || '')
        ? normalizedCells[3] || ''
        : findFirstCell(normalizedCells, 1, isRecognizedGradeCell);
      const dateCell = parseGermanDate(normalizedCells[4] || '')
        ? normalizedCells[4] || ''
        : findFirstCell(normalizedCells, 1, function (cell) { return Boolean(parseGermanDate(cell)); });
      const creditCandidates = (normalizedCells.length >= 7 ? normalizedCells.slice(-2) : normalizedCells.slice(1))
        .map((cell) => parseCredits(cell))
        .filter((value) => value !== null && value <= 60);
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
          ? examDateParts.year + '-' + String(examDateParts.month).padStart(2, '0') + '-' + String(examDateParts.day).padStart(2, '0')
          : null;
        const externalGradeId = 'grade:' + externalId + ':' + slugify(gradeCell) + ':' + (examDate || stableHash([title, gradeCell, dateCell]));

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

  function dedupeByKey(items, key) {
    const map = new Map();
    items.forEach((item) => {
      const value = item && item[key];
      if (value) {
        map.set(value, item);
      }
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

  const initialDocumentEntries = collectDocuments(document);
  const initialTables = extractTablesFromEntries(initialDocumentEntries);
  const initialDocumentTexts = extractTextFromEntries(initialDocumentEntries);
  const candidateUrls = collectCampusCandidateUrls();
  const fetchedDocumentEntries =
    initialTables.length === 0 || initialDocumentTexts.length < 1200
      ? await fetchCandidateDocuments(candidateUrls)
      : [];

  const iframeDocumentEntries =
    initialTables.length === 0
      ? await loadCandidateDocumentsViaIframes(candidateUrls)
      : [];

  const documentEntries = mergeDocumentEntries(
    mergeDocumentEntries(initialDocumentEntries, fetchedDocumentEntries),
    iframeDocumentEntries
  );
  const tables = extractTablesFromEntries(documentEntries);
  const documentTexts = extractTextFromEntries(documentEntries);
  const textLineSamples = collectAcademicTextLines(documentTexts).slice(0, 12);
  window.__INNIS_KIT_CAMPUS_DEBUG__ = {
    sourceUrl: window.location.href,
    candidateUrls: candidateUrls,
    documents: documentEntries.map((entry) => ({
      href: entry.href,
      depth: entry.depth,
      frameCount: entry.frameCount,
      fetched: Boolean(entry.fetched),
      viaIframe: Boolean(entry.viaIframe),
      tableCount: extractTablesFromDocument(entry.doc).length,
      title: normalizeText(entry.doc.title),
    })),
    fetchedDocumentCount: fetchedDocumentEntries.length,
    iframeDocumentCount: iframeDocumentEntries.length,
    tableCount: tables.length,
    documentTextLength: documentTexts.length,
    rowCounts: tables.map((table) => table.rows.length),
    headerSamples: tables.slice(0, 5).map((table) => table.headers),
    textLineSamples: textLineSamples,
    textPreview: documentTexts.slice(0, 600),
    rowSamples: tables.slice(0, 3).map((table) => ({
      sourceHref: table.sourceHref,
      sourceDepth: table.sourceDepth,
      rows: table.rows.slice(0, 5).map((row) => row.cells),
    })),
  };
  const modules = extractModulesFromTables(tables);
  const grades = extractGradesFromTables(tables);
  const exams = extractExamsFromTables(tables);
  const fallback = modules.length === 0 && grades.length === 0
    ? extractFallbackAcademicRows(tables)
    : { modules: [], grades: [] };
  const textFallback = modules.length === 0 && grades.length === 0 && fallback.modules.length === 0 && fallback.grades.length === 0
    ? extractFallbackAcademicRowsFromText(documentTexts)
    : { modules: [], grades: [] };

  if (modules.length === 0 && grades.length === 0 && exams.length === 0 && fallback.modules.length === 0 && fallback.grades.length === 0 && textFallback.modules.length === 0 && textFallback.grades.length === 0) {
    alert('INNIS CAMPUS Export: Auf dieser Seite wurden keine Module, Noten oder Prüfungen erkannt. Öffne Studienaufbau, Notenspiegel oder Prüfungen und führe das Skript dort aus.');
    return;
  }

  const snapshot = loadSnapshot();
  snapshot.generatedAt = new Date().toISOString();
  snapshot.sourceUrl = window.location.href;
  snapshot.modules = dedupeByExternalId([].concat(snapshot.modules || [], modules, fallback.modules, textFallback.modules, deriveModulesFromGrades([].concat(grades, fallback.grades, textFallback.grades)), deriveModulesFromExams(exams)))
    .map(function (mod) {
      if (mod.credits !== null && mod.credits !== undefined && mod.credits > 60) {
        mod.credits = null;
      }
      return mod;
    });
  snapshot.grades = dedupeByKey([].concat(snapshot.grades || [], grades, fallback.grades, textFallback.grades), 'externalGradeId');
  snapshot.exams = dedupeByKey([].concat(snapshot.exams || [], exams), 'externalId');
  saveSnapshot(snapshot);

  const message = 'INNIS CAMPUS Export aktualisiert: ' + snapshot.modules.length + ' Module, ' + snapshot.grades.length + ' Noten, ' + snapshot.exams.length + ' Prüfungen.';
  const serialized = JSON.stringify(snapshot, null, 2);
  const filename = 'innis-kit-campus-academic-export-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.json';
  window.__INNIS_KIT_CAMPUS_EXPORT__ = snapshot;

  function triggerDownload(jsonString, downloadFilename) {
    try {
      var targetDoc = (window.top && window.top.document) || document;
      var blob = new Blob([jsonString], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var link = targetDoc.createElement('a');
      link.href = url;
      link.download = downloadFilename;
      link.style.display = 'none';
      targetDoc.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      return true;
    } catch (_topError) {
      try {
        var blob2 = new Blob([jsonString], { type: 'application/json' });
        var url2 = URL.createObjectURL(blob2);
        var link2 = document.createElement('a');
        link2.href = url2;
        link2.download = downloadFilename;
        link2.style.display = 'none';
        document.body.appendChild(link2);
        link2.click();
        link2.remove();
        setTimeout(function () { URL.revokeObjectURL(url2); }, 1000);
        return true;
      } catch (_localError) {
        return false;
      }
    }
  }

  var downloaded = triggerDownload(serialized, filename);

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(serialized).then(
      function () {
        alert(message + (downloaded
          ? ' Datei wurde heruntergeladen und JSON in die Zwischenablage kopiert.'
          : ' JSON in Zwischenablage kopiert. Download fehlgeschlagen — füge den JSON in INNIS manuell ein.'));
      },
      function () {
        alert(message + (downloaded
          ? ' Datei wurde heruntergeladen. Zwischenablage nicht verfügbar.'
          : ' JSON liegt auf window.__INNIS_KIT_CAMPUS_EXPORT__'));
      }
    );
  } else {
    alert(message + (downloaded
      ? ' Datei wurde heruntergeladen.'
      : ' JSON liegt auf window.__INNIS_KIT_CAMPUS_EXPORT__'));
  }
})();
