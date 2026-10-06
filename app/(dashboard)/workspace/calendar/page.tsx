'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import WeeklyTemplateGrid from '@/components/features/calendar/WeeklyTemplateGrid';
import MonthlyGrid from '@/components/features/calendar/MonthlyGrid';
import DayTimeline from '@/components/features/calendar/DayTimeline';
import AddEventModal from '@/components/features/calendar/AddEventModal';
import {
  applyCalendarEntryToCachedQueries,
  removeManualCalendarEntryFromCachedQueries,
} from '@/lib/calendar/calendarQueryCache';
import type { CalendarEntry, CalendarEntryKind } from '@/lib/supabase/calendarEntries';

type CalendarView = 'week' | 'month' | 'day';

const VIEW_STORAGE_KEY = 'innis.calendar.view';

interface CreateEntryBody {
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: string;
  endsAt: string;
  allDay?: boolean;
  kind?: CalendarEntryKind;
}

interface UpdateEntryBody {
  title?: string;
  description?: string | null;
  location?: string | null;
  startsAt?: string;
  endsAt?: string;
  allDay?: boolean;
  kind?: CalendarEntryKind;
}

interface ModalState {
  mode: 'create' | 'edit' | 'view';
  initial?: {
    id?: string;
    title?: string;
    description?: string | null;
    location?: string | null;
    startsAt: string;
    endsAt: string;
    allDay?: boolean;
    kind?: CalendarEntryKind;
    source?: CalendarEntry['source'];
  };
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 7);
  return d;
}

function startOfMonth(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function gridStartForMonth(monthStart: Date): Date {
  return startOfWeek(monthStart);
}

function gridEndForMonth(monthStart: Date): Date {
  const gridStart = gridStartForMonth(monthStart);
  const d = new Date(gridStart);
  d.setDate(d.getDate() + 42);
  return d;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatRange(view: CalendarView, cursor: Date): string {
  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ];
  if (view === 'month') {
    return `${monthNames[cursor.getMonth()]} ${cursor.getFullYear()}`;
  }
  if (view === 'day') {
    const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    return `${weekdays[cursor.getDay()]}, ${cursor.getDate()}. ${monthNames[cursor.getMonth()]} ${cursor.getFullYear()}`;
  }
  const weekStart = startOfWeek(cursor);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const startStr = `${weekStart.getDate()}.${sameMonth ? '' : ' ' + monthNames[weekStart.getMonth()]}`;
  const endStr = `${weekEnd.getDate()}. ${monthNames[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;
  return `${startStr} – ${endStr}`;
}

async function fetchEntries(from: string, to: string): Promise<CalendarEntry[]> {
  const params = new URLSearchParams({ from, to });
  const res = await fetch(`/api/calendar/entries?${params.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? 'Failed to load entries');
  }
  const data = (await res.json()) as { entries: CalendarEntry[] };
  return data.entries;
}

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<CalendarView>('week');
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [modal, setModal] = useState<ModalState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (raw === 'week' || raw === 'month' || raw === 'day') {
      setView(raw);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  const { from, to, weekStart, monthStart, dayStart } = useMemo(() => {
    if (view === 'week') {
      const ws = startOfWeek(cursor);
      return { from: ws, to: endOfWeek(ws), weekStart: ws, monthStart: null, dayStart: null };
    }
    if (view === 'month') {
      const ms = startOfMonth(cursor);
      return { from: gridStartForMonth(ms), to: gridEndForMonth(ms), weekStart: null, monthStart: ms, dayStart: null };
    }
    const ds = startOfDay(cursor);
    return { from: ds, to: endOfDay(cursor), weekStart: null, monthStart: null, dayStart: ds };
  }, [view, cursor]);

  const activeRangeLabel = useMemo(() => formatRange(view, cursor), [view, cursor]);

  const entriesQuery = useQuery<CalendarEntry[]>({
    queryKey: ['calendar-entries', view, from.toISOString(), to.toISOString()],
    queryFn: () => fetchEntries(from.toISOString(), to.toISOString()),
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async (body: CreateEntryBody) => {
      const res = await fetch('/api/calendar/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, syncWithGoogle: true }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? 'Erstellen fehlgeschlagen');
      }
      return (await res.json()) as CalendarEntry;
    },
    onSuccess: (entry) => applyCalendarEntryToCachedQueries(queryClient, entry),
  });

  const updateMutation = useMutation({
    mutationFn: async (args: { id: string; body: UpdateEntryBody }) => {
      const res = await fetch(`/api/calendar/entries/${args.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args.body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? 'Aktualisieren fehlgeschlagen');
      }
      return (await res.json()) as CalendarEntry;
    },
    onSuccess: (entry) => applyCalendarEntryToCachedQueries(queryClient, entry),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/calendar/entries/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? 'Löschen fehlgeschlagen');
      }
    },
    onSuccess: (_, id) => removeManualCalendarEntryFromCachedQueries(queryClient, id),
  });

  const entries = entriesQuery.data ?? [];

  const handlePrev = useCallback(() => {
    setCursor((current) => {
      const d = new Date(current);
      if (view === 'week') d.setDate(d.getDate() - 7);
      else if (view === 'month') d.setMonth(d.getMonth() - 1);
      else d.setDate(d.getDate() - 1);
      return d;
    });
  }, [view]);

  const handleNext = useCallback(() => {
    setCursor((current) => {
      const d = new Date(current);
      if (view === 'week') d.setDate(d.getDate() + 7);
      else if (view === 'month') d.setMonth(d.getMonth() + 1);
      else d.setDate(d.getDate() + 1);
      return d;
    });
  }, [view]);

  const handleToday = useCallback(() => {
    setCursor(new Date());
  }, []);

  const openAddAt = useCallback((startsAt: Date, endsAt: Date) => {
    setModal({
      mode: 'create',
      initial: {
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        kind: 'custom',
      },
    });
  }, []);

  const openEntry = useCallback((entry: CalendarEntry) => {
    const readonly = entry.source === 'kit_webcal' || entry.source === 'google';
    setModal({
      mode: readonly ? 'view' : 'edit',
      initial: {
        id: entry.id,
        title: entry.title,
        description: entry.description,
        location: entry.location,
        startsAt: entry.startsAt,
        endsAt: entry.endsAt,
        allDay: entry.allDay,
        kind: entry.kind,
        source: entry.source,
      },
    });
  }, []);

  const openQuickAdd = useCallback(() => {
    const now = new Date();
    const start = new Date(now);
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    setModal({
      mode: 'create',
      initial: { startsAt: start.toISOString(), endsAt: end.toISOString(), kind: 'custom' },
    });
  }, []);

  const handleSelectDay = useCallback((day: Date) => {
    setCursor(day);
    setView('day');
  }, []);

  const handleCloseModal = useCallback(() => {
    setModal(null);
  }, []);

  const handleCreate = useCallback(async (input: CreateEntryBody) => {
    try {
      await createMutation.mutateAsync(input);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erstellen fehlgeschlagen');
      throw e;
    }
  }, [createMutation]);

  const handleUpdate = useCallback(async (id: string, input: UpdateEntryBody) => {
    try {
      await updateMutation.mutateAsync({ id, body: input });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Aktualisieren fehlgeschlagen');
      throw e;
    }
  }, [updateMutation]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Löschen fehlgeschlagen');
      throw e;
    }
  }, [deleteMutation]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold font-mono tracking-tight text-white">KALENDER & ZEITBLÖCKE</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-300 uppercase tracking-wider">
              Google & Local Sync
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1 font-sans">
            Google Calendar & KIT synchronisiert • Eigene Zeitblöcke, Deadlines & Fokus-Sessions planen.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-white/[0.08] bg-black/40 p-1">
            {(['week', 'month', 'day'] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all duration-150 ${
                  view === v
                    ? 'bg-white/[0.08] text-white border border-white/[0.12] shadow-sm'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {v === 'week' ? 'Woche' : v === 'month' ? 'Monat' : 'Tag'}
              </button>
            ))}
          </div>
          <button
            onClick={openQuickAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-black transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            Termin
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-[#0D1017]/90 backdrop-blur-xl p-4 flex items-center justify-between shadow-[0_4px_24px_-4px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <button
          onClick={handlePrev}
          className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.14] transition-all flex items-center justify-center shadow-sm"
          aria-label="Zurück"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-mono font-medium rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-all shadow-sm"
          >
            Heute
          </button>
          <div className="text-sm sm:text-base font-semibold text-white text-center min-w-[200px] font-mono tracking-tight">
            {activeRangeLabel}
          </div>
        </div>
        <button
          onClick={handleNext}
          className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.14] transition-all flex items-center justify-center shadow-sm"
          aria-label="Weiter"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {entriesQuery.isError && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {entriesQuery.error instanceof Error
            ? entriesQuery.error.message
            : 'Kalender konnte nicht geladen werden.'}
        </div>
      )}

      {entriesQuery.isLoading ? (
        <div className="card-surface rounded-xl p-12 text-center text-sm text-text-tertiary">
          Lade Kalender…
        </div>
      ) : view === 'week' ? (
        <WeeklyTemplateGrid
          weekStart={weekStart ?? startOfWeek(cursor)}
          entries={entries}
          onAddAt={openAddAt}
          onOpenEntry={openEntry}
        />
      ) : view === 'month' ? (
        <MonthlyGrid
          monthStart={monthStart ?? startOfMonth(cursor)}
          entries={entries}
          onSelectDay={handleSelectDay}
          onOpenEntry={openEntry}
        />
      ) : (
        <DayTimeline
          day={dayStart ?? startOfDay(cursor)}
          entries={entries}
          onAddAt={openAddAt}
          onOpenEntry={openEntry}
        />
      )}

      {modal && (
        <AddEventModal
          isOpen={true}
          mode={modal.mode}
          {...(modal.initial ? { initial: modal.initial } : {})}
          onClose={handleCloseModal}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
