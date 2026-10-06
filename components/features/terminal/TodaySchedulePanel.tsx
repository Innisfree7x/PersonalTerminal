'use client';

import { useState } from 'react';
import { Calendar, Clock, Plus, Trash2, MapPin, ExternalLink } from 'lucide-react';
import type { CalendarEntry } from '@/lib/supabase/calendarEntries';
import { getLocalDateString, formatTimeShort } from '@/lib/utils/date';

interface TodaySchedulePanelProps {
  entries: CalendarEntry[];
  isLoading: boolean;
  googleConnected?: boolean;
  onAddEvent: (event: {
    title: string;
    startsAt: string;
    endsAt: string;
    location?: string | undefined;
    syncWithGoogle: boolean;
  }) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onOpenCalendarView?: (() => void) | undefined;
}

export default function TodaySchedulePanel({
  entries,
  isLoading,
  googleConnected = false,
  onAddEvent,
  onDeleteEvent,
  onOpenCalendarView,
}: TodaySchedulePanelProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [location, setLocation] = useState('');
  const [syncWithGoogle, setSyncWithGoogle] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timezone-safe date for inputs
  const todayStr = getLocalDateString();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const startsAt = new Date(`${todayStr}T${startTime}:00`).toISOString();
      const endsAt = new Date(`${todayStr}T${endTime}:00`).toISOString();

      await onAddEvent({
        title: title.trim(),
        startsAt,
        endsAt,
        location: location.trim() || undefined,
        syncWithGoogle,
      });

      setTitle('');
      setLocation('');
      setShowQuickAdd(false);
    } catch (err) {
      console.error('Failed to create calendar event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatEventTime = (iso: string) => formatTimeShort(iso);

  const isEventNow = (startsAt: string, endsAt: string) => {
    const now = Date.now();
    const start = new Date(startsAt).getTime();
    const end = new Date(endsAt).getTime();
    return now >= start && now <= end;
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/[0.08] bg-[#0D1017]/90 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.06)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 bg-white/[0.015]">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <h2 className="text-xs font-semibold tracking-wider text-white uppercase font-mono">
            Tagesplan & Kalender
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-mono border border-indigo-500/20">
            {entries.length}
          </span>
          {googleConnected && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Google Sync Aktiv
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/90 border border-white/[0.08] hover:border-white/[0.16] transition-all shadow-sm"
          >
            <Plus className="w-3 h-3 text-indigo-400" />
            <span>Time-Block</span>
          </button>
          {onOpenCalendarView && (
            <button
              onClick={onOpenCalendarView}
              title="Vollansicht"
              className="p-1 text-white/40 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Add Form Drawer */}
      {showQuickAdd && (
        <form
          onSubmit={handleSubmit}
          className="p-4 border-b border-white/[0.08] bg-[#0A0D14]/95 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3"
        >
          <div className="text-[11px] font-mono font-medium text-indigo-300 flex items-center justify-between">
            <span>+ Neuer Time-Block (Google 2-Way Sync)</span>
            <span className="text-[10px] text-white/40">Enter zum Blocken</span>
          </div>

          <input
            type="text"
            placeholder="Titel des Termins (z.B. Deep Work, Workout, Meeting)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full text-xs bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400/60 font-mono"
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-mono text-white/40 block mb-1">Startzeit</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs bg-black/40 border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-400/60"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/40 block mb-1">Endzeit</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-xs bg-black/40 border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-400/60"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-1.5 text-xs text-white/70 cursor-pointer font-mono">
              <input
                type="checkbox"
                checked={syncWithGoogle}
                onChange={(e) => setSyncWithGoogle(e.target.checked)}
                className="rounded border-white/20 bg-black/40 text-indigo-500 focus:ring-0"
              />
              <span className="text-[11px]">Mit Google Kalender synct</span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="px-2.5 py-1 text-xs font-mono text-white/40 hover:text-white"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="px-3 py-1 text-xs font-mono font-medium rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 disabled:opacity-40 transition-all shadow"
              >
                {isSubmitting ? 'Speichert...' : 'Blocken'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[470px]">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-white/[0.03]" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-white/40 space-y-2">
            <Clock className="w-8 h-8 opacity-30 text-indigo-400" />
            <p className="text-xs font-mono">
              {googleConnected
                ? 'Google Kalender synchronisiert – keine Termine für heute.'
                : 'Keine Termine mehr für heute eingetragen.'}
            </p>
            <button
              onClick={() => setShowQuickAdd(true)}
              className="text-xs font-mono text-indigo-400 hover:underline pt-1"
            >
              + Time-Block erstellen {googleConnected ? '(inkl. Google Sync)' : ''}
            </button>
          </div>
        ) : (
          entries.map((entry) => {
            const isNow = isEventNow(entry.startsAt, entry.endsAt);
            const isGoogle = entry.source === 'google';

            return (
              <div
                key={entry.id}
                className={`group relative flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 ${
                  isNow
                    ? 'border-indigo-500/40 bg-indigo-500/10 shadow-[0_0_16px_rgba(99,102,241,0.12)]'
                    : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]'
                }`}
              >
                {/* Time Strip */}
                <div className="flex flex-col items-center min-w-[50px] font-mono text-[11px] pt-0.5">
                  <span className={`font-semibold ${isNow ? 'text-indigo-300' : 'text-white/80'}`}>
                    {formatEventTime(entry.startsAt)}
                  </span>
                  <span className="text-[9px] text-white/30">bis</span>
                  <span className="text-white/50">{formatEventTime(entry.endsAt)}</span>
                </div>

                {/* Vertical Divider */}
                <div
                  className={`w-[2px] self-stretch rounded-full ${
                    isNow ? 'bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-white/[0.08]'
                  }`}
                />

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-medium text-white truncate">{entry.title}</h3>
                    {isNow && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 shadow-sm">
                        JETZT
                      </span>
                    )}
                  </div>

                  {entry.location && (
                    <div className="flex items-center gap-1 text-[11px] text-white/40 mt-0.5 truncate font-mono">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{entry.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                        isGoogle
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-white/[0.04] text-white/40 border border-white/[0.06]'
                      }`}
                    >
                      {isGoogle ? 'Google Calendar' : 'Lokal'}
                    </span>
                    {entry.kind && (
                      <span className="text-[9px] font-mono text-white/40 uppercase">
                        {entry.kind}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete / Action Button */}
                <button
                  onClick={() => onDeleteEvent(entry.id)}
                  title="Termin entfernen"
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
