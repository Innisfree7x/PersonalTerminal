(function () {
  const EXPORT_TYPE = 'innis_ilias_course_items_export';
  const EXPORT_VERSION = 1;
  const STORAGE_KEY = 'innis:kit-ilias-course-items-export:v1';
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
    'Zurück',
    'Weiter',
  ]);

  // Browser-Connector und App-Parser laufen absichtlich mit spiegelnder Logik.
  // Änderungen an ILIAS-Kursseiten müssen deshalb hier und in
  // lib/kit-sync/iliasCourseExport.ts synchron gepflegt werden.

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

  function toAbsoluteUrl(href, baseUrl) {
    try {
      return new URL(href, baseUrl).toString();
    } catch {
      return null;
    }
  }

  function extractExternalIdFromUrl(url, fallbackTitle) {
    try {
      const parsed = new URL(url);
      const refId = parsed.searchParams.get('ref_id');
      if (refId) return 'ref:' + refId;
      const target = parsed.searchParams.get('target');
      if (target) return 'target:' + target;
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length > 0) return 'path:' + parts[parts.length - 1];
    } catch {}
    return 'title:' + slugify(fallbackTitle);
  }

  function detectCourseTitle(doc) {
    const candidates = Array.from(doc.querySelectorAll('main h1, main h2, .il-maincontrols-metabar h1, .breadcrumb_last, .il-header-page-title'));
    for (const candidate of candidates) {
      const text = normalizeText(candidate.textContent);
      if (text && !BLOCKED_LABELS.has(text)) return text;
    }
    return 'ILIAS Kurs';
  }

  function detectSemesterLabel(doc) {
    const text = normalizeText(doc.body.textContent);
    const match = text.match(/\b(?:WS|SS)\s*\d{4}\b/i);
    return match ? match[0].replace(/\s+/, ' ').toUpperCase() : null;
  }

  function detectItemType(title, url, contextText) {
    const lowerTitle = title.toLowerCase();
    const lowerContext = contextText.toLowerCase();
    const lowerUrl = url.toLowerCase();
    if (lowerTitle.includes('ankündigung') || lowerContext.includes('ankündigung')) return 'announcement';
    if (lowerUrl.includes('baseclass=illinkresourcehandlergui') || lowerUrl.includes('download') || /\.(pdf|docx?|xlsx?|pptx?|zip)$/i.test(lowerUrl) || /\.(pdf|docx?|xlsx?|pptx?|zip)$/i.test(lowerTitle)) return 'document';
    if (lowerUrl.includes('target=fold_') || lowerTitle.includes('ordner') || lowerContext.includes('ordner')) return 'folder';
    if (lowerUrl.startsWith('http')) return 'link';
    return 'other';
  }

  function extractPublishedAt(text) {
    const match = normalizeText(text).match(/(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[^\d]+(\d{1,2}):(\d{2}))?/);
    if (!match) return null;
    const date = new Date(
      Number.parseInt(match[3], 10),
      Number.parseInt(match[2], 10) - 1,
      Number.parseInt(match[1], 10),
      match[4] ? Number.parseInt(match[4], 10) : 0,
      match[5] ? Number.parseInt(match[5], 10) : 0,
      0,
      0
    );
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  function extractSummary(containerText, title) {
    const normalized = normalizeText(containerText).replace(title, '').trim();
    return normalized ? normalized.slice(0, 4000) : null;
  }

  function loadSnapshot(sourceUrl) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) throw new Error('empty');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.exportType === EXPORT_TYPE && parsed.exportVersion === EXPORT_VERSION) return parsed;
    } catch {}
    return {
      exportType: EXPORT_TYPE,
      exportVersion: EXPORT_VERSION,
      generatedAt: new Date().toISOString(),
      sourceUrl,
      favorites: [],
      items: [],
    };
  }

  function upsertByExternalId(collection, item) {
    const index = collection.findIndex((entry) => entry.externalId === item.externalId);
    if (index >= 0) {
      collection[index] = item;
    } else {
      collection.push(item);
    }
  }

  const sourceUrl = window.location.href;
  const favoriteTitle = detectCourseTitle(document);
  const favoriteExternalId = extractExternalIdFromUrl(sourceUrl, favoriteTitle);
  const favorite = {
    externalId: favoriteExternalId,
    title: favoriteTitle,
    semesterLabel: detectSemesterLabel(document),
    courseUrl: sourceUrl,
    sourceUpdatedAt: new Date().toISOString(),
  };

  const snapshot = loadSnapshot(sourceUrl);
  upsertByExternalId(snapshot.favorites, favorite);

  const main = document.querySelector('main') || document.body;
  const anchors = Array.from(main.querySelectorAll('a[href]'));
  let importedItems = 0;

  anchors.forEach((anchor) => {
    const title = normalizeText(anchor.textContent);
    if (!title || title.length < 4 || BLOCKED_LABELS.has(title) || title === favoriteTitle) return;

    const itemUrl = toAbsoluteUrl(anchor.getAttribute('href') || '', sourceUrl);
    if (!itemUrl || itemUrl === sourceUrl) return;

    const container = anchor.closest('li, tr, article, .il-item, .ilContainerBlock, .row, .card, .media, .il-std-item') || anchor.parentElement;
    const contextText = normalizeText((container && container.textContent) || anchor.textContent);
    const itemType = detectItemType(title, itemUrl, contextText);
    const item = {
      externalId: favoriteExternalId + ':' + extractExternalIdFromUrl(itemUrl, title),
      favoriteExternalId: favoriteExternalId,
      title: title,
      itemType: itemType,
      itemUrl: itemUrl,
      summary: extractSummary(contextText, title),
      publishedAt: extractPublishedAt(contextText),
      sourceUpdatedAt: new Date().toISOString(),
    };

    upsertByExternalId(snapshot.items, item);
    importedItems += 1;
  });

  if (importedItems === 0) {
    alert('INNIS ILIAS Kurs-Export: Auf dieser Seite wurden keine neuen Kurs-Items erkannt. Öffne einen favorisierten ILIAS-Kurs mit sichtbaren Materialien oder Ankündigungen und führe das Skript dort aus.');
    return;
  }

  snapshot.generatedAt = new Date().toISOString();
  snapshot.sourceUrl = sourceUrl;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));

  const serialized = JSON.stringify(snapshot, null, 2);
  const filename = 'innis-kit-ilias-course-items-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.json';
  const blob = new Blob([serialized], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  const message = 'INNIS ILIAS Kurs-Export aktualisiert: ' + snapshot.favorites.length + ' Kurse, ' + snapshot.items.length + ' Items.';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(serialized).then(
      function () { alert(message + ' JSON wurde kopiert und als Datei gespeichert.'); },
      function () { alert(message + ' JSON wurde als Datei gespeichert.'); }
    );
  } else {
    alert(message + ' JSON wurde als Datei gespeichert.');
  }
})();
