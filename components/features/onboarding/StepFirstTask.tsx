'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowRight, ClipboardList, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { trackOnboardingEvent } from '@/app/onboarding/analytics';

export interface TaskFormValues {
  title: string;
  timeEstimate: string;
}

interface TaskResult {
  title: string;
}

interface StepFirstTaskProps {
  initialValues?: TaskFormValues | null;
  alreadyCreated?: TaskResult | null;
  onNext: (task: TaskResult | null, draft: TaskFormValues) => void;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const SUGGESTIONS = [
  'Vorlesung nacharbeiten',
  'Übungsblatt beginnen',
  'E-Mails beantworten',
  'Lernplan erstellen',
];

export function StepFirstTask({ initialValues, alreadyCreated, onNext }: StepFirstTaskProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [timeEstimate, setTimeEstimate] = useState(initialValues?.timeEstimate ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0] ?? new Date().toISOString().slice(0, 10);
  const currentDraft: TaskFormValues = { title, timeEstimate };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/daily-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          date: today,
          source: 'manual',
          ...(timeEstimate.trim() ? { timeEstimate: timeEstimate.trim() } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Fehler beim Erstellen');
      }
      trackOnboardingEvent('first_task_created', { source: 'onboarding' });
      onNext({ title: title.trim() }, currentDraft);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen');
    } finally {
      setSaving(false);
    }
  };

  // Already created — readonly confirmation state
  if (alreadyCreated) {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
            <ClipboardList className="w-5 h-5 text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Erste Aufgabe für heute</h2>
        </motion.div>
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-text-tertiary">Aufgabe angelegt</p>
              <p className="text-sm font-semibold text-text-primary">{alreadyCreated.title}</p>
            </div>
          </div>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => onNext(null, currentDraft)}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Weiter
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
          <ClipboardList className="w-5 h-5 text-violet-400" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Erste Aufgabe für heute</h2>
        <p className="text-text-secondary text-sm">
          Was willst du heute erledigen? Eine konkrete Aufgabe gibt dir sofort einen Fokus.
        </p>
      </motion.div>

      <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
            {error}
          </div>
        ) : null}

        <Input
          label="Aufgabe"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="z.B. Übungsblatt 8 lösen"
          disabled={saving}
          fullWidth
          autoFocus
          required
        />

        <Input
          label="Zeitschätzung (optional)"
          value={timeEstimate}
          onChange={(e) => setTimeEstimate(e.target.value)}
          placeholder="z.B. 2h, 30m"
          disabled={saving}
          fullWidth
          leftIcon={<Clock className="w-3.5 h-3.5" />}
        />

        {/* Quick suggestions */}
        {!title && (
          <div>
            <p className="text-xs text-text-tertiary mb-2">Vorschläge:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTitle(s)}
                  disabled={saving}
                  className="px-2.5 py-1 rounded-lg text-xs border border-border bg-surface-hover text-text-secondary hover:border-primary hover:text-primary transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            loading={saving}
            disabled={saving || !title.trim()}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Aufgabe anlegen & weiter
          </Button>
          <button
            type="button"
            onClick={() => onNext(null, currentDraft)}
            disabled={saving}
            className="text-sm text-text-tertiary hover:text-text-secondary transition-colors flex items-center justify-center gap-1 py-1"
          >
            Später hinzufügen
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
