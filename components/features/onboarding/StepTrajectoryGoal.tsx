'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarClock, Flag, Gauge, Timer, ChevronRight, CheckCircle2 } from 'lucide-react';
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
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const categoryOptions: Array<{ value: TrajectoryGoalCategory; label: string }> = [
  { value: 'thesis', label: 'Thesis' },
  { value: 'gmat', label: 'GMAT' },
  { value: 'master_app', label: 'Master App' },
  { value: 'internship', label: 'Internship' },
  { value: 'other', label: 'Other' },
];

const DEFAULT_DUE_DATE = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString().split('T')[0] ?? '';

function monthsToHours(months: number, capacityHoursPerWeek: number): number {
  const normalizedMonths = Math.max(0.25, months);
  const normalizedWeekly = Math.max(1, capacityHoursPerWeek);
  return Math.max(1, Math.round(normalizedMonths * 4.345 * normalizedWeekly));
}

function monthsToWeeks(months: number): number {
  const normalizedMonths = Math.max(0.25, months);
  return Math.max(0, Math.round(normalizedMonths * 4.345));
}

function hoursToMonths(hours: number, capacityHoursPerWeek: number): number {
  const normalizedHours = Math.max(1, hours);
  const normalizedWeekly = Math.max(1, capacityHoursPerWeek);
  return Math.max(0.25, normalizedHours / normalizedWeekly / 4.345);
}

export function StepTrajectoryGoal({
  initialValues,
  existingGoal,
  capacityHoursPerWeek,
  onNext,
}: StepTrajectoryGoalProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [category, setCategory] = useState<TrajectoryGoalCategory>(initialValues?.category ?? 'thesis');
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
    () =>
      effortUnit === 'months'
        ? monthsToHours(effortMonths, capacityHoursPerWeek)
        : Math.max(1, Math.round(effortHours)),
    [effortHours, effortMonths, effortUnit, capacityHoursPerWeek]
  );
  const normalizedBufferWeeks = useMemo(
    () =>
      bufferUnit === 'months'
        ? monthsToWeeks(bufferMonths)
        : Math.max(0, Math.round(bufferWeeks)),
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

  const handleContinueWithExisting = () => {
    if (!existingGoal) return;
    onNext(existingGoal, currentDraft);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!title.trim() || !dueDate) return;
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
        throw new Error(payload?.error?.message || 'Trajectory goal konnte nicht erstellt werden. Bitte erneut versuchen.');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen des Ziels. Bitte erneut versuchen.');
    } finally {
      setSaving(false);
    }
  };

  if (existingGoal && !editExisting) {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-text-primary">Trajectory goal gesetzt</h2>
          <p className="text-sm text-text-secondary">
            Dein Ziel wurde bereits erstellt. Du kannst direkt mit dem Kapazitäts-Plan weitermachen.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-xs text-text-tertiary">Goal</p>
          <p className="mt-1 text-sm font-semibold text-text-primary">{existingGoal.goalDraft.title}</p>
          <p className="mt-1 text-xs text-text-tertiary">
            Due {existingGoal.goalDraft.dueDate} · {existingGoal.goalDraft.effortHours}h · buffer {existingGoal.goalDraft.bufferWeeks}w
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col gap-2">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={handleContinueWithExisting}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Continue to capacity plan
          </Button>
          <button
            type="button"
            onClick={() => setEditExisting(true)}
            className="flex items-center justify-center gap-1 py-1 text-sm text-text-tertiary transition-colors hover:text-text-secondary"
          >
            Create different goal
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
          <Flag className="h-5 w-5 text-primary" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-text-primary">Define your next strategic milestone</h2>
        <p className="text-sm text-text-secondary">
          Set one concrete goal with due date, realistic effort, and a safety buffer.
        </p>
      </motion.div>

      <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">{error}</div>
        ) : null}

        <Input
          label="Goal title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. GMAT 680+ or thesis submission"
          fullWidth
          disabled={saving}
          autoFocus
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-primary">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TrajectoryGoalCategory)}
              disabled={saving}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Due date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            leftIcon={<CalendarClock className="h-3.5 w-3.5" />}
            fullWidth
            disabled={saving}
            required
          />
        </div>

        <div className="rounded-xl border border-border bg-surface-hover p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-text-primary">Effort</p>
            <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
              <button
                type="button"
                onClick={() => setEffortUnit('hours')}
                className={`rounded-md px-2 py-1 text-xs ${effortUnit === 'hours' ? 'bg-primary/15 text-primary' : 'text-text-tertiary'}`}
              >
                hours
              </button>
              <button
                type="button"
                onClick={() => setEffortUnit('months')}
                className={`rounded-md px-2 py-1 text-xs ${effortUnit === 'months' ? 'bg-primary/15 text-primary' : 'text-text-tertiary'}`}
              >
                months
              </button>
            </div>
          </div>

          {effortUnit === 'hours' ? (
            <Input
              type="number"
              min={1}
              max={2000}
              value={effortHours}
              onChange={(e) => setEffortHours(Number(e.target.value || 1))}
              leftIcon={<Gauge className="h-3.5 w-3.5" />}
              fullWidth
              disabled={saving}
            />
          ) : (
            <Input
              type="number"
              min={0.25}
              max={24}
              step={0.25}
              value={effortMonths}
              onChange={(e) => setEffortMonths(Number(e.target.value || 0.25))}
              leftIcon={<Timer className="h-3.5 w-3.5" />}
              fullWidth
              disabled={saving}
            />
          )}

          <p className="mt-2 text-xs text-text-tertiary">
            Preview: {normalizedEffortHours}h (~{hoursToMonths(normalizedEffortHours, capacityHoursPerWeek).toFixed(1)} months at {capacityHoursPerWeek}h/week)
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface-hover p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-text-primary">Safety buffer</p>
            <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
              <button
                type="button"
                onClick={() => setBufferUnit('weeks')}
                className={`rounded-md px-2 py-1 text-xs ${bufferUnit === 'weeks' ? 'bg-primary/15 text-primary' : 'text-text-tertiary'}`}
              >
                weeks
              </button>
              <button
                type="button"
                onClick={() => setBufferUnit('months')}
                className={`rounded-md px-2 py-1 text-xs ${bufferUnit === 'months' ? 'bg-primary/15 text-primary' : 'text-text-tertiary'}`}
              >
                months
              </button>
            </div>
          </div>

          {bufferUnit === 'weeks' ? (
            <Input
              type="number"
              min={0}
              max={16}
              value={bufferWeeks}
              onChange={(e) => setBufferWeeks(Number(e.target.value || 0))}
              fullWidth
              disabled={saving}
            />
          ) : (
            <Input
              type="number"
              min={0}
              max={6}
              step={0.25}
              value={bufferMonths}
              onChange={(e) => setBufferMonths(Number(e.target.value || 0))}
              fullWidth
              disabled={saving}
            />
          )}

          <p className="mt-2 text-xs text-text-tertiary">
            Preview: {normalizedBufferWeeks} weeks buffer
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-primary">Priority ({priority}/5)</span>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            disabled={saving}
            className="accent-primary"
          />
        </label>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          loading={saving}
          disabled={saving || !title.trim() || !dueDate}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Create goal & continue
        </Button>
      </motion.form>
    </motion.div>
  );
}
