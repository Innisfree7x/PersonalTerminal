import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { CalendarEntry } from '@/lib/supabase/calendarEntries';
import {
  applyCalendarEntryToQueryData,
  applyCalendarEntryToCachedQueries,
  removeManualCalendarEntryFromCachedQueries,
  removeManualCalendarEntryFromQueryData,
} from '@/lib/calendar/calendarQueryCache';

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

describe('calendarQueryCache', () => {
  it('adds or replaces a manual entry inside the cached range and keeps sorting stable', () => {
    const queryKey = ['calendar-entries', 'week', '2026-04-21T00:00:00.000Z', '2026-04-27T23:59:59.999Z'];
    const existing = [
      makeEntry({ id: 'b', title: 'Später', startsAt: '2026-04-22T10:00:00.000Z' }),
      makeEntry({ id: 'a', title: 'Früher', startsAt: '2026-04-21T09:00:00.000Z' }),
    ];

    const next = applyCalendarEntryToQueryData(
      existing,
      queryKey,
      makeEntry({ id: 'c', title: 'Dazwischen', startsAt: '2026-04-21T12:00:00.000Z' })
    );

    expect(next?.map((entry) => entry.id)).toEqual(['a', 'c', 'b']);
  });

  it('removes a moved manual entry from a cached range when it no longer belongs there', () => {
    const queryKey = ['calendar-entries', 'week', '2026-04-21T00:00:00.000Z', '2026-04-27T23:59:59.999Z'];
    const existing = [
      makeEntry({ id: 'keep', title: 'Bleibt' }),
      makeEntry({ id: 'move', title: 'Wird verschoben' }),
    ];

    const next = applyCalendarEntryToQueryData(
      existing,
      queryKey,
      makeEntry({
        id: 'move',
        title: 'Wird verschoben',
        startsAt: '2026-05-02T08:00:00.000Z',
        endsAt: '2026-05-02T09:00:00.000Z',
      })
    );

    expect(next?.map((entry) => entry.id)).toEqual(['keep']);
  });

  it('removes only manual entries with the target id', () => {
    const current = [
      makeEntry({ id: 'same-id', source: 'manual' }),
      makeEntry({ id: 'same-id', source: 'kit_webcal', title: 'Readonly' }),
      makeEntry({ id: 'other' }),
    ];

    const next = removeManualCalendarEntryFromQueryData(current, 'same-id');

    expect(next).toEqual([
      makeEntry({ id: 'same-id', source: 'kit_webcal', title: 'Readonly' }),
      makeEntry({ id: 'other' }),
    ]);
  });

  it('reconciles all cached calendar ranges without a refetch', () => {
    const queryClient = new QueryClient();
    const weekKey = ['calendar-entries', 'week', '2026-04-21T00:00:00.000Z', '2026-04-27T23:59:59.999Z'];
    const monthKey = ['calendar-entries', 'month', '2026-04-01T00:00:00.000Z', '2026-04-30T23:59:59.999Z'];
    const futureKey = ['calendar-entries', 'week', '2026-05-01T00:00:00.000Z', '2026-05-07T23:59:59.999Z'];

    queryClient.setQueryData<CalendarEntry[]>(weekKey, [makeEntry({ id: 'existing' })]);
    queryClient.setQueryData<CalendarEntry[]>(monthKey, [makeEntry({ id: 'existing' })]);
    queryClient.setQueryData<CalendarEntry[]>(futureKey, [makeEntry({ id: 'future' })]);

    const updated = makeEntry({
      id: 'existing',
      title: 'Updated',
      startsAt: '2026-04-23T14:00:00.000Z',
      endsAt: '2026-04-23T15:00:00.000Z',
    });
    applyCalendarEntryToCachedQueries(queryClient, updated);

    expect(queryClient.getQueryData<CalendarEntry[]>(weekKey)?.[0]?.title).toBe('Updated');
    expect(queryClient.getQueryData<CalendarEntry[]>(monthKey)?.[0]?.title).toBe('Updated');
    expect(queryClient.getQueryData<CalendarEntry[]>(futureKey)?.map((entry) => entry.id)).toEqual(['future']);

    removeManualCalendarEntryFromCachedQueries(queryClient, 'existing');

    expect(queryClient.getQueryData<CalendarEntry[]>(weekKey)).toEqual([]);
    expect(queryClient.getQueryData<CalendarEntry[]>(monthKey)).toEqual([]);
  });
});
