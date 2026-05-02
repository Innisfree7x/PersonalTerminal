'use client';

import { memo, useMemo } from 'react';
import { Lock } from 'lucide-react';
import type { CalendarEntry, CalendarEntryKind } from '@/lib/supabase/calendarEntries';
import { WEEKDAY_LABELS_DE } from '@/lib/calendar/kitTimeSlots';

export interface MonthlyGridProps {
  monthStart: Date;
  entries: CalendarEntry[];
  onSelectDay: (day: Date) => void;
  onOpenEntry: (entry: CalendarEntry) => void;
}

const KIND_DOT: Record<CalendarEntryKind, string> = {
  lecture: 'bg-sky-400',
  exercise: 'bg-amber-400',
  tutorial: 'bg-violet-400',
  exam: 'bg-red-400',
  interview: 'bg-emerald-400',
  meeting: 'bg-cyan-400',
  deadline: 'bg-rose-400',
  personal: 'bg-pink-400',
  custom: 'bg-text-tertiary',
};

function startOfMonth(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function gridStartForMonth(monthStart: Date): Date {
  const d = new Date(monthStart);
  const weekday = d.getDay(); // 0=Sun, 1=Mon...
  const offset = weekday === 0 ? 6 : weekday - 1;
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function MonthlyGrid({
  monthStart,
  entries,
  onSelectDay,
  onOpenEntry,
}: MonthlyGridProps) {
  const { cells, month } = useMemo(() => {
    const monthFirst = startOfMonth(monthStart);
    const gridStart = gridStartForMonth(monthFirst);
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      cells.push(d);
    }
    return { cells, month: monthFirst.getMonth() };
  }, [monthStart]);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const entry of entries) {
      const start = new Date(entry.startsAt);
      const key = `${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`;
      const existing = map.get(key);
      if (existing) existing.push(entry);
      else map.set(key, [entry]);
    }
    map.forEach((items: CalendarEntry[]) => {
      items.sort((a: CalendarEntry, b: CalendarEntry) => a.startsAt.localeCompare(b.startsAt));
    });
    return map;
  }, [entries]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="card-surface rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border bg-surface-hover/40">
        {WEEKDAY_LABELS_DE.map((label, i) => (
          <div
            key={label}
            className={`h-10 flex items-center justify-center text-[11px] uppercase tracking-wider text-text-tertiary ${
              i < 6 ? 'border-r border-border' : ''
            }`}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const isCurrentMonth = day.getMonth() === month;
          const isToday = sameDay(day, today);
          const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
          const dayEntries = entriesByDay.get(key) ?? [];
          const visible = dayEntries.slice(0, 3);
          const overflow = dayEntries.length - visible.length;
          const rowEnd = i >= cells.length - 7;
          return (
            <button
              key={i}
              onClick={() => onSelectDay(day)}
              className={`group text-left min-h-[96px] p-2 ${
                (i % 7) < 6 ? 'border-r' : ''
              } ${rowEnd ? '' : 'border-b'} border-border transition-colors hover:bg-surface-hover/60 ${
                isCurrentMonth ? '' : 'opacity-45'
              } ${isToday ? 'bg-primary/5' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-semibold ${
                    isToday ? 'text-primary' : 'text-text-primary'
                  }`}
                >
                  {day.getDate()}
                </span>
                {dayEntries.length > 0 && (
                  <span className="text-[10px] text-text-tertiary font-mono">{dayEntries.length}</span>
                )}
              </div>
              <div className="space-y-0.5">
                {visible.map((entry) => {
                  const readonly = entry.source === 'kit_webcal' || entry.source === 'google';
                  return (
                    <div
                      key={entry.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEntry(entry);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                          onOpenEntry(entry);
                        }
                      }}
                      className="flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-surface-hover cursor-pointer"
                      title={entry.title}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${KIND_DOT[entry.kind]}`} />
                      <span className="text-[10px] text-text-secondary truncate flex-1">
                        {entry.title}
                      </span>
                      {readonly && <Lock className="w-2.5 h-2.5 text-text-tertiary flex-shrink-0" />}
                    </div>
                  );
                })}
                {overflow > 0 && (
                  <div className="text-[10px] text-text-tertiary pl-2.5">+{overflow} weitere</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(MonthlyGrid);
