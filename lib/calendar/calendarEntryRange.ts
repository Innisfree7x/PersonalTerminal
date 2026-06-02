import type { CalendarEntry } from '@/lib/supabase/calendarEntries';

export function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addLocalDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isLocalMidnight(date: Date): boolean {
  return (
    date.getHours() === 0 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0
  );
}

export function getCalendarDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function getEntryDisplayDayRange(entry: CalendarEntry): { start: Date; end: Date } {
  const start = new Date(entry.startsAt);
  const end = new Date(entry.endsAt);
  const startDay = startOfLocalDay(start);

  if (Number.isNaN(end.getTime()) || end <= start) {
    return { start: startDay, end: startDay };
  }

  const rawEndDay = startOfLocalDay(end);
  const endDay = isLocalMidnight(end) ? addLocalDays(rawEndDay, -1) : rawEndDay;

  return { start: startDay, end: endDay < startDay ? startDay : endDay };
}

export function entryOverlapsDay(entry: CalendarEntry, day: Date): boolean {
  const target = startOfLocalDay(day);
  if (entry.allDay) {
    const { start, end } = getEntryDisplayDayRange(entry);
    return target >= start && target <= end;
  }

  const start = new Date(entry.startsAt);
  const end = new Date(entry.endsAt);
  if (Number.isNaN(start.getTime())) return false;
  if (Number.isNaN(end.getTime()) || end <= start) return target.getTime() === startOfLocalDay(start).getTime();

  const nextDay = addLocalDays(target, 1);
  return start < nextDay && end > target;
}
