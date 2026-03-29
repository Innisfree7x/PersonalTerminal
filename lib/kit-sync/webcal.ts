import { createHash } from 'node:crypto';
import { ApiErrors } from '@/lib/api/errors';

export type CampusEventKind = 'lecture' | 'exercise' | 'exam' | 'deadline' | 'other';

export interface ParsedCampusEvent {
  externalId: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  kind: CampusEventKind;
  sourceUpdatedAt: string | null;
  contentHash: string;
}

interface ParsedIcsDate {
  iso: string;
  allDay: boolean;
}

function normalizeIcsTimeZone(rawTimeZone: string | undefined): string | null {
  const timeZone = rawTimeZone?.replace(/^"(.+)"$/, '$1').trim();
  if (!timeZone) return null;

  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return null;
  }
}

function getTimeZoneOffsetMs(timeZone: string, date: Date): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  const year = Number.parseInt(parts.year ?? '0', 10);
  const month = Number.parseInt(parts.month ?? '1', 10);
  const day = Number.parseInt(parts.day ?? '1', 10);
  const hour = Number.parseInt(parts.hour ?? '0', 10);
  const minute = Number.parseInt(parts.minute ?? '0', 10);
  const second = Number.parseInt(parts.second ?? '0', 10);

  const zonedAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  return zonedAsUtc - date.getTime();
}

function buildUtcDateForIcsLocalTime(input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  timeZone: string;
}) {
  const utcGuess = new Date(
    Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute, input.second)
  );
  const offset = getTimeZoneOffsetMs(input.timeZone, utcGuess);
  return new Date(utcGuess.getTime() - offset);
}

function unfoldIcs(raw: string): string[] {
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && result.length > 0) {
      result[result.length - 1] += line.slice(1);
      continue;
    }
    result.push(line);
  }

  return result;
}

function unescapeIcsValue(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

function parseProperty(line: string): { key: string; params: Record<string, string>; value: string } | null {
  const separator = line.indexOf(':');
  if (separator <= 0) return null;

  const rawKey = line.slice(0, separator);
  const rawValue = line.slice(separator + 1);
  const [key, ...paramParts] = rawKey.split(';');
  if (!key) return null;
  const params = Object.fromEntries(
    paramParts
      .map((part) => {
        const idx = part.indexOf('=');
        if (idx <= 0) return null;
        return [part.slice(0, idx).toUpperCase(), part.slice(idx + 1)] as const;
      })
      .filter((value): value is readonly [string, string] => value !== null)
  );

  return {
    key: key.toUpperCase(),
    params,
    value: rawValue,
  };
}

function parseIcsDate(rawValue: string, params: Record<string, string>): ParsedIcsDate | null {
  const value = rawValue.trim();
  const isDateOnly = params.VALUE === 'DATE' || /^\d{8}$/.test(value);

  if (isDateOnly) {
    const year = Number.parseInt(value.slice(0, 4), 10);
    const month = Number.parseInt(value.slice(4, 6), 10);
    const day = Number.parseInt(value.slice(6, 8), 10);
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    return { iso: date.toISOString(), allDay: true };
  }

  const utcMatch = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (utcMatch) {
    const year = utcMatch[1];
    const month = utcMatch[2];
    const day = utcMatch[3];
    const hour = utcMatch[4];
    const minute = utcMatch[5];
    const second = utcMatch[6];
    if (!year || !month || !day || !hour || !minute || !second) return null;
    const date = new Date(
      Date.UTC(
        Number.parseInt(year, 10),
        Number.parseInt(month, 10) - 1,
        Number.parseInt(day, 10),
        Number.parseInt(hour, 10),
        Number.parseInt(minute, 10),
        Number.parseInt(second, 10)
      )
    );
    return { iso: date.toISOString(), allDay: false };
  }

  const localMatch = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
  if (localMatch) {
    const year = localMatch[1];
    const month = localMatch[2];
    const day = localMatch[3];
    const hour = localMatch[4];
    const minute = localMatch[5];
    const second = localMatch[6];
    if (!year || !month || !day || !hour || !minute || !second) return null;
    const timeZone = normalizeIcsTimeZone(params.TZID) ?? 'Europe/Berlin';
    const date = buildUtcDateForIcsLocalTime({
      year: Number.parseInt(year, 10),
      month: Number.parseInt(month, 10),
      day: Number.parseInt(day, 10),
      hour: Number.parseInt(hour, 10),
      minute: Number.parseInt(minute, 10),
      second: Number.parseInt(second, 10),
      timeZone,
    });
    return { iso: date.toISOString(), allDay: false };
  }

  return null;
}

function classifyEventKind(title: string, description: string | null): CampusEventKind {
  const haystack = `${title} ${description ?? ''}`.toLowerCase();
  if (/klausur|prüfung|exam|midterm|final/.test(haystack)) return 'exam';
  if (/abgabe|deadline|frist|due/.test(haystack)) return 'deadline';
  if (/übung|tutorial|exercise|tutorium/.test(haystack)) return 'exercise';
  if (/vorlesung|lecture|seminar|praktikum/.test(haystack)) return 'lecture';
  return 'other';
}

function createContentHash(input: Record<string, string | null | boolean>): string {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex');
}

export function normalizeCampusWebcalUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw ApiErrors.validation('WebCal-URL fehlt.');
  }

  const normalized = trimmed.replace(/^webcal:\/\//i, 'https://');
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw ApiErrors.validation('Ungültige WebCal-URL.');
  }

  if (!['https:', 'http:'].includes(parsed.protocol)) {
    throw ApiErrors.validation('WebCal muss über http oder https erreichbar sein.');
  }

  return parsed.toString();
}

export function maskCampusWebcalUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  const lastPath = url.pathname.split('/').filter(Boolean).at(-1) ?? 'feed';
  const tokenHint = url.searchParams.toString();
  const maskedToken = tokenHint ? `${tokenHint.slice(0, 6)}…` : 'token';
  return `${url.hostname}/…/${lastPath} (${maskedToken})`;
}

export function extractCalendarName(rawIcs: string): string | null {
  const line = unfoldIcs(rawIcs).find((entry) => entry.toUpperCase().startsWith('X-WR-CALNAME:'));
  if (!line) return null;
  return unescapeIcsValue(line.slice('X-WR-CALNAME:'.length)) || null;
}

export async function fetchCampusWebcalDocument(url: string): Promise<{ rawIcs: string; calendarName: string | null }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/calendar, text/plain;q=0.9, */*;q=0.5',
        'User-Agent': 'INNIS KIT Sync/1.0',
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw ApiErrors.badRequest(`WebCal-Feed konnte nicht geladen werden (${response.status}).`);
    }

    const rawIcs = await response.text();
    if (!rawIcs.includes('BEGIN:VCALENDAR')) {
      throw ApiErrors.validation('Die angegebene URL liefert keinen gültigen iCal-Feed.');
    }

    return {
      rawIcs,
      calendarName: extractCalendarName(rawIcs),
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw ApiErrors.badRequest('WebCal-Feed hat beim Laden zu lange gebraucht.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function parseCampusWebcalEvents(rawIcs: string): ParsedCampusEvent[] {
  const lines = unfoldIcs(rawIcs);
  const events: ParsedCampusEvent[] = [];
  let current: Record<string, { value: string; params: Record<string, string> }> | null = null;

  const flushCurrent = () => {
    if (!current) return;
    const title = current.SUMMARY ? unescapeIcsValue(current.SUMMARY.value) : null;
    const startsRaw = current.DTSTART ? parseIcsDate(current.DTSTART.value, current.DTSTART.params) : null;
    if (!title || !startsRaw) {
      current = null;
      return;
    }

    const endsRaw = current.DTEND ? parseIcsDate(current.DTEND.value, current.DTEND.params) : null;
    const description = current.DESCRIPTION ? unescapeIcsValue(current.DESCRIPTION.value) : null;
    const location = current.LOCATION ? unescapeIcsValue(current.LOCATION.value) : null;
    const uid = current.UID ? unescapeIcsValue(current.UID.value) : null;
    const updatedAt = current['LAST-MODIFIED']
      ? parseIcsDate(current['LAST-MODIFIED'].value, current['LAST-MODIFIED'].params)?.iso ?? null
      : current.DTSTAMP
        ? parseIcsDate(current.DTSTAMP.value, current.DTSTAMP.params)?.iso ?? null
        : null;

    const externalId = uid || createHash('sha1').update(`${title}:${startsRaw.iso}`).digest('hex');
    const kind = classifyEventKind(title, description);
    const contentHash = createContentHash({
      title,
      description,
      location,
      startsAt: startsRaw.iso,
      endsAt: endsRaw?.iso ?? null,
      allDay: startsRaw.allDay,
      kind,
    });

    events.push({
      externalId,
      title,
      description,
      location,
      startsAt: startsRaw.iso,
      endsAt: endsRaw?.iso ?? null,
      allDay: startsRaw.allDay,
      kind,
      sourceUpdatedAt: updatedAt,
      contentHash,
    });

    current = null;
  };

  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }
    if (upper === 'END:VEVENT') {
      flushCurrent();
      continue;
    }
    if (!current) continue;
    const property = parseProperty(line);
    if (!property) continue;
    current[property.key] = { value: property.value, params: property.params };
  }

  return events;
}
