(function () {
  const EXPORT_TYPE = 'innis_ilias_dashboard_export';
  const EXPORT_VERSION = 1;
  const GROUP_LABEL_PATTERN = /^(WS|SS)\s+\d{4}$/i;
  const STRUCTURAL_LABELS = new Set(['Bachelor', 'Master']);
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

  function normalizeText(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
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
      if (refId) return `ref:${refId}`;

      const target = parsed.searchParams.get('target');
      if (target) return `target:${target}`;

      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) return `path:${pathParts[pathParts.length - 1]}`;
    } catch {
      // ignore and use fallback
    }

    return `title:${fallbackTitle.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '')}`;
  }

  function isLikelyCourseLink(anchor, baseUrl) {
    const title = normalizeText(anchor.textContent);
    if (!title || title.length < 6) return false;
    if (BLOCKED_LABELS.has(title)) return false;

    const absoluteUrl = toAbsoluteUrl(anchor.getAttribute('href') || '', baseUrl);
    if (!absoluteUrl) return false;

    try {
      const parsed = new URL(absoluteUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) return false;
      if (parsed.searchParams.get('baseClass') === 'ilLinkResourceHandlerGUI') return false;
    } catch {
      return false;
    }

    return true;
  }

  function findFavoritesRoot(doc, baseUrl) {
    const headings = Array.from(
      doc.querySelectorAll('h1, h2, h3, h4, h5, h6, .ilContainerBlockHeader, .card-title, .caption, strong')
    );
    const heading = headings.find((element) => normalizeText(element.textContent).toLowerCase() === 'favoriten');
    if (!heading) return null;

    let current = heading;
    while (current && current !== doc.body) {
      const anchors = Array.from(current.querySelectorAll('a')).filter((anchor) => isLikelyCourseLink(anchor, baseUrl));
      if (anchors.length > 0) return current;
      current = current.parentElement;
    }

    return heading.parentElement;
  }

  function collectFavorites(doc, baseUrl) {
    const root = findFavoritesRoot(doc, baseUrl);
    if (!root) return [];

    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let currentGroup = null;
    const favorites = new Map();

    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!(node instanceof HTMLElement)) continue;

      const text = normalizeText(node.textContent);
      if (!text) continue;

      if (
        text !== 'Favoriten' &&
        (GROUP_LABEL_PATTERN.test(text) || STRUCTURAL_LABELS.has(text)) &&
        node.tagName !== 'A'
      ) {
        currentGroup = text;
        continue;
      }

      if (node instanceof HTMLAnchorElement && isLikelyCourseLink(node, baseUrl)) {
        const title = normalizeText(node.textContent);
        const courseUrl = toAbsoluteUrl(node.getAttribute('href') || '', baseUrl);
        if (!courseUrl) continue;

        const externalId = extractExternalIdFromUrl(courseUrl, title);
        if (favorites.has(externalId)) continue;

        favorites.set(externalId, {
          externalId,
          title,
          semesterLabel: currentGroup,
          courseUrl,
          sourceUpdatedAt: null,
        });
      }
    }

    return Array.from(favorites.values());
  }

  const payload = {
    exportType: EXPORT_TYPE,
    exportVersion: EXPORT_VERSION,
    generatedAt: new Date().toISOString(),
    sourceUrl: window.location.href,
    favorites: collectFavorites(document, window.location.href),
    items: [],
  };

  const serialized = JSON.stringify(payload, null, 2);
  const filename = `innis-kit-ilias-dashboard-export-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;

  const blob = new Blob([serialized], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(serialized).then(
      function () {
        alert(`INNIS ILIAS Export erstellt: ${payload.favorites.length} Favoriten. JSON wurde kopiert und als Datei gespeichert.`);
      },
      function () {
        alert(`INNIS ILIAS Export erstellt: ${payload.favorites.length} Favoriten. JSON wurde als Datei gespeichert.`);
      }
    );
  } else {
    alert(`INNIS ILIAS Export erstellt: ${payload.favorites.length} Favoriten. JSON wurde als Datei gespeichert.`);
  }
})();
