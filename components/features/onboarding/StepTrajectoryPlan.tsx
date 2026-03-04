'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarRange, Gauge, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { trackOnboardingEvent } from '@/app/onboarding/analytics';

export type TrajectoryRiskStatus = 'on_track' | 'tight' | 'at_risk';

export interface TrajectorySettingsDraft {
  hoursPerWeek: number;
  horizonMonths: number;
}

export interface TrajectoryPlanSummary {
  status: TrajectoryRiskStatus;
  startDate: string;
  explanation: string;
  effectiveCapacityHoursPerWeek: number;
}

interface TrajectoryPlanResponse {
  simulation: {
    effectiveCapacityHoursPerWeek: number;
  };
  computed: {
    generatedBlocks: Array<{
      goalId: string;
      status: TrajectoryRiskStatus;
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

interface StepTrajectoryPlanProps {
  goalId: string;
  initialSettings?: TrajectorySettingsDraft | null;
  existingSummary?: TrajectoryPlanSummary | null;
  onNext: (settings: TrajectorySettingsDraft, planSummary: TrajectoryPlanSummary) => void;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

function formatStatusLabel(status: TrajectoryRiskStatus): string {
  if (status === 'on_track') return 'on track';
  if (status === 'at_risk') return 'at risk';
  return 'tight';
}

function getStatusVariant(status: TrajectoryRiskStatus): 'success' | 'warning' | 'error' {
  if (status === 'on_track') return 'success';
  if (status === 'tight') return 'warning';
  return 'error';
}

function formatDateLabel(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function reasonToSentence(reason: string): string {
  if (reason === 'required_start_in_past') return 'Start date is already in the past based on current capacity.';
  if (reason === 'collision_above_50pct') return 'High overlap with other planned blocks detected.';
  if (reason === 'collision_above_25pct') return 'Moderate overlap with other planned blocks detected.';
  return 'Trajectory computed with deterministic planning rules.';
}

export function StepTrajectoryPlan({
  goalId,
  initialSettings,
  existingSummary,
  onNext,
}: StepTrajectoryPlanProps) {
  const [hoursPerWeek, setHoursPerWeek] = useState(initialSettings?.hoursPerWeek ?? 8);
  const [horizonMonths, setHorizonMonths] = useState(initialSettings?.horizonMonths ?? 24);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<TrajectoryPlanSummary | null>(existingSummary ?? null);

  const currentSettings: TrajectorySettingsDraft = {
    hoursPerWeek: Math.min(60, Math.max(5, Math.round(hoursPerWeek))),
    horizonMonths: Math.min(36, Math.max(6, Math.round(horizonMonths))),
  };

  const statusTitle = useMemo(() => {
    if (!summary) return '';
    if (summary.status === 'on_track') return 'Trajectory looks stable.';
    if (summary.status === 'tight') return 'Trajectory is feasible but tight.';
    return 'Trajectory currently at risk.';
  }, [summary]);

  const handleCompute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');

    try {
      const settingsResponse = await fetch('/api/trajectory/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentSettings),
      });
      if (!settingsResponse.ok) {
        const payload = await settingsResponse.json().catch(() => null);
        throw new Error(payload?.error?.message || 'Trajectory settings konnten nicht gespeichert werden.');
      }

      trackOnboardingEvent('trajectory_capacity_set', {
        hours_per_week: currentSettings.hoursPerWeek,
        horizon_months: currentSettings.horizonMonths,
      });

      const planResponse = await fetch('/api/trajectory/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulationHoursPerWeek: currentSettings.hoursPerWeek }),
      });
      if (!planResponse.ok) {
        const payload = await planResponse.json().catch(() => null);
        throw new Error(payload?.error?.message || 'Trajectory plan konnte nicht berechnet werden.');
      }

      const planPayload = (await planResponse.json()) as TrajectoryPlanResponse;
      const block =
        planPayload.computed.generatedBlocks.find((item) => item.goalId === goalId) ??
        planPayload.computed.generatedBlocks[0];

      if (!block) {
        throw new Error('Kein Planblock für das Ziel gefunden. Bitte erneut versuchen.');
      }

      const explanation = block.reasons[0]
        ? reasonToSentence(block.reasons[0])
        : `Summary: ${planPayload.computed.summary.onTrack} on track, ${planPayload.computed.summary.tight} tight, ${planPayload.computed.summary.atRisk} at risk.`;

      const nextSummary: TrajectoryPlanSummary = {
        status: block.status,
        startDate: block.startDate,
        explanation,
        effectiveCapacityHoursPerWeek: planPayload.simulation.effectiveCapacityHoursPerWeek,
      };

      setSummary(nextSummary);
      trackOnboardingEvent('trajectory_status_shown', { status: nextSummary.status });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Plan konnte nicht berechnet werden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10">
          <Gauge className="h-5 w-5 text-orange-300" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-text-primary">
          How many hours per week can you realistically invest?
        </h2>
        <p className="text-sm text-text-secondary">
          Setze deine echte Kapazität und berechne sofort den Trajectory-Status.
        </p>
      </motion.div>

      <motion.form variants={itemVariants} onSubmit={handleCompute} className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">
            {error}
          </div>
        ) : null}

        <div className="rounded-xl border border-border bg-surface-hover p-3">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-text-primary">Hours per week</label>
            <span className="text-sm font-semibold text-primary">{currentSettings.hoursPerWeek}h</span>
          </div>
          <input
            type="range"
            min={5}
            max={60}
            step={1}
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(Number(e.target.value))}
            className="w-full accent-primary"
            disabled={saving}
          />
          <p className="mt-2 text-xs text-text-tertiary">Range: 5h to 60h per week.</p>
        </div>

        <div className="rounded-xl border border-border bg-surface-hover p-3">
          <div className="mb-2 flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-text-tertiary" />
            <label className="text-sm font-medium text-text-primary">Horizon months</label>
          </div>
          <input
            type="number"
            min={6}
            max={36}
            value={horizonMonths}
            onChange={(e) => setHorizonMonths(Number(e.target.value || 24))}
            disabled={saving}
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          loading={saving}
          disabled={saving}
          rightIcon={<Sparkles className="h-4 w-4" />}
        >
          Compute trajectory
        </Button>
      </motion.form>

      {summary ? (
        <motion.div variants={itemVariants} className="space-y-3 rounded-xl border border-primary/20 bg-primary/10 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-text-primary">{statusTitle}</p>
            <Badge variant={getStatusVariant(summary.status)} size="sm">
              {formatStatusLabel(summary.status)}
            </Badge>
          </div>
          <p className="text-sm text-text-secondary">Prep starts {formatDateLabel(summary.startDate)}</p>
          <p className="text-xs text-text-tertiary">{summary.explanation}</p>

          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => onNext(currentSettings, summary)}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Continue
          </Button>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants}>
          <div className="flex w-full items-center justify-center gap-1 py-1 text-sm text-text-tertiary/50">
            Compute first to continue
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
