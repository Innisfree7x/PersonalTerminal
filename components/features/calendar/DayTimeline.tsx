'use client';

import { useMemo } from 'react';
import { Lock, Plus } from 'lucide-react';
import type { CalendarEntry, CalendarEntryKind } from '@/lib/supabase/calendarEntries';
import { KIT_TIME_SLOTS, slotIndexForDate } from '@/lib/calendar/kitTimeSlots';

export interface DayTimelineProps {
  day: Date;
  entries: CalendarEntry[];
  onAddAt: (startsAt: Date, endsAt: Date) => void;
  onOpenEntry: (entry: CalendarEntry) => void;
}

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

function formatHm(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function DayTimeline({ day, entries, onAddAt, onOpenEntry }: DayTimelineProps) {
  const { allDay, bySlot } = useMemo(() => {
    const allDay: CalendarEntry[] = [];
    const bySlot = new Map<number, CalendarEntry[]>();
    for (const entry of entries) {
      if (entry.allDay) {
        allDay.push(entry);
        continue;
      }
      const slotIdx = slotIndexForDate(new Date(entry.startsAt));
      const existing = bySlot.get(slotIdx);
      if (existing) existing.push(entry);
      else bySlot.set(slotIdx, [entry]);
    }
    return { allDay, bySlot };
  }, [entries]);

  return (
    <div className="card-surface rounded-xl overflow-hidden">
      {allDay.length > 0 && (
        <div className="border-b border-border p-3 space-y-1.5 bg-surface-hover/20">
          <div className="text-[11px] uppercase tracking-wider text-text-tertiary">Ganztags</div>
          {allDay.map((entry) => {
            const style = KIND_STYLES[entry.kind];
            const readonly = entry.source === 'kit_webcal';
            return (
              <button
                key={entry.id}
                onClick={() => onOpenEntry(entry)}
                className={`w-full text-left rounded-md px-3 py-2 border ${style.bg} ${style.border} ${style.text} hover:brightness-110 transition-all flex items-center gap-2`}
              >
                <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                <span className="flex-1 truncate">{entry.title}</span>
                {readonly && <Lock className="w-3.5 h-3.5 opacity-70" />}
              </button>
            );
          })}
        </div>
      )}

      <div className="divide-y divide-border">
        {KIT_TIME_SLOTS.map((slot) => {
          const items = bySlot.get(slot.index) ?? [];
          return (
            <div key={slot.index} className="grid" style={{ gridTemplateColumns: '120px 1fr' }}>
              <div className="px-3 py-3 border-r border-border bg-surface-hover/20">
                <div className="text-xs font-mono text-text-tertiary leading-tight">{slot.label}</div>
              </div>
              <div className="group p-2 min-h-[72px] relative">
                {items.length === 0 && (
                  <button
                    onClick={() => {
                      const start = new Date(day);
                      start.setHours(slot.startHour, slot.startMinute, 0, 0);
                      const end = new Date(day);
                      end.setHours(slot.endHour, slot.endMinute, 0, 0);
                      onAddAt(start, end);
                    }}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-text-tertiary hover:text-primary"
                    aria-label="Eintrag hinzufügen"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
                {items.length > 0 && (
                  <div className="space-y-1.5">
                    {items.map((entry) => {
                      const style = KIND_STYLES[entry.kind];
                      const readonly = entry.source === 'kit_webcal';
                      const start = new Date(entry.startsAt);
                      const end = new Date(entry.endsAt);
                      return (
                        <button
                          key={entry.id}
                          onClick={() => onOpenEntry(entry)}
                          className={`w-full text-left rounded-md px-3 py-2 border ${style.bg} ${style.border} ${style.text} hover:brightness-110 transition-all`}
                        >
                          <div className="flex items-center gap-2 text-[11px] font-mono opacity-80">
                            <span>{formatHm(start)} – {formatHm(end)}</span>
                            {readonly && <Lock className="w-3 h-3 ml-auto opacity-70" />}
                          </div>
                          <div className="text-sm font-medium mt-0.5 truncate">{entry.title}</div>
                          {entry.location && (
                            <div className="text-xs opacity-70 mt-0.5 truncate">{entry.location}</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
