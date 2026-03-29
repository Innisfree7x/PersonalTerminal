import { z } from 'zod';
import {
  iliasConnectorFavoriteSchema,
  iliasConnectorPayloadSchema,
} from '@/lib/schemas/kit-sync.schema';

export const KIT_ILIAS_DASHBOARD_CONNECTOR_VERSION = 'kit-ilias-dashboard-v1';
export const KIT_ILIAS_DASHBOARD_EXPORT_TYPE = 'innis_ilias_dashboard_export';
export const KIT_ILIAS_DASHBOARD_EXPORT_VERSION = 1;

const iliasDashboardExportSchema = z.object({
  exportType: z.literal(KIT_ILIAS_DASHBOARD_EXPORT_TYPE),
  exportVersion: z.literal(KIT_ILIAS_DASHBOARD_EXPORT_VERSION),
  generatedAt: z.string().datetime({ offset: true }),
  sourceUrl: z.string().trim().url().max(2048),
  favorites: z.array(iliasConnectorFavoriteSchema).max(200),
  items: iliasConnectorPayloadSchema.shape.items,
});

const groupLabelPattern = /^(WS|SS)\s+\d{4}$/i;
const structuralLabelSet = new Set(['Bachelor', 'Master']);
const sectionBoundaryLabels = new Set(['To-Do', 'Kalender', 'Neuigkeiten', 'Mail']);
const blockedLinkLabels = new Set([
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
// Änderungen an der Dashboard-Struktur müssen deshalb hier und in
// public/connectors/kit-ilias-dashboard-exporter.js synchron gepflegt werden.

function normalizeText(value: string | null | undefined) {
  return value?.replace(/\s+/g, ' ').trim() ?? '';
}

function toAbsoluteUrl(href: string, baseUrl: string) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractExternalIdFromUrl(url: string, fallbackTitle: string) {
  try {
    const parsed = new URL(url);
    const refId = parsed.searchParams.get('ref_id');
    if (refId) return `ref:${refId}`;

    const target = parsed.searchParams.get('target');
    if (target) return `target:${target}`;

    const pathMatch = parsed.pathname.match(/\/([^/]+)$/);
    if (pathMatch?.[1]) return `path:${pathMatch[1]}`;
  } catch {
    // ignore and use fallback
  }

  return `title:${fallbackTitle.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '')}`;
}

function isLikelyCourseLink(anchor: HTMLAnchorElement, baseUrl: string) {
  const title = normalizeText(anchor.textContent);
  if (!title || title.length < 6) return false;
  if (blockedLinkLabels.has(title)) return false;

  const absoluteUrl = toAbsoluteUrl(anchor.getAttribute('href') ?? '', baseUrl);
  if (!absoluteUrl) return false;

  const parsed = new URL(absoluteUrl);
  if (!['http:', 'https:'].includes(parsed.protocol)) return false;
  if (parsed.hash && parsed.pathname === '/' && !parsed.search) return false;
  if (parsed.searchParams.get('baseClass') === 'ilLinkResourceHandlerGUI') return false;

  return true;
}

function hasFavoritesHeading(doc: Document) {
  return Array.from(
    doc.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6, .ilContainerBlockHeader, .card-title, .caption, strong')
  ).some((element) => normalizeText(element.textContent).toLowerCase() === 'favoriten');
}

export function extractIliasDashboardFavorites(doc: Document, baseUrl: string) {
  if (!hasFavoritesHeading(doc)) {
    return [];
  }

  const scanRoot = doc.querySelector('main') ?? doc.body;
  const walker = doc.createTreeWalker(scanRoot, NodeFilter.SHOW_ELEMENT);
  let collecting = false;
  let currentGroup: string | null = null;
  const favorites = new Map<string, z.infer<typeof iliasConnectorFavoriteSchema>>();

  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!(node instanceof HTMLElement)) continue;

    const text = normalizeText(node.textContent);
    if (!text) continue;

    if (text.toLowerCase() === 'favoriten' && node.tagName !== 'A') {
      collecting = true;
      currentGroup = null;
      continue;
    }

    if (!collecting) continue;

    if (sectionBoundaryLabels.has(text) && node.tagName !== 'A' && favorites.size > 0) {
      break;
    }

    if (
      (groupLabelPattern.test(text) || structuralLabelSet.has(text)) &&
      node.tagName !== 'A'
    ) {
      currentGroup = text;
      continue;
    }

    if (node instanceof HTMLAnchorElement && isLikelyCourseLink(node, baseUrl)) {
      const title = normalizeText(node.textContent);
      const courseUrl = toAbsoluteUrl(node.getAttribute('href') ?? '', baseUrl);
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

export function buildIliasDashboardExport(doc: Document, sourceUrl: string) {
  return {
    exportType: KIT_ILIAS_DASHBOARD_EXPORT_TYPE,
    exportVersion: KIT_ILIAS_DASHBOARD_EXPORT_VERSION,
    generatedAt: new Date().toISOString(),
    sourceUrl,
    favorites: extractIliasDashboardFavorites(doc, sourceUrl),
    items: [],
  };
}

export function parseIliasDashboardExport(rawValue: string) {
  const parsed = JSON.parse(rawValue) as unknown;
  return iliasDashboardExportSchema.parse(parsed);
}

export type IliasDashboardExport = z.infer<typeof iliasDashboardExportSchema>;
