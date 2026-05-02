'use client';

import { memo, useMemo } from 'react';
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

const WEEKLY_GRID_TEMPLATE = '132px repeat(7, minmax(0, 1fr))';
const WEEKLY_GRID_MIN_WIDTH = '1040px';

const KIND_STYLES: Record<CalendarEntryKind, { bg: string; border: string; text: string; dot: string }> = {
  lecture:   { bg: 'bg-sky-500/15',   border: 'border-sky-500/40',   text: 'text-sky-200',   dot: 'bg-sky-400'   },
  exercise:  { bg: 'bg-amber-500/15', border: 'border-amber-500/40', text: 'text-amber-200', dot: 'bg-amber-400' },
  tutorial:  { bg: 'bg-violet-500/15', border: 'border-violet-500/40', text: 'text-violet-200', dot: 'bg-violet-400' },
  exam:      { bg: 'bg-red-500/15',   border: 'border-red-500/40',   text: 'text-red-200',   dot: 'bg-red-400'   },
  interview: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-200', dot: 'bg-emerald-400' },
  meeting:   { bg: 'bg-cyan-500/15',  border: 'border-cyan-500/40',  text: 'text-cyan-200',  dot: 'bg-cyan-400'  },
  deadline:  { bg: 'bg-rose-500/15',  border: 'border-rose-500/40',  text: 'text-rose-200',  dot: 'bg-rose-400'  },
  personal:  { bg: 'bg-pink-500/15',  border: 'border-pink-500/40',  text: 'text-pink-200',  dot: 'bg-pink-400'  },
  custom:    { bg: 'bg-surface-hover', border: 'border-border', text: 'text-text-primary', dot: 'bg-text-tertiary' },
};

function dayIndexFromDate(weekStart: Date, date: Date): number {
  const ms = date.getTime() - weekStart.getTime();
  const dayIdx = Math.floor(ms / (1000 * 60 * 60 * 24));
  return dayIdx;
}

function formatHm(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function WeeklyTemplateGrid({
  weekStart,
  entries,
  onAddAt,
  onOpenEntry,
}: WeeklyTemplateGridProps) {
  const { buckets, allDayBuckets, days } = useMemo(() => {
    const nextDays: Date[] = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      return date;
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
      days: nextDays,
    };
  }, [weekStart, entries]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="card-surface overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_left_center,rgba(245,158,11,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] shadow-[0_24px_80px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div
        className="overflow-x-auto overscroll-x-contain"
        role="region"
        aria-label="Wochenkalender"
      >
        <div className="min-w-0" style={{ minWidth: WEEKLY_GRID_MIN_WIDTH }}>
          <div className="grid" style={{ gridTemplateColumns: WEEKLY_GRID_TEMPLATE }}>
            <div className="flex h-14 items-center justify-center border-b border-r border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] px-4 text-[11px] uppercase tracking-[0.26em] text-text-tertiary">
              Zeit
            </div>
            {days.map((day, i) => {
              const isToday = day.getTime() === today.getTime();
              return (
                <div
                  key={i}
                  className={`relative flex h-14 flex-col items-center justify-center overflow-hidden border-b border-border ${
                    i < 6 ? 'border-r' : ''
                  } ${
                    isToday
                      ? 'bg-[linear-gradient(180deg,rgba(248,113,113,0.18),rgba(248,113,113,0.07))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                      : 'bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))]'
                  }`}
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
                  <div className="text-[11px] uppercase tracking-[0.22em] text-text-tertiary">
                    {WEEKDAY_LABELS_DE[i]}
                  </div>
                  <div className={`text-[15px] font-semibold tracking-[0.08em] tabular-nums ${isToday ? 'text-primary' : 'text-text-primary'}`}>
                    {day.getDate()}.{String(day.getMonth() + 1).padStart(2, '0')}
                  </div>
                </div>
              );
            })}
          </div>

          {allDayBuckets.size > 0 && (
            <div className="grid" style={{ gridTemplateColumns: WEEKLY_GRID_TEMPLATE }}>
              <div className="flex min-h-[48px] items-center justify-center border-b border-r border-border bg-surface-hover/25 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-text-tertiary">
                Ganztags
              </div>
              {days.map((day, i) => {
                const isToday = day.getTime() === today.getTime();
                const bucket = allDayBuckets.get(i);
                return (
                  <div
                    key={i}
                    className={`flex min-h-[48px] flex-col gap-1.5 border-b border-border px-1.5 py-1.5 ${
                      i < 6 ? 'border-r' : ''
                    } ${isToday ? 'bg-[linear-gradient(180deg,rgba(248,113,113,0.08),rgba(248,113,113,0.03))]' : ''}`}
                  >
                    {bucket?.items.map((entry) => {
                      const style = KIND_STYLES[entry.kind];
                      const readonly = entry.source === 'kit_webcal' || entry.source === 'google';
                      return (
                        <button
                          key={entry.id}
                          onClick={() => onOpenEntry(entry)}
                          className={`flex w-full items-center gap-1.5 truncate rounded-xl border px-2.5 py-1.5 text-left text-[11px] backdrop-blur-md transition-all hover:-translate-y-px hover:brightness-110 hover:shadow-[0_12px_24px_rgba(0,0,0,0.18)] ${style.bg} ${style.border} ${style.text} shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]`}
                          title={entry.title}
                        >
                          <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${style.dot}`} />
                          <span className="truncate">{entry.title}</span>
                          {readonly && <Lock className="ml-auto h-3 w-3 flex-shrink-0 opacity-60" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {KIT_TIME_SLOTS.map((slot) => (
            <div
              key={slot.index}
              className="grid"
              style={{ gridTemplateColumns: WEEKLY_GRID_TEMPLATE }}
            >
              <div className="flex min-h-[78px] items-start border-b border-r border-border bg-surface-hover/25 px-4 py-2.5">
                <span className="whitespace-nowrap pt-0.5 text-[11.5px] font-medium leading-tight tracking-[0.06em] tabular-nums text-text-tertiary">
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
                    className={`group relative min-h-[78px] border-b border-border p-1.5 ${
                      dayIdx < 6 ? 'border-r' : ''
                    } ${isToday ? 'bg-[linear-gradient(180deg,rgba(248,113,113,0.08),rgba(248,113,113,0.025))]' : ''}`}
                  >
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
                        className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity text-text-tertiary hover:bg-primary/5 hover:text-primary group-hover:opacity-100"
                        aria-label="Eintrag hinzufügen"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}

                    {hasItems && (
                      <div className="flex flex-col gap-1">
                        {bucket.items.map((entry) => {
                          const style = KIND_STYLES[entry.kind];
                          const readonly = entry.source === 'kit_webcal' || entry.source === 'google';
                          const start = new Date(entry.startsAt);
                          const end = new Date(entry.endsAt);
                          return (
                            <button
                              key={entry.id}
                              onClick={() => onOpenEntry(entry)}
                              className={`w-full overflow-hidden rounded-xl border px-2 py-1.5 text-left backdrop-blur-md transition-all hover:-translate-y-px hover:brightness-110 hover:shadow-[0_16px_32px_rgba(0,0,0,0.22)] ${style.bg} ${style.border} ${style.text} shadow-[0_10px_24px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.06)]`}
                              title={`${entry.title}\n${formatHm(start)}–${formatHm(end)}${entry.location ? `\n${entry.location}` : ''}`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${style.dot}`} />
                                <span className="text-[10px] font-medium tabular-nums opacity-80">
                                  {formatHm(start)}
                                </span>
                                {readonly && <Lock className="ml-auto h-2.5 w-2.5 opacity-60" />}
                              </div>
                              <div className="mt-1 truncate text-[11px] font-semibold leading-tight">
                                {entry.title}
                              </div>
                              {entry.location && (
                                <div className="mt-0.5 truncate text-[10px] opacity-70">
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
      </div>
    </div>
  );
}

export default memo(WeeklyTemplateGrid);
