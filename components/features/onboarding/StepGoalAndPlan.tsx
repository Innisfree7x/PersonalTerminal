'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { trackOnboardingEvent } from '@/app/onboarding/analytics';
import { useAppSound } from '@/lib/hooks/useAppSound';
import {
  formatTrajectoryRiskLabel,
  getDaysUntilDate,
  simulateTrajectoryGoalPreview,
} from '@/lib/trajectory/risk-model';

export type TrajectoryGoalCategory = 'thesis' | 'gmat' | 'master_app' | 'internship' | 'other';

export interface TrajectoryGoalDraft {
  title: string;
  category: TrajectoryGoalCategory;
  dueDate: string;
  effortHours: number;
  bufferWeeks: number;
  capacityHoursPerWeek: number;
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

export interface TrajectorySettingsDraft {
  hoursPerWeek: number;
  horizonMonths: number;
}

export interface TrajectoryPlanSummary {
  status: 'on_track' | 'tight' | 'at_risk';
  startDate: string;
  explanation: string;
  effectiveCapacityHoursPerWeek: number;
}

interface StepGoalAndPlanProps {
  initialDraft?: TrajectoryGoalDraft | null;
  existingGoal?: TrajectoryGoalPersisted | null;
  initialSettings?: TrajectorySettingsDraft | null;
  onNext: (
    goal: TrajectoryGoalPersisted,
    draft: TrajectoryGoalDraft,
    settings: TrajectorySettingsDraft,
    plan: TrajectoryPlanSummary
  ) => void;
}

interface TrajectoryPlanResponse {
  simulation: {
    effectiveCapacityHoursPerWeek: number;
  };
  computed: {
    generatedBlocks: Array<{
      goalId: string;
      status: 'on_track' | 'tight' | 'at_risk';
      startDate: string;
      reasons: string[];
    }>;
    summary: {
      onTrack: number;
      tight: number;
      atRisk: number;
    };
  };
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const categoryOptions: Array<{ value: TrajectoryGoalCategory; label: string; emoji: string }> = [
  { value: 'thesis', label: 'Thesis', emoji: '📝' },
  { value: 'gmat', label: 'GMAT', emoji: '📊' },
  { value: 'master_app', label: 'Master App', emoji: '🎓' },
  { value: 'internship', label: 'Praktikum', emoji: '💼' },
  { value: 'other', label: 'Anderes', emoji: '🎯' },
];

const DEFAULT_DUE_DATE = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString().split('T')[0] ?? '';

function reasonToSentence(reason: string): string {
  if (reason === 'required_start_in_past') return 'Startdatum liegt bereits in der Vergangenheit.';
  if (reason === 'collision_above_50pct') return 'Hohe Überlappung mit anderen geplanten Blöcken.';
  if (reason === 'collision_above_25pct') return 'Moderate Überlappung erkannt.';
  return 'Trajectory mit deterministischen Planungsregeln berechnet.';
}

export function StepGoalAndPlan({
  initialDraft,
  existingGoal,
  initialSettings,
  onNext,
}: StepGoalAndPlanProps) {
  const { play } = useAppSound();

  // Goal fields
  const [title, setTitle] = useState(initialDraft?.title ?? '');
  const [category, setCategory] = useState<TrajectoryGoalCategory>(initialDraft?.category ?? 'thesis');
  const [dueDate, setDueDate] = useState(initialDraft?.dueDate ?? DEFAULT_DUE_DATE);
  const [effortHours, setEffortHours] = useState(initialDraft?.effortHours ?? 300);
  const [bufferWeeks, setBufferWeeks] = useState(initialDraft?.bufferWeeks ?? 2);

  // Capacity
  const [capacityHoursPerWeek, setCapacityHoursPerWeek] = useState(
    initialDraft?.capacityHoursPerWeek ?? initialSettings?.hoursPerWeek ?? 15
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Live risk preview (client-side only, no API)
  const preview = useMemo(
    () =>
      simulateTrajectoryGoalPreview({
        dueDate,
        effortHours,
        bufferWeeks,
        capacityHoursPerWeek,
      }),
    [dueDate, effortHours, bufferWeeks, capacityHoursPerWeek]
  );

  const dueDays = useMemo(() => getDaysUntilDate(dueDate), [dueDate]);

  const prepStartLabel = useMemo(() => {
    const parsed = new Date(`${preview.startDate}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) return preview.startDate;
    return parsed.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }, [preview.startDate]);

  const statusColor =
    preview.status === 'on_track'
      ? { border: 'border-emerald-500/25', bg: 'bg-emerald-500/8', text: 'text-emerald-400', dot: 'bg-emerald-400' }
      : preview.status === 'tight'
        ? { border: 'border-[#E8B930]/25', bg: 'bg-[#E8B930]/8', text: 'text-[#E8B930]', dot: 'bg-[#E8B930]' }
        : { border: 'border-red-500/25', bg: 'bg-red-500/8', text: 'text-red-400', dot: 'bg-red-400' };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!title.trim() || !dueDate) return;
    setError('');
    setSaving(true);

    try {
      // 1. Create or reuse goal
      let goalId = existingGoal?.goalId ?? '';
      const normalizedGoal: NormalizedTrajectoryGoal = {
        title: title.trim(),
        category,
        dueDate,
        effortHours: Math.max(1, Math.round(effortHours)),
        bufferWeeks: Math.max(0, Math.round(bufferWeeks)),
        priority: 3,
        status: 'active',
      };

      if (!goalId) {
        const goalRes = await fetch('/api/trajectory/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(normalizedGoal),
        });
        if (!goalRes.ok) {
          const payload = await goalRes.json().catch(() => null);
          throw new Error(payload?.error?.message || 'Ziel konnte nicht erstellt werden.');
        }
        const created = (await goalRes.json()) as { id: string };
        goalId = created.id;
        trackOnboardingEvent('trajectory_goal_created', { category, priority: 3 });
      }

      // 2. Save settings
      const settings: TrajectorySettingsDraft = {
        hoursPerWeek: Math.min(60, Math.max(5, Math.round(capacityHoursPerWeek))),
        horizonMonths: 24,
      };

      const settingsRes = await fetch('/api/trajectory/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!settingsRes.ok) {
        const payload = await settingsRes.json().catch(() => null);
        throw new Error(payload?.error?.message || 'Kapazität konnte nicht gespeichert werden.');
      }

      trackOnboardingEvent('trajectory_capacity_set', {
        hours_per_week: settings.hoursPerWeek,
        horizon_months: settings.horizonMonths,
      });

      // 3. Compute plan
      const planRes = await fetch('/api/trajectory/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulationHoursPerWeek: settings.hoursPerWeek }),
      });
      if (!planRes.ok) {
        const payload = await planRes.json().catch(() => null);
        throw new Error(payload?.error?.message || 'Plan konnte nicht berechnet werden.');
      }

      const planPayload = (await planRes.json()) as TrajectoryPlanResponse;
      const block =
        planPayload.computed.generatedBlocks.find((b) => b.goalId === goalId) ??
        planPayload.computed.generatedBlocks[0];

      if (!block) {
        throw new Error('Kein Planblock für das Ziel gefunden.');
      }

      const explanation = block.reasons[0]
        ? reasonToSentence(block.reasons[0])
        : `${planPayload.computed.summary.onTrack} on track, ${planPayload.computed.summary.tight} tight, ${planPayload.computed.summary.atRisk} at risk.`;

      const planSummary: TrajectoryPlanSummary = {
        status: block.status,
        startDate: block.startDate,
        explanation,
        effectiveCapacityHoursPerWeek: planPayload.simulation.effectiveCapacityHoursPerWeek,
      };

      trackOnboardingEvent('trajectory_status_shown', { status: planSummary.status });
      if (planSummary.status === 'on_track') {
        play('trajectory-on-track');
      } else if (planSummary.status === 'at_risk') {
        play('trajectory-at-risk');
      }

      const draft: TrajectoryGoalDraft = {
        title,
        category,
        dueDate,
        effortHours,
        bufferWeeks,
        capacityHoursPerWeek,
      };

      onNext(
        { goalId, goalDraft: normalizedGoal },
        draft,
        settings,
        planSummary
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen. Bitte erneut versuchen.');
    } finally {
      setSaving(false);
    }
  };

  const isValid = title.trim().length > 0 && dueDate.length > 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-bold text-[#FAF0E6] mb-1">
          Definiere dein erstes Ziel
        </h2>
        <p className="text-sm text-zinc-500">
          Titel, Deadline und Aufwand — der Live-Status zeigt sofort, ob dein Plan hält.
        </p>
      </motion.div>

      {/* Live risk badge */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.12em] text-zinc-600">Live-Status</span>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${statusColor.border} ${statusColor.bg} ${statusColor.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statusColor.dot} animate-pulse`} />
          {formatTrajectoryRiskLabel(preview.status)}
        </span>
      </motion.div>

      <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
        ) : null}

        {/* Title */}
        <Input
          label="Ziel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="z.B. GMAT 680+ oder Thesis abgeben"
          fullWidth
          disabled={saving}
          autoFocus
          required
        />

        {/* Category chips */}
        <div>
          <span className="block text-sm font-medium text-[#FAF0E6] mb-2">Kategorie</span>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(opt.value)}
                disabled={saving}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  category === opt.value
                    ? 'border-[#E8B930]/30 bg-[#E8B930]/10 text-[#E8B930]'
                    : 'border-white/[0.06] bg-white/[0.02] text-zinc-500 hover:text-zinc-300 hover:border-white/10'
                }`}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Due date */}
        <Input
          label="Deadline"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          fullWidth
          disabled={saving}
          required
        />

        {/* Effort slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">Gesamtaufwand</span>
            <span className="text-sm font-semibold text-zinc-300">{effortHours}h</span>
          </div>
          <input
            type="range"
            min={50}
            max={900}
            step={10}
            value={effortHours}
            onChange={(e) => setEffortHours(Number(e.target.value))}
            disabled={saving}
            className="w-full accent-[#E8B930]"
          />
        </div>

        {/* Capacity slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">Kapazität</span>
            <span className="text-sm font-semibold text-zinc-300">{capacityHoursPerWeek}h / Woche</span>
          </div>
          <input
            type="range"
            min={5}
            max={50}
            step={1}
            value={capacityHoursPerWeek}
            onChange={(e) => setCapacityHoursPerWeek(Number(e.target.value))}
            disabled={saving}
            className="w-full accent-[#E8B930]"
          />
        </div>

        {/* Buffer slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">Buffer</span>
            <span className="text-sm font-semibold text-zinc-300">{bufferWeeks} Wochen</span>
          </div>
          <input
            type="range"
            min={0}
            max={8}
            step={1}
            value={bufferWeeks}
            onChange={(e) => setBufferWeeks(Number(e.target.value))}
            disabled={saving}
            className="w-full accent-[#E8B930]"
          />
        </div>

        {/* Live stats summary */}
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.015]">
          {[
            { label: 'Deadline', value: `${dueDays} Tage` },
            { label: 'Prep Start', value: prepStartLabel },
            { label: 'Benötigte Wochen', value: String(preview.requiredWeeks) },
            { label: 'Buffer', value: `${bufferWeeks} Wochen` },
          ].map((row, i) => (
            <div
              key={row.label}
              className={`flex items-center justify-between px-4 py-3 ${i < 3 ? 'border-b border-white/[0.04]' : ''}`}
            >
              <span className="text-[12px] text-zinc-500">{row.label}</span>
              <span className="text-[12px] font-medium text-[#FAF0E6]">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || !isValid}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#E8B930] px-6 py-3 text-sm font-semibold text-[#0A0A0C] transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Wird berechnet...
            </>
          ) : (
            <>
              Ziel erstellen & Plan berechnen
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </motion.form>
    </motion.div>
  );
}
