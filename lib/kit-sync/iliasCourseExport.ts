import { z } from 'zod';
import {
  iliasConnectorFavoriteSchema,
  iliasConnectorPayloadSchema,
  type IliasConnectorFavoriteInput,
  type IliasConnectorItemInput,
} from '@/lib/schemas/kit-sync.schema';

export const KIT_ILIAS_COURSE_CONNECTOR_VERSION = 'kit-ilias-course-v1';
export const KIT_ILIAS_COURSE_EXPORT_TYPE = 'innis_ilias_course_items_export';
export const KIT_ILIAS_COURSE_EXPORT_VERSION = 1;

const iliasCourseExportSchema = z.object({
  exportType: z.literal(KIT_ILIAS_COURSE_EXPORT_TYPE),
  exportVersion: z.literal(KIT_ILIAS_COURSE_EXPORT_VERSION),
  generatedAt: z.string().datetime({ offset: true }),
  sourceUrl: z.string().trim().url().max(2048),
  favorites: z.array(iliasConnectorFavoriteSchema).max(200),
  items: iliasConnectorPayloadSchema.shape.items,
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
  'Zurück',
  'Weiter',
]);

function normalizeText(value: string | null | undefined) {
  return value?.replace(/\s+/g, ' ').trim() ?? '';
}

function slugify(value: string) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

  return `title:${slugify(fallbackTitle)}`;
}

function detectCourseTitle(doc: Document) {
  const candidates = Array.from(doc.querySelectorAll<HTMLElement>('main h1, main h2, .il-maincontrols-metabar h1, .breadcrumb_last, .il-header-page-title'));
  for (const candidate of candidates) {
    const text = normalizeText(candidate.textContent);
    if (text && !blockedLabels.has(text)) {
      return text;
    }
  }
  return 'ILIAS Kurs';
}

function detectSemesterLabel(doc: Document) {
  const text = normalizeText(doc.body.textContent);
  const match = text.match(/\b(?:WS|SS)\s*\d{4}\b/i);
  return match ? match[0].replace(/\s+/, ' ').toUpperCase() : null;
}

function detectItemType(title: string, url: string, contextText: string): IliasConnectorItemInput['itemType'] {
  const lowerTitle = title.toLowerCase();
  const lowerContext = contextText.toLowerCase();
  const lowerUrl = url.toLowerCase();

  if (lowerTitle.includes('ankündigung') || lowerContext.includes('ankündigung')) return 'announcement';
  if (lowerUrl.includes('basclass=illinkresourcehandlergui') || lowerUrl.includes('download') || /\.(pdf|docx?|xlsx?|pptx?|zip)$/i.test(lowerUrl) || /\.(pdf|docx?|xlsx?|pptx?|zip)$/i.test(lowerTitle)) return 'document';
  if (lowerUrl.includes('target=fold_') || lowerTitle.includes('ordner') || lowerContext.includes('ordner')) return 'folder';
  if (lowerUrl.startsWith('http')) return 'link';
  return 'other';
}

function extractPublishedAt(text: string) {
  const dateMatch = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[^\d]+(\d{1,2}):(\d{2}))?/);
  if (!dateMatch) return null;
  const dayRaw = dateMatch[1];
  const monthRaw = dateMatch[2];
  const yearRaw = dateMatch[3];
  const hourRaw = dateMatch[4];
  const minuteRaw = dateMatch[5];
  if (!dayRaw || !monthRaw || !yearRaw) return null;
  const date = new Date(
    Number.parseInt(yearRaw, 10),
    Number.parseInt(monthRaw, 10) - 1,
    Number.parseInt(dayRaw, 10),
    hourRaw ? Number.parseInt(hourRaw, 10) : 0,
    minuteRaw ? Number.parseInt(minuteRaw, 10) : 0,
    0,
    0
  );
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function extractItemSummary(containerText: string, title: string) {
  const normalized = normalizeText(containerText).replace(title, '').trim();
  if (!normalized) return null;
  return normalized.slice(0, 4000);
}

export function extractIliasCourseExport(doc: Document, sourceUrl: string) {
  const favoriteTitle = detectCourseTitle(doc);
  const favoriteUrl = sourceUrl;
  const favoriteExternalId = extractExternalIdFromUrl(favoriteUrl, favoriteTitle);
  const semesterLabel = detectSemesterLabel(doc);

  const favorites: IliasConnectorFavoriteInput[] = [
    {
      externalId: favoriteExternalId,
      title: favoriteTitle,
      semesterLabel,
      courseUrl: favoriteUrl,
      sourceUpdatedAt: new Date().toISOString(),
    },
  ];

  const itemsMap = new Map<string, IliasConnectorItemInput>();
  const main = doc.querySelector('main') ?? doc.body;
  const anchors = Array.from(main.querySelectorAll<HTMLAnchorElement>('a[href]'));

  for (const anchor of anchors) {
    const title = normalizeText(anchor.textContent);
    if (!title || title.length < 4 || blockedLabels.has(title) || title === favoriteTitle) continue;

    const itemUrl = toAbsoluteUrl(anchor.getAttribute('href') ?? '', sourceUrl);
    if (!itemUrl) continue;
    if (itemUrl === favoriteUrl) continue;

    const container = (anchor.closest('li, tr, article, .il-item, .ilContainerBlock, .row, .card, .media, .il-std-item') as HTMLElement | null) ?? anchor.parentElement;
    const contextText = normalizeText(container?.textContent ?? anchor.textContent);
    const itemType = detectItemType(title, itemUrl, contextText);
    const externalId = `${favoriteExternalId}:${extractExternalIdFromUrl(itemUrl, title)}`;

    itemsMap.set(externalId, {
      externalId,
      favoriteExternalId,
      title,
      itemType,
      itemUrl,
      summary: extractItemSummary(contextText, title),
      publishedAt: extractPublishedAt(contextText),
      sourceUpdatedAt: new Date().toISOString(),
    });
  }

  return {
    exportType: KIT_ILIAS_COURSE_EXPORT_TYPE,
    exportVersion: KIT_ILIAS_COURSE_EXPORT_VERSION,
    generatedAt: new Date().toISOString(),
    sourceUrl,
    favorites,
    items: Array.from(itemsMap.values()),
  };
}

export function parseIliasCourseExport(rawValue: string) {
  const parsed = JSON.parse(rawValue) as unknown;
  return iliasCourseExportSchema.parse(parsed);
}

export type IliasCourseExport = z.infer<typeof iliasCourseExportSchema>;
