'use client';

import { useMemo } from 'react';
import { Lock, Plus } from 'lucide-react';
import {
  KIT_TIME_SLOTS,
  WEEKDAY_LABELS_DE,
  slotIndexForDate,
} from '@/lib/calendar/kitTimeSlots';
import type { CalendarEntry, CalendarEntryKind } from '@/lib/supabase/calendarEntries';

export interface WeeklyTemplateGridProps {
  weekStart: Date;
  entries: CalendarEntry[];
  onAddAt: (startsAt: Date, endsAt: Date) => void;
  onOpenEntry: (entry: CalendarEntry) => void;
}

type Bucket = { dayIndex: number; slotIndex: number; items: CalendarEntry[] };
type AllDayBucket = { dayIndex: number; items: CalendarEntry[] };

const KIND_STYLES: Record<CalendarEntryKind, { bg: string; border: string; text: string; dot: string }> = {
  lecture:   { bg: 'bg-sky-500/15',   border: 'border-sky-500/40',   text: 'text-sky-200',   dot: 'bg-sky-400'   },
  exercise:  { bg: 'bg-amber-500/15', border: 'border-amber-500/40', text: 'text-amber-200', dot: 'bg-amber-400' },
  tutorial:  { bg: 'bg-violet-500/15',border: 'border-violet-500/40',text: 'text-violet-200',dot: 'bg-violet-400'},
  exam:      { bg: 'bg-red-500/15',   border: 'border-red-500/40',   text: 'text-red-200',   dot: 'bg-red-400'   },
  interview: { bg: 'bg-emerald-500/15',border: 'border-emerald-500/40',text: 'text-emerald-200',dot: 'bg-emerald-400'},
  meeting:   { bg: 'bg-cyan-500/15',  border: 'border-cyan-500/40',  text: 'text-cyan-200',  dot: 'bg-cyan-400'  },
  deadline:  { bg: 'bg-rose-500/15',  border: 'border-rose-500/40',  text: 'text-rose-200',  dot: 'bg-rose-400'  },
  personal:  { bg: 'bg-pink-500/15',  border: 'border-pink-500/40',  text: 'text-pink-200',  dot: 'bg-pink-400'  },
  custom:    { bg: 'bg-surface-hover',border: 'border-border',       text: 'text-text-primary',dot: 'bg-text-tertiary'},
};

function dayIndexFromDate(weekStart: Date, date: Date): number {
  const ms = date.getTime() - weekStart.getTime();
  const dayIdx = Math.floor(ms / (1000 * 60 * 60 * 24));
  return dayIdx;
}

function formatHm(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function WeeklyTemplateGrid({
  weekStart,
  entries,
  onAddAt,
  onOpenEntry,
}: WeeklyTemplateGridProps) {
  const { buckets, allDayBuckets, days } = useMemo(() => {
    const days: Date[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const bucketMap = new Map<string, Bucket>();
    const allDayMap = new Map<number, AllDayBucket>();

    for (const entry of entries) {
      const start = new Date(entry.startsAt);
      const dayIndex = dayIndexFromDate(weekStart, start);
      if (dayIndex < 0 || dayIndex > 6) continue;

      if (entry.allDay) {
        const existing = allDayMap.get(dayIndex);
        if (existing) existing.items.push(entry);
        else allDayMap.set(dayIndex, { dayIndex, items: [entry] });
        continue;
      }

      const slotIndex = slotIndexForDate(start);
      const key = `${dayIndex}:${slotIndex}`;
      const existing = bucketMap.get(key);
      if (existing) existing.items.push(entry);
      else bucketMap.set(key, { dayIndex, slotIndex, items: [entry] });
    }

    return {
      buckets: bucketMap,
      allDayBuckets: allDayMap,
      days,
    };
  }, [weekStart, entries]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="card-surface rounded-xl overflow-hidden">
      {/* Header row: weekday labels */}
      <div className="grid" style={{ gridTemplateColumns: '88px repeat(7, minmax(0, 1fr))' }}>
        <div className="h-12 flex items-center justify-center text-[11px] uppercase tracking-wider text-text-tertiary border-b border-r border-border bg-surface-hover/40">
          Zeit
        </div>
        {days.map((day, i) => {
          const isToday = day.getTime() === today.getTime();
          return (
            <div
              key={i}
              className={`h-12 flex flex-col items-center justify-center border-b border-border ${
                i < 6 ? 'border-r' : ''
              } ${isToday ? 'bg-primary/10' : 'bg-surface-hover/40'}`}
            >
              <div className="text-[11px] uppercase tracking-wider text-text-tertiary">
                {WEEKDAY_LABELS_DE[i]}
              </div>
              <div className={`text-sm font-semibold ${isToday ? 'text-primary' : 'text-text-primary'}`}>
                {day.getDate()}.{String(day.getMonth() + 1).padStart(2, '0')}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day row (only if any entry is all-day) */}
      {allDayBuckets.size > 0 && (
        <div className="grid" style={{ gridTemplateColumns: '88px repeat(7, minmax(0, 1fr))' }}>
          <div className="min-h-[44px] px-2 py-1.5 flex items-center justify-center text-[10px] uppercase tracking-wider text-text-tertiary border-b border-r border-border bg-surface-hover/20">
            Ganztags
          </div>
          {days.map((_, i) => {
            const bucket = allDayBuckets.get(i);
            return (
              <div
                key={i}
                className={`min-h-[44px] px-1 py-1 border-b border-border ${
                  i < 6 ? 'border-r' : ''
                } flex flex-col gap-1`}
              >
                {bucket?.items.map((entry) => {
                  const style = KIND_STYLES[entry.kind];
                  const readonly = entry.source === 'kit_webcal';
                  return (
                    <button
                      key={entry.id}
                      onClick={() => onOpenEntry(entry)}
                      className={`text-left w-full rounded-md px-2 py-1 text-[11px] border ${style.bg} ${style.border} ${style.text} hover:brightness-110 transition-all truncate flex items-center gap-1.5`}
                      title={entry.title}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${style.dot} flex-shrink-0`} />
                      <span className="truncate">{entry.title}</span>
                      {readonly && <Lock className="w-3 h-3 ml-auto flex-shrink-0 opacity-60" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Time-slot rows */}
      {KIT_TIME_SLOTS.map((slot) => (
        <div
          key={slot.index}
          className="grid"
          style={{ gridTemplateColumns: '88px repeat(7, minmax(0, 1fr))' }}
        >
          <div className="min-h-[72px] px-2 py-2 flex items-start justify-end border-b border-r border-border bg-surface-hover/20">
            <span className="text-[11px] text-text-tertiary font-mono leading-tight whitespace-nowrap pt-0.5">
              {slot.label}
            </span>
          </div>
          {Array.from({ length: 7 }).map((_, dayIdx) => {
            const isToday = days[dayIdx]?.getTime() === today.getTime();
            const bucket = buckets.get(`${dayIdx}:${slot.index}`);
            const hasItems = bucket && bucket.items.length > 0;
            return (
              <div
                key={dayIdx}
                className={`group min-h-[72px] p-1 border-b border-border ${
                  dayIdx < 6 ? 'border-r' : ''
                } ${isToday ? 'bg-primary/5' : ''} relative`}
              >
                {/* Add button (visible on hover when empty) */}
                {!hasItems && (
                  <button
                    onClick={() => {
                      const day = days[dayIdx];
                      if (!day) return;
                      const start = new Date(day);
                      start.setHours(slot.startHour, slot.startMinute, 0, 0);
                      const end = new Date(day);
                      end.setHours(slot.endHour, slot.endMinute, 0, 0);
                      onAddAt(start, end);
                    }}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-text-tertiary hover:text-primary hover:bg-primary/5"
                    aria-label="Eintrag hinzufügen"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}

                {hasItems && (
                  <div className="flex flex-col gap-1">
                    {bucket.items.map((entry) => {
                      const style = KIND_STYLES[entry.kind];
                      const readonly = entry.source === 'kit_webcal';
                      const start = new Date(entry.startsAt);
                      const end = new Date(entry.endsAt);
                      return (
                        <button
                          key={entry.id}
                          onClick={() => onOpenEntry(entry)}
                          className={`text-left w-full rounded-md px-1.5 py-1 border ${style.bg} ${style.border} ${style.text} hover:brightness-110 transition-all overflow-hidden`}
                          title={`${entry.title}\n${formatHm(start)}–${formatHm(end)}${entry.location ? `\n${entry.location}` : ''}`}
                        >
                          <div className="flex items-center gap-1">
                            <span className={`h-1.5 w-1.5 rounded-full ${style.dot} flex-shrink-0`} />
                            <span className="text-[10px] font-mono opacity-80">
                              {formatHm(start)}
                            </span>
                            {readonly && <Lock className="w-2.5 h-2.5 ml-auto opacity-60" />}
                          </div>
                          <div className="text-[11px] font-medium leading-tight truncate mt-0.5">
                            {entry.title}
                          </div>
                          {entry.location && (
                            <div className="text-[10px] opacity-70 truncate mt-0.5">
                              {entry.location}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
