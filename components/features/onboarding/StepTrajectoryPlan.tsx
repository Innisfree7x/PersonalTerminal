'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Gauge, GraduationCap, Sparkles, TimerReset } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { trackOnboardingEvent } from '@/app/onboarding/analytics';
import { useAppSound } from '@/lib/hooks/useAppSound';
import { updateProfileAction } from '@/app/actions/profile';
import { RiskStatusCard } from '@/components/features/onboarding/RiskStatusCard';

export type TrajectoryRiskStatus = 'on_track' | 'tight' | 'at_risk';
export type TrajectoryStudyLoad = 'light' | 'normal' | 'heavy';

export interface TrajectorySettingsDraft {
  hoursPerWeek: number;
  horizonMonths: number;
}

export interface OnboardingContextDraft {
  currentSemester: number;
  studyLoad: TrajectoryStudyLoad;
  weeklyFocusHours: number;
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
  goalTitle: string;
  targetDate: string;
  initialSettings?: TrajectorySettingsDraft | null;
  initialContext?: OnboardingContextDraft | null;
  existingSummary?: TrajectoryPlanSummary | null;
  onNext: (settings: TrajectorySettingsDraft, context: OnboardingContextDraft, planSummary: TrajectoryPlanSummary) => void;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const loadOptions: Array<{ value: TrajectoryStudyLoad; label: string; helper: string }> = [
  { value: 'light', label: 'Leicht', helper: 'mehr freie Planungskapazität' },
  { value: 'normal', label: 'Normal', helper: 'solide Woche mit Uni-Fokus' },
  { value: 'heavy', label: 'Heavy', helper: 'harte Semesterphase, wenig Luft' },
];

function deriveHorizonMonths(targetDate: string): number {
  const target = new Date(`${targetDate}T00:00:00.000Z`);
  if (Number.isNaN(target.getTime())) return 12;
  const today = new Date();
  const months = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.4375));
  return Math.min(36, Math.max(3, months));
}

function formatStudyLoad(value: TrajectoryStudyLoad): string {
  return loadOptions.find((option) => option.value === value)?.label ?? 'Normal';
}

function reasonToSentence(reason: string): string {
  if (reason === 'required_start_in_past') return 'Der empfohlene Start liegt bereits vor heute. Mit deiner aktuellen Kapazität wird das Ziel kritisch.';
  if (reason === 'collision_above_50pct') return 'Es gibt starke Überschneidungen mit anderen Prep-Blöcken. Prioritäten oder Kapazität müssen angepasst werden.';
  if (reason === 'collision_above_25pct') return 'Es gibt sichtbare Überschneidungen. Der Plan ist machbar, braucht aber Disziplin.';
  return 'Der Plan wurde mit deterministischen Regeln aus Deadline, Aufwand und Puffer berechnet.';
}

export function StepTrajectoryPlan({
  goalId,
  goalTitle,
  targetDate,
  initialSettings,
  initialContext,
  existingSummary,
  onNext,
}: StepTrajectoryPlanProps) {
  const { play } = useAppSound();
  const [hoursPerWeek, setHoursPerWeek] = useState(initialContext?.weeklyFocusHours ?? initialSettings?.hoursPerWeek ?? 8);
  const [currentSemester, setCurrentSemester] = useState(initialContext?.currentSemester ?? 4);
  const [studyLoad, setStudyLoad] = useState<TrajectoryStudyLoad>(initialContext?.studyLoad ?? 'normal');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<TrajectoryPlanSummary | null>(existingSummary ?? null);

  const currentSettings: TrajectorySettingsDraft = useMemo(
    () => ({
      hoursPerWeek: Math.min(60, Math.max(5, Math.round(hoursPerWeek))),
      horizonMonths: deriveHorizonMonths(targetDate),
    }),
    [hoursPerWeek, targetDate]
  );

  const currentContext: OnboardingContextDraft = useMemo(
    () => ({
      currentSemester: Math.min(12, Math.max(1, Math.round(currentSemester))),
      studyLoad,
      weeklyFocusHours: currentSettings.hoursPerWeek,
    }),
    [currentSemester, studyLoad, currentSettings.hoursPerWeek]
  );

  const handleCompute = async (event: React.FormEvent) => {
    event.preventDefault();
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
        throw new Error(payload?.error?.message || 'Deine Trajectory-Einstellungen konnten nicht gespeichert werden.');
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
        throw new Error(payload?.error?.message || 'Der Trajectory-Plan konnte nicht berechnet werden.');
      }

      const planPayload = (await planResponse.json()) as TrajectoryPlanResponse;
      const block = planPayload.computed.generatedBlocks.find((item) => item.goalId === goalId) ?? planPayload.computed.generatedBlocks[0];

      if (!block) {
        throw new Error('Kein Planblock für dieses Ziel gefunden.');
      }

      const nextSummary: TrajectoryPlanSummary = {
        status: block.status,
        startDate: block.startDate,
        explanation: block.reasons[0]
          ? reasonToSentence(block.reasons[0])
          : `Planlage: ${planPayload.computed.summary.onTrack} on track, ${planPayload.computed.summary.tight} tight, ${planPayload.computed.summary.atRisk} at risk.`,
        effectiveCapacityHoursPerWeek: planPayload.simulation.effectiveCapacityHoursPerWeek,
      };

      setSummary(nextSummary);
      void updateProfileAction({
        onboardingContext: currentContext,
        trajectoryStatusShown: { status: nextSummary.status },
      }).catch(() => {
        // Analytics enrichment must not block onboarding.
      });

      trackOnboardingEvent('trajectory_status_shown', { status: nextSummary.status });
      if (nextSummary.status === 'on_track') play('trajectory-on-track');
      if (nextSummary.status === 'at_risk') play('trajectory-at-risk');
    } catch (computeError) {
      setError(computeError instanceof Error ? computeError.message : 'Plan konnte nicht berechnet werden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E8B930]/25 bg-[#E8B930]/10 text-[#F5D565]">
          <Gauge className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#8F8577]">Kapitel 2 · Deine Situation</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#FAF0E6]">Wie viel Fokus kannst du realistisch investieren?</h1>
          <p className="max-w-[42rem] text-sm leading-6 text-[#C5B9A8]">
            Wir speichern deine aktuelle Lage, berechnen den Prep-Start und zeigen dir sofort den Risk-Status für <span className="text-[#FAF0E6]">{goalTitle}</span>.
          </p>
        </div>
      </motion.div>

      <motion.form variants={itemVariants} onSubmit={handleCompute} className="space-y-4">
        {error ? <div className="rounded-2xl border border-[#DC3232]/30 bg-[#DC3232]/10 p-3 text-sm text-[#F5B0B0]">{error}</div> : null}

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-4 rounded-[28px] border border-white/[0.07] bg-[#0F0E13] p-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#FAF0E6]">Stunden pro Woche</label>
                <span className="text-sm font-semibold text-[#F5D565]">{currentSettings.hoursPerWeek}h</span>
              </div>
              <input
                type="range"
                min={5}
                max={60}
                step={1}
                value={hoursPerWeek}
                onChange={(event) => setHoursPerWeek(Number(event.target.value))}
                className="w-full accent-[#E8B930]"
                disabled={saving}
              />
              <p className="text-xs text-[#8F8577]">Realistische Fokuskapazität außerhalb von Vorlesungen, Klausuren und Alltagsrauschen.</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-[#FAF0E6]">
                  <GraduationCap className="h-4 w-4 text-[#8F8577]" />
                  Aktuelles Semester
                </label>
                <span className="text-sm font-semibold text-[#F5D565]">{currentContext.currentSemester}</span>
              </div>
              <input
                type="range"
                min={1}
                max={12}
                step={1}
                value={currentSemester}
                onChange={(event) => setCurrentSemester(Number(event.target.value))}
                className="w-full accent-[#E8B930]"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-[#FAF0E6]">
                <TimerReset className="h-4 w-4 text-[#8F8577]" />
                Studienlast
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {loadOptions.map((option) => {
                  const selected = option.value === studyLoad;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStudyLoad(option.value)}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${selected ? 'border-[#E8B930]/40 bg-[#E8B930]/12 text-[#FAF0E6]' : 'border-white/[0.08] bg-black/20 text-[#A89D8F]'}`}
                    >
                      <div className="text-sm font-semibold">{option.label}</div>
                      <div className="mt-1 text-xs text-[#8F8577]">{option.helper}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-[28px] border border-white/[0.07] bg-[#0F0E13] p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#8F8577]">Planungsrahmen</p>
            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[#8F8577]">Horizon</p>
                <p className="mt-2 text-2xl font-semibold text-[#FAF0E6]">{currentSettings.horizonMonths} Monate</p>
                <p className="mt-1 text-sm text-[#C5B9A8]">automatisch aus deiner Deadline abgeleitet</p>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[#8F8577]">Aktueller Modus</p>
                <p className="mt-2 text-2xl font-semibold text-[#FAF0E6]">{formatStudyLoad(currentContext.studyLoad)}</p>
                <p className="mt-1 text-sm text-[#C5B9A8]">Semester {currentContext.currentSemester}</p>
              </div>
            </div>
          </div>
        </div>

        <Button type="submit" variant="primary" fullWidth size="lg" loading={saving} disabled={saving} rightIcon={<Sparkles className="h-4 w-4" />}>
          Plan berechnen
        </Button>
      </motion.form>

      {summary ? (
        <motion.div variants={itemVariants} className="space-y-4">
          <RiskStatusCard goalTitle={goalTitle} targetDate={targetDate} summary={summary} compact />
          <Button variant="primary" fullWidth size="lg" onClick={() => onNext(currentSettings, currentContext, summary)} rightIcon={<ArrowRight className="h-4 w-4" />}>
            Zur finalen Übersicht
          </Button>
        </motion.div>
      ) : null}
    </motion.div>
  );
}
