'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckSquare,
  Calendar,
  FileText,
  Clock,
  Send,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

export type CaptureMode = 'task' | 'calendar' | 'idea';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: CaptureMode;
}

export default function QuickCaptureModal({
  isOpen,
  onClose,
  defaultMode = 'task',
}: QuickCaptureModalProps) {
  const [mode, setMode] = useState<CaptureMode>(defaultMode);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'startup' | 'strategy' | 'health' | 'admin'>('startup');
  const [timeEstimate, setTimeEstimate] = useState<number>(30);
  const [syncGoogle, setSyncGoogle] = useState(true);
  const [calendarStartTime, setCalendarStartTime] = useState('');
  const [calendarDuration, setCalendarDuration] = useState<number>(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Synchronize default mode when opened
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setTitle('');
      // Set default start time to next full half-hour
      const now = new Date();
      now.setMinutes(now.getMinutes() + 15);
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = now.getMinutes() >= 30 ? '30' : '00';
      setCalendarStartTime(`${hours}:${minutes}`);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, defaultMode]);

  // Global escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = title.trim();
    if (!text) {
      toast.error('Bitte Titel oder Notiz eingeben');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'task') {
        const { getLocalDateString } = await import('@/lib/utils/date');
        const todayStr = getLocalDateString();
        const categoryTag =
          category === 'startup'
            ? '[Startup]'
            : category === 'health'
            ? '[Health/Weight]'
            : category === 'strategy'
            ? '[Strategie]'
            : '[Admin]';
        const formattedTitle = `${categoryTag} ${text}`;

        const res = await fetch('/api/daily-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: todayStr,
            title: formattedTitle,
            timeEstimate,
            source: 'quick_capture',
          }),
        });

        if (!res.ok) throw new Error('Task konnte nicht erstellt werden');
        toast.success('Task zum Terminal hinzugefügt!');
        window.dispatchEvent(new CustomEvent('terminal:task-added'));
      } else if (mode === 'calendar') {
        const today = new Date();
        const [h, m] = calendarStartTime.split(':').map(Number);
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h ?? 9, m ?? 0, 0);
        const end = new Date(start.getTime() + calendarDuration * 60 * 1000);

        const res = await fetch('/api/calendar/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: text,
            startsAt: start.toISOString(),
            endsAt: end.toISOString(),
            kind: category === 'startup' ? 'exercise' : category === 'strategy' ? 'tutorial' : 'personal',
            syncWithGoogle: syncGoogle,
          }),
        });

        if (!res.ok) throw new Error('Kalender-Eintrag fehlgeschlagen');
        toast.success(
          syncGoogle
            ? 'Zeitblock erstellt & mit Google Kalender synchronisiert!'
            : 'Zeitblock im Terminal erstellt!'
        );
        window.dispatchEvent(new CustomEvent('terminal:calendar-added'));
      } else if (mode === 'idea') {
        const key = 'terminal:scratchpad:v1';
        const existing = localStorage.getItem(key) || '';
        const timestamp = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        const tag = `#${category}`;
        const newEntry = `\n- [${timestamp}] ${tag} ${text}`;
        localStorage.setItem(key, existing + newEntry);
        window.dispatchEvent(new Event('storage'));
        toast.success('Idee ins Scratchpad gespeichert!');
      }

      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0B0F19] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Mode Tabs */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 bg-white/[0.02]">
          <div className="flex items-center gap-1.5 bg-white/5 rounded-xl p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setMode('task')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                mode === 'task'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>[1] Aufgabe</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                mode === 'calendar'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>[2] Zeitblock</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('idea')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                mode === 'idea'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>[3] Scratchpad</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-white/40 flex items-center justify-between">
              <span>
                {mode === 'task'
                  ? 'Aufgabe für heute erfassen'
                  : mode === 'calendar'
                  ? 'Termin / Deep Work Block'
                  : 'Gedanke oder Strategie-Notiz'}
              </span>
              <span className="text-[10px] text-white/30">Enter zum Speichern</span>
            </label>

            {mode === 'idea' ? (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                rows={3}
                placeholder="Strategie, 10kg Gewichtszunahme, Startup-Idee oder Gedanke..."
                className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 resize-none font-mono"
              />
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  mode === 'task'
                    ? 'z.B. Landing Page Hero fertigstellen, Pitch Deck prüfen...'
                    : 'z.B. 90m Deep Work: MVP Backend'
                }
                className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 font-mono"
              />
            )}
          </div>

          {/* Strategic Tag Selector */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-white/40 block">Strategische Zuordnung</span>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setCategory('startup')}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  category === 'startup'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                    : 'bg-white/[0.02] border-white/10 text-white/50 hover:text-white'
                }`}
              >
                🚀 Startup
              </button>
              <button
                type="button"
                onClick={() => setCategory('strategy')}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  category === 'strategy'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                    : 'bg-white/[0.02] border-white/10 text-white/50 hover:text-white'
                }`}
              >
                🎯 Strategie
              </button>
              <button
                type="button"
                onClick={() => setCategory('health')}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  category === 'health'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                    : 'bg-white/[0.02] border-white/10 text-white/50 hover:text-white'
                }`}
              >
                💪 Health & 10kg
              </button>
              <button
                type="button"
                onClick={() => setCategory('admin')}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  category === 'admin'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-semibold'
                    : 'bg-white/[0.02] border-white/10 text-white/50 hover:text-white'
                }`}
              >
                📋 Admin / Uni
              </button>
            </div>
          </div>

          {/* Mode Specific Extra Settings */}
          {mode === 'task' && (
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[11px] font-mono text-white/40 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Dauer:
              </span>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                {[15, 30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setTimeEstimate(mins)}
                    className={`px-2 py-0.5 rounded text-[11px] border transition-all ${
                      timeEstimate === mins
                        ? 'bg-white/15 text-white border-white/30 font-semibold'
                        : 'bg-white/5 text-white/40 border-white/5 hover:text-white'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'calendar' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 bg-white/[0.02] p-3 rounded-xl border border-white/5">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-white/40 uppercase">Startzeit</label>
                <input
                  type="time"
                  value={calendarStartTime}
                  onChange={(e) => setCalendarStartTime(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-white/40 uppercase">Dauer</label>
                <select
                  value={calendarDuration}
                  onChange={(e) => setCalendarDuration(Number(e.target.value))}
                  className="w-full rounded-lg bg-[#0F1422] border border-white/10 px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500/40"
                >
                  <option value={30}>30 Minuten</option>
                  <option value={45}>45 Minuten</option>
                  <option value={60}>60 Minuten</option>
                  <option value={90}>90 Minuten (Deep Work)</option>
                  <option value={120}>120 Minuten</option>
                </select>
              </div>

              <div className="sm:col-span-2 pt-1 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-white/70">
                  <input
                    type="checkbox"
                    checked={syncGoogle}
                    onChange={(e) => setSyncGoogle(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-0"
                  />
                  <span>Automatisch in Google Kalender synchronisieren</span>
                </label>
                <span className="text-[10px] font-mono text-emerald-400">2-Way Live Sync</span>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <div className="text-[11px] font-mono text-white/40 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>Tastaturkürzel: <kbd className="px-1 py-0.5 rounded bg-white/10 text-white/80">Esc</kbd> Schließen</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                Abbrechen
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-semibold text-xs font-mono shadow-lg transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <span>Speichert...</span>
                ) : (
                  <>
                    <span>Erfassen</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
