import { describe, expect, it } from 'vitest';
import type { CalendarEntry } from '@/lib/supabase/calendarEntries';
import {
  entryOverlapsDay,
  getCalendarDayKey,
  getEntryDisplayDayRange,
} from '@/lib/calendar/calendarEntryRange';

function makeEntry(overrides: Partial<CalendarEntry> = {}): CalendarEntry {
  return {
    id: overrides.id ?? 'entry-1',
    source: overrides.source ?? 'manual',
    title: overrides.title ?? 'Termin',
    description: overrides.description ?? null,
    location: overrides.location ?? null,
    startsAt: overrides.startsAt ?? '2026-04-21T08:00:00.000Z',
    endsAt: overrides.endsAt ?? '2026-04-21T09:00:00.000Z',
    allDay: overrides.allDay ?? false,
    kind: overrides.kind ?? 'custom',
  };
}

describe('calendarEntryRange', () => {
  it('treats midnight ends as exclusive for display ranges', () => {
    const range = getEntryDisplayDayRange(
      makeEntry({
        startsAt: '2026-04-21T22:00:00',
        endsAt: '2026-04-22T00:00:00',
      })
    );

    expect(getCalendarDayKey(range.start)).toBe(getCalendarDayKey(new Date('2026-04-21T12:00:00.000Z')));
    expect(getCalendarDayKey(range.end)).toBe(getCalendarDayKey(new Date('2026-04-21T12:00:00.000Z')));
  });

  it('does not overlap a day when a timed event ends exactly at day start', () => {
    const entry = makeEntry({
      startsAt: '2026-04-20T22:00:00',
      endsAt: '2026-04-21T00:00:00',
    });

    expect(entryOverlapsDay(entry, new Date('2026-04-21T12:00:00'))).toBe(false);
  });

  it('spans Google all-day entries across every covered local day', () => {
    const entry = makeEntry({
      startsAt: '2026-04-20T00:00:00',
      endsAt: '2026-04-22T00:00:00',
      allDay: true,
    });

    expect(entryOverlapsDay(entry, new Date('2026-04-20T12:00:00'))).toBe(true);
    expect(entryOverlapsDay(entry, new Date('2026-04-21T12:00:00'))).toBe(true);
    expect(entryOverlapsDay(entry, new Date('2026-04-22T12:00:00'))).toBe(false);
  });
});
