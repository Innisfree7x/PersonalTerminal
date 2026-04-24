import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type { CalendarEntry } from '@/lib/supabase/calendarEntries';

type CalendarEntriesQueryKey = readonly [string, string, string, string];

function compareCalendarEntries(a: CalendarEntry, b: CalendarEntry): number {
  return (
    a.startsAt.localeCompare(b.startsAt) ||
    a.title.localeCompare(b.title) ||
    a.id.localeCompare(b.id)
  );
}

function isCalendarEntriesQueryKey(queryKey: QueryKey): queryKey is CalendarEntriesQueryKey {
  return (
    Array.isArray(queryKey) &&
    queryKey[0] === 'calendar-entries' &&
    typeof queryKey[2] === 'string' &&
    typeof queryKey[3] === 'string'
  );
}

function isManualEntryMatch(entry: CalendarEntry, entryId: string): boolean {
  return entry.source === 'manual' && entry.id === entryId;
}

function startsInRange(entry: CalendarEntry, fromIso: string, toIso: string): boolean {
  return entry.startsAt >= fromIso && entry.startsAt <= toIso;
}

export function applyCalendarEntryToQueryData(
  currentEntries: CalendarEntry[] | undefined,
  queryKey: QueryKey,
  entry: CalendarEntry
): CalendarEntry[] | undefined {
  if (!currentEntries) return currentEntries;

  const filtered = currentEntries.filter((existing) => !isManualEntryMatch(existing, entry.id));
  const removedExistingEntry = filtered.length !== currentEntries.length;

  if (!isCalendarEntriesQueryKey(queryKey)) {
    return removedExistingEntry ? filtered : currentEntries;
  }

  if (!startsInRange(entry, queryKey[2], queryKey[3])) {
    return removedExistingEntry ? filtered : currentEntries;
  }

  return [...filtered, entry].sort(compareCalendarEntries);
}

export function removeManualCalendarEntryFromQueryData(
  currentEntries: CalendarEntry[] | undefined,
  entryId: string
): CalendarEntry[] | undefined {
  if (!currentEntries) return currentEntries;

  const filtered = currentEntries.filter((entry) => !isManualEntryMatch(entry, entryId));
  return filtered.length === currentEntries.length ? currentEntries : filtered;
}

export function applyCalendarEntryToCachedQueries(
  queryClient: QueryClient,
  entry: CalendarEntry
): void {
  for (const [queryKey, currentEntries] of queryClient.getQueriesData<CalendarEntry[]>({
    queryKey: ['calendar-entries'],
  })) {
    queryClient.setQueryData(
      queryKey,
      applyCalendarEntryToQueryData(currentEntries, queryKey, entry)
    );
  }
}

export function removeManualCalendarEntryFromCachedQueries(
  queryClient: QueryClient,
  entryId: string
): void {
  for (const [queryKey, currentEntries] of queryClient.getQueriesData<CalendarEntry[]>({
    queryKey: ['calendar-entries'],
  })) {
    queryClient.setQueryData(
      queryKey,
      removeManualCalendarEntryFromQueryData(currentEntries, entryId)
    );
  }
}
