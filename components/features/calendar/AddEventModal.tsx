'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import type { CalendarEntry, CalendarEntryKind } from '@/lib/supabase/calendarEntries';

export interface AddEventModalProps {
  isOpen: boolean;
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
  onClose: () => void;
  onCreate: (input: {
    title: string;
    description?: string | null;
    location?: string | null;
    startsAt: string;
    endsAt: string;
    allDay?: boolean;
    kind?: CalendarEntryKind;
  }) => Promise<void> | void;
  onUpdate: (
    id: string,
    input: {
      title?: string;
      description?: string | null;
      location?: string | null;
      startsAt?: string;
      endsAt?: string;
      allDay?: boolean;
      kind?: CalendarEntryKind;
    }
  ) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
}

const KIND_OPTIONS: { value: CalendarEntryKind; label: string }[] = [
  { value: 'lecture',   label: 'Vorlesung' },
  { value: 'exercise',  label: 'Übung' },
  { value: 'tutorial',  label: 'Tutorium' },
  { value: 'exam',      label: 'Prüfung' },
  { value: 'interview', label: 'Interview' },
  { value: 'meeting',   label: 'Meeting' },
  { value: 'deadline',  label: 'Deadline' },
  { value: 'personal',  label: 'Persönlich' },
  { value: 'custom',    label: 'Sonstiges' },
];

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string {
  return new Date(value).toISOString();
}

export default function AddEventModal({
  isOpen,
  mode,
  initial,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: AddEventModalProps) {
  const prevOpenRef = useRef(false);
  const readonly = mode === 'view' || initial?.source === 'kit_webcal' || initial?.source === 'google';
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [startsAt, setStartsAt] = useState(initial ? toDatetimeLocal(initial.startsAt) : '');
  const [endsAt, setEndsAt] = useState(initial ? toDatetimeLocal(initial.endsAt) : '');
  const [allDay, setAllDay] = useState(initial?.allDay ?? false);
  const [kind, setKind] = useState<CalendarEntryKind>(initial?.kind ?? 'custom');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setTitle(initial?.title ?? '');
      setDescription(initial?.description ?? '');
      setLocation(initial?.location ?? '');
      setStartsAt(initial ? toDatetimeLocal(initial.startsAt) : '');
      setEndsAt(initial ? toDatetimeLocal(initial.endsAt) : '');
      setAllDay(initial?.allDay ?? false);
      setKind(initial?.kind ?? 'custom');
      setError(null);
      setSubmitting(false);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, initial]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (readonly) return;
    setError(null);

    if (!title.trim()) {
      setError('Titel darf nicht leer sein');
      return;
    }
    if (!startsAt || !endsAt) {
      setError('Start- und Endzeit sind erforderlich');
      return;
    }
    const startIso = fromDatetimeLocal(startsAt);
    const endIso = fromDatetimeLocal(endsAt);
    if (new Date(endIso) < new Date(startIso)) {
      setError('Ende muss nach dem Start liegen');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'edit' && initial?.id) {
        await onUpdate(initial.id, {
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          startsAt: startIso,
          endsAt: endIso,
          allDay,
          kind,
        });
      } else {
        await onCreate({
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          startsAt: startIso,
          endsAt: endIso,
          allDay,
          kind,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!initial?.id || !onDelete) return;
    setSubmitting(true);
    try {
      await onDelete(initial.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen');
    } finally {
      setSubmitting(false);
    }
  }

  const heading =
    mode === 'view' || readonly
      ? 'Eintrag (schreibgeschützt)'
      : mode === 'edit'
        ? 'Eintrag bearbeiten'
        : 'Neuer Eintrag';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-event-modal-title"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-lg bg-surface/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between p-5 border-b border-border">
                <div className="flex items-center gap-2">
                  {readonly && <Lock className="w-4 h-4 text-text-tertiary" />}
                  <h2 id="add-event-modal-title" className="text-lg font-semibold text-text-primary">
                    {heading}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-all"
                  aria-label="Schließen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {readonly && (
                  <div className="rounded-md border border-border bg-surface-hover/40 px-3 py-2 text-xs text-text-secondary">
                    KIT-Events werden aus dem WebCal synchronisiert und können hier nicht geändert werden.
                  </div>
                )}

                {error && (
                  <div className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-xs text-error">
                    {error}
                  </div>
                )}

                <Input
                  label="Titel"
                  placeholder="z. B. Interview Startup"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={readonly || submitting}
                  fullWidth
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-primary">Typ</label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as CalendarEntryKind)}
                    disabled={readonly || submitting}
                    className="bg-surface border border-border rounded-md h-10 px-3 text-sm text-text-primary disabled:opacity-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {KIND_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-primary">Start</label>
                    <input
                      type="datetime-local"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      disabled={readonly || submitting}
                      className="bg-surface border border-border rounded-md h-10 px-3 text-sm text-text-primary disabled:opacity-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-primary">Ende</label>
                    <input
                      type="datetime-local"
                      value={endsAt}
                      onChange={(e) => setEndsAt(e.target.value)}
                      disabled={readonly || submitting}
                      className="bg-surface border border-border rounded-md h-10 px-3 text-sm text-text-primary disabled:opacity-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allDay}
                    onChange={(e) => setAllDay(e.target.checked)}
                    disabled={readonly || submitting}
                    className="accent-primary"
                  />
                  Ganztägig
                </label>

                <Input
                  label="Ort (optional)"
                  placeholder="z. B. Audimax, Gebäude 30.95"
                  value={location ?? ''}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={readonly || submitting}
                  fullWidth
                />

                <Textarea
                  label="Notizen (optional)"
                  placeholder="Vorbereitung, Personen, Links…"
                  value={description ?? ''}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={readonly || submitting}
                  fullWidth
                  rows={3}
                />

                <div className="flex items-center justify-between pt-2">
                  <div>
                    {mode === 'edit' && !readonly && initial?.id && onDelete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        disabled={submitting}
                        leftIcon={<Trash2 className="w-4 h-4" />}
                      >
                        Löschen
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
                      {readonly ? 'Schließen' : 'Abbrechen'}
                    </Button>
                    {!readonly && (
                      <Button type="submit" variant="primary" size="sm" loading={submitting} disabled={submitting}>
                        {mode === 'edit' ? 'Speichern' : 'Erstellen'}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
