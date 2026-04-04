'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarClock, CheckCircle2, Flag, Gauge, Layers3, Timer, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { trackOnboardingEvent } from '@/app/onboarding/analytics';

export type TrajectoryGoalCategory = 'thesis' | 'gmat' | 'master_app' | 'internship' | 'other';

export interface TrajectoryGoalDraft {
  title: string;
  category: TrajectoryGoalCategory;
  dueDate: string;
  effortUnit: 'hours' | 'months';
  effortHours: number;
  effortMonths: number;
  bufferUnit: 'weeks' | 'months';
  bufferWeeks: number;
  bufferMonths: number;
  priority: number;
}

export interface NormalizedTrajectoryGoal {
  title: string;
  category: TrajectoryGoalCategory;
  dueDate: string;
  effortHours: number;
  bufferWeeks: number;
  priority: number;
  status: 'active';
}

export interface TrajectoryGoalPersisted {
  goalId: string;
  goalDraft: NormalizedTrajectoryGoal;
}

interface StepTrajectoryGoalProps {
  initialValues?: TrajectoryGoalDraft | null;
  existingGoal?: TrajectoryGoalPersisted | null;
  capacityHoursPerWeek: number;
  onNext: (goal: TrajectoryGoalPersisted, draft: TrajectoryGoalDraft) => void;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const categoryOptions: Array<{ value: TrajectoryGoalCategory; label: string; helper: string }> = [
  { value: 'internship', label: 'Praktikum', helper: 'Bewerbungsfenster, Cases, Outreach' },
  { value: 'master_app', label: 'Master', helper: 'Apps, GMAT, Unterlagen' },
  { value: 'thesis', label: 'Thesis', helper: 'Abgabe, Schreibphase, Puffer' },
  { value: 'gmat', label: 'GMAT', helper: 'Prep-Sprints, Testtermine' },
  { value: 'other', label: 'Sonstiges', helper: 'Eigener strategischer Meilenstein' },
];

function buildDefaultDueDate(): string {
  return new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString().split('T')[0] ?? '';
}

function buildMinimumDueDate(): string {
  return new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString().split('T')[0] ?? '';
}

const DEFAULT_DUE_DATE = buildDefaultDueDate();
const MIN_DUE_DATE = buildMinimumDueDate();

function monthsToHours(months: number, capacityHoursPerWeek: number): number {
  const normalizedMonths = Math.max(0.25, months);
  const normalizedWeekly = Math.max(1, capacityHoursPerWeek);
  return Math.max(1, Math.round(normalizedMonths * 4.345 * normalizedWeekly));
}

function monthsToWeeks(months: number): number {
  return Math.max(0, Math.round(Math.max(0.25, months) * 4.345));
}

function formatCategoryLabel(category: TrajectoryGoalCategory): string {
  return categoryOptions.find((option) => option.value === category)?.label ?? 'Ziel';
}

export function StepTrajectoryGoal({
  initialValues,
  existingGoal,
  capacityHoursPerWeek,
  onNext,
}: StepTrajectoryGoalProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [category, setCategory] = useState<TrajectoryGoalCategory>(initialValues?.category ?? 'internship');
  const [dueDate, setDueDate] = useState(initialValues?.dueDate ?? DEFAULT_DUE_DATE);
  const [effortUnit, setEffortUnit] = useState<'hours' | 'months'>(initialValues?.effortUnit ?? 'months');
  const [effortHours, setEffortHours] = useState(initialValues?.effortHours ?? 120);
  const [effortMonths, setEffortMonths] = useState(initialValues?.effortMonths ?? 3);
  const [bufferUnit, setBufferUnit] = useState<'weeks' | 'months'>(initialValues?.bufferUnit ?? 'months');
  const [bufferWeeks, setBufferWeeks] = useState(initialValues?.bufferWeeks ?? 2);
  const [bufferMonths, setBufferMonths] = useState(initialValues?.bufferMonths ?? 0.5);
  const [priority, setPriority] = useState(initialValues?.priority ?? 3);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editExisting, setEditExisting] = useState(false);

  const normalizedEffortHours = useMemo(
    () => (effortUnit === 'months' ? monthsToHours(effortMonths, capacityHoursPerWeek) : Math.max(1, Math.round(effortHours))),
    [capacityHoursPerWeek, effortHours, effortMonths, effortUnit]
  );

  const normalizedBufferWeeks = useMemo(
    () => (bufferUnit === 'months' ? monthsToWeeks(bufferMonths) : Math.max(0, Math.round(bufferWeeks))),
    [bufferMonths, bufferUnit, bufferWeeks]
  );

  const currentDraft: TrajectoryGoalDraft = {
    title,
    category,
    dueDate,
    effortUnit,
    effortHours,
    effortMonths,
    bufferUnit,
    bufferWeeks,
    bufferMonths,
    priority,
  };

  const heroStats = [
    { label: 'Kategorie', value: formatCategoryLabel(category), icon: Layers3 },
    { label: 'Planungsaufwand', value: `${normalizedEffortHours}h`, icon: Gauge },
    { label: 'Sicherheitspuffer', value: `${normalizedBufferWeeks} Wochen`, icon: Timer },
  ];

  const handleContinueWithExisting = () => {
    if (!existingGoal) return;
    onNext(existingGoal, currentDraft);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;

    if (!title.trim() || !dueDate) {
      setError('Bitte gib ein Ziel und ein Datum an.');
      return;
    }

    setError('');
    setSaving(true);

    try {
      const normalizedGoal: NormalizedTrajectoryGoal = {
        title: title.trim(),
        category,
        dueDate,
        effortHours: normalizedEffortHours,
        bufferWeeks: normalizedBufferWeeks,
        priority: Math.min(5, Math.max(1, Math.round(priority))),
        status: 'active',
      };

      const response = await fetch('/api/trajectory/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedGoal),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error?.message || 'Das Ziel konnte nicht erstellt werden. Bitte erneut versuchen.');
      }

      const created = (await response.json()) as { id: string };
      trackOnboardingEvent('trajectory_goal_created', { category, priority: normalizedGoal.priority });

      onNext(
        {
          goalId: created.id,
          goalDraft: normalizedGoal,
        },
        currentDraft
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Fehler beim Erstellen des Ziels.');
    } finally {
      setSaving(false);
    }
  };

  if (existingGoal && !editExisting) {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#8F8577]">Dein Ziel</p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#FAF0E6]">Dein primärer Trajectory-Block steht bereits.</h1>
            <p className="max-w-[42rem] text-sm leading-6 text-[#C5B9A8]">
              Wir können direkt mit deiner aktuellen Kapazität weiterarbeiten oder du legst ein neues Leit-Ziel an.
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/[0.07] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#8F8577]">Aktives Ziel</p>
              <p className="mt-2 text-lg font-semibold text-[#FAF0E6]">{existingGoal.goalDraft.title}</p>
              <p className="mt-1 text-sm text-[#C5B9A8]">
                Fällig am {existingGoal.goalDraft.dueDate} · {existingGoal.goalDraft.effortHours}h Aufwand · {existingGoal.goalDraft.bufferWeeks} Wochen Puffer
              </p>
            </div>
            <span className="rounded-full border border-emerald-500/20 bg-[#0F0E13] px-3 py-1 text-xs font-semibold text-emerald-300">
              aktiv
            </span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col gap-2">
          <Button variant="primary" fullWidth size="lg" onClick={handleContinueWithExisting} rightIcon={<ArrowRight className="h-4 w-4" />}>
            Mit diesem Ziel weiter
          </Button>
          <button
            type="button"
            onClick={() => setEditExisting(true)}
            className="flex items-center justify-center gap-1 py-1 text-sm text-[#A89D8F] transition-colors hover:text-[#FAF0E6]"
          >
            Neues Ziel anlegen
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E8B930]/25 bg-[#E8B930]/10 text-[#F5D565]">
          <Flag className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#8F8577]">Kapitel 1 · Dein Ziel</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#FAF0E6]">Was willst du als Nächstes wirklich erreichen?</h1>
          <p className="max-w-[42rem] text-sm leading-6 text-[#C5B9A8]">
            Definiere einen primären Meilenstein. INNIS plant danach rückwärts und zeigt dir sofort, ob dein Vorhaben realistisch ist.
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-3 sm:grid-cols-3">
        {heroStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl border border-white/[0.07] bg-[#0F0E13] p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#8F8577]">
                <Icon className="h-3.5 w-3.5" />
                {stat.label}
              </div>
              <p className="mt-3 text-lg font-semibold text-[#FAF0E6]">{stat.value}</p>
            </div>
          );
        })}
      </motion.div>

      <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-4">
        {error ? <div className="rounded-2xl border border-[#DC3232]/30 bg-[#DC3232]/10 p-3 text-sm text-[#F5B0B0]">{error}</div> : null}

        <Input
          label="Ziel"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="z. B. GMAT 680+, Bachelorarbeit abgeben oder PE-Praktikum"
          fullWidth
          disabled={saving}
          autoFocus
          required
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[#FAF0E6]">Kategorie</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as TrajectoryGoalCategory)}
              disabled={saving}
              className="h-11 rounded-xl border border-white/[0.08] bg-[#0F0E13] px-3 text-sm text-[#FAF0E6] outline-none transition focus:border-[#E8B930]/50 focus:ring-2 focus:ring-[#E8B930]/20"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-[#8F8577]">{categoryOptions.find((option) => option.value === category)?.helper}</span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[#FAF0E6]">Deadline</span>
            <div className="relative">
              <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F8577]" />
              <input
                type="date"
                min={MIN_DUE_DATE}
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                disabled={saving}
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#0F0E13] pl-10 pr-3 text-sm text-[#FAF0E6] outline-none transition focus:border-[#E8B930]/50 focus:ring-2 focus:ring-[#E8B930]/20"
              />
            </div>
            <span className="text-xs text-[#8F8577]">Mindestens drei Monate Vorlauf, damit die Planung Sinn macht.</span>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px]">
          <div className="space-y-2 rounded-2xl border border-white/[0.07] bg-[#0F0E13] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#FAF0E6]">Aufwand</span>
              <div className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.02] p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setEffortUnit('months')}
                  className={`rounded-full px-2.5 py-1 ${effortUnit === 'months' ? 'bg-[#E8B930] text-[#08080c]' : 'text-[#A89D8F]'}`}
                >
                  Monate
                </button>
                <button
                  type="button"
                  onClick={() => setEffortUnit('hours')}
                  className={`rounded-full px-2.5 py-1 ${effortUnit === 'hours' ? 'bg-[#E8B930] text-[#08080c]' : 'text-[#A89D8F]'}`}
                >
                  Stunden
                </button>
              </div>
            </div>
            {effortUnit === 'months' ? (
              <Input
                type="number"
                min={0.25}
                step={0.25}
                label="Effort (Monate)"
                value={String(effortMonths)}
                onChange={(event) => setEffortMonths(Number(event.target.value || 0.25))}
                disabled={saving}
                fullWidth
              />
            ) : (
              <Input
                type="number"
                min={1}
                step={1}
                label="Effort (Stunden)"
                value={String(effortHours)}
                onChange={(event) => setEffortHours(Number(event.target.value || 1))}
                disabled={saving}
                fullWidth
              />
            )}
          </div>

          <div className="space-y-2 rounded-2xl border border-white/[0.07] bg-[#0F0E13] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#FAF0E6]">Puffer</span>
              <div className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.02] p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setBufferUnit('months')}
                  className={`rounded-full px-2.5 py-1 ${bufferUnit === 'months' ? 'bg-[#E8B930] text-[#08080c]' : 'text-[#A89D8F]'}`}
                >
                  Monate
                </button>
                <button
                  type="button"
                  onClick={() => setBufferUnit('weeks')}
                  className={`rounded-full px-2.5 py-1 ${bufferUnit === 'weeks' ? 'bg-[#E8B930] text-[#08080c]' : 'text-[#A89D8F]'}`}
                >
                  Wochen
                </button>
              </div>
            </div>
            {bufferUnit === 'months' ? (
              <Input
                type="number"
                min={0.25}
                step={0.25}
                label="Buffer (Monate)"
                value={String(bufferMonths)}
                onChange={(event) => setBufferMonths(Number(event.target.value || 0.25))}
                disabled={saving}
                fullWidth
              />
            ) : (
              <Input
                type="number"
                min={0}
                step={1}
                label="Buffer (Wochen)"
                value={String(bufferWeeks)}
                onChange={(event) => setBufferWeeks(Number(event.target.value || 0))}
                disabled={saving}
                fullWidth
              />
            )}
          </div>

          <div className="space-y-2 rounded-2xl border border-white/[0.07] bg-[#0F0E13] p-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[#FAF0E6]">Priorität</span>
              <Input
                type="number"
                min={1}
                max={5}
                step={1}
                label="Priorität (1-5)"
                value={String(priority)}
                onChange={(event) => setPriority(Number(event.target.value || 3))}
                disabled={saving}
                fullWidth
              />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E8B930]/20 bg-[#E8B930]/[0.08] px-4 py-3 text-sm text-[#F5D565]">
          {effortUnit === 'months'
            ? `${effortMonths} Monate bei ${capacityHoursPerWeek}h/Woche entsprechen ungefähr ${normalizedEffortHours} Planungsstunden.`
            : `${normalizedEffortHours} Stunden sind bei ${capacityHoursPerWeek}h/Woche ungefähr ${(normalizedEffortHours / capacityHoursPerWeek / 4.345).toFixed(1)} Monate Fokuszeit.`}
        </div>

        <Button type="submit" variant="primary" fullWidth size="lg" loading={saving} disabled={saving} rightIcon={<ArrowRight className="h-4 w-4" />}>
          Ziel speichern und weiter
        </Button>
      </motion.form>
    </motion.div>
  );
}
