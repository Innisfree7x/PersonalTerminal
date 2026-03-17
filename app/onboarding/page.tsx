'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { fetchProfileAction } from '@/app/actions/profile';
import { trackOnboardingEvent } from '@/app/onboarding/analytics';
import { OnboardingLayout } from '@/components/features/onboarding/OnboardingLayout';
import { StepWelcome } from '@/components/features/onboarding/StepWelcome';
import {
  StepTrajectoryGoal,
  type TrajectoryGoalDraft,
  type TrajectoryGoalPersisted,
} from '@/components/features/onboarding/StepTrajectoryGoal';
import {
  StepTrajectoryPlan,
  type TrajectorySettingsDraft,
  type TrajectoryPlanSummary,
} from '@/components/features/onboarding/StepTrajectoryPlan';
import { StepComplete } from '@/components/features/onboarding/StepComplete';
import type { DemoSeedResult } from '@/app/onboarding/demoSeedService';

const TOTAL_STEPS = 4;
const LS_KEY = 'innis_onboarding_v2';

interface PersistedState {
  step: number;
  demoSeeded: boolean;
  trajectory: {
    goal: TrajectoryGoalPersisted | null;
    goalDraft: TrajectoryGoalDraft | null;
    settingsDraft: TrajectorySettingsDraft | null;
    planSummary: TrajectoryPlanSummary | null;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseStep(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 1;
  return Math.max(1, Math.min(TOTAL_STEPS, Math.round(value)));
}

function parseTrajectoryGoalDraft(value: unknown): TrajectoryGoalDraft | null {
  if (!isRecord(value)) return null;
  const title = typeof value.title === 'string' ? value.title : '';
  const dueDate = typeof value.dueDate === 'string' ? value.dueDate : '';
  if (!title && !dueDate) return null;

  const category =
    value.category === 'thesis' ||
    value.category === 'gmat' ||
    value.category === 'master_app' ||
    value.category === 'internship' ||
    value.category === 'other'
      ? value.category
      : 'thesis';

  const effortHours = typeof value.effortHours === 'number' ? Math.max(1, Math.round(value.effortHours)) : 120;
  const effortMonths =
    typeof value.effortMonths === 'number' ? Math.max(0.25, value.effortMonths) : Math.max(0.25, effortHours / 8 / 4.345);
  const bufferWeeks = typeof value.bufferWeeks === 'number' ? Math.max(0, Math.round(value.bufferWeeks)) : 2;
  const bufferMonths =
    typeof value.bufferMonths === 'number' ? Math.max(0.25, value.bufferMonths) : Math.max(0.25, bufferWeeks / 4.345);

  return {
    title,
    category,
    dueDate,
    effortUnit: value.effortUnit === 'hours' || value.effortUnit === 'months' ? value.effortUnit : 'months',
    effortHours,
    effortMonths,
    bufferUnit: value.bufferUnit === 'weeks' || value.bufferUnit === 'months' ? value.bufferUnit : 'months',
    bufferWeeks,
    bufferMonths,
    priority: typeof value.priority === 'number' ? Math.max(1, Math.min(5, Math.round(value.priority))) : 3,
  };
}

function parseTrajectoryGoalPersisted(value: unknown): TrajectoryGoalPersisted | null {
  if (!isRecord(value)) return null;
  const goalId = typeof value.goalId === 'string' ? value.goalId : '';
  const goalDraft = isRecord(value.goalDraft) ? value.goalDraft : null;
  if (!goalId || !goalDraft) return null;

  const category =
    goalDraft.category === 'thesis' ||
    goalDraft.category === 'gmat' ||
    goalDraft.category === 'master_app' ||
    goalDraft.category === 'internship' ||
    goalDraft.category === 'other'
      ? goalDraft.category
      : 'other';

  const title = typeof goalDraft.title === 'string' ? goalDraft.title : '';
  const dueDate = typeof goalDraft.dueDate === 'string' ? goalDraft.dueDate : '';
  const status = goalDraft.status === 'active' ? 'active' : null;
  if (!title || !dueDate || !status) return null;

  return {
    goalId,
    goalDraft: {
      title,
      category,
      dueDate,
      effortHours: typeof goalDraft.effortHours === 'number' ? Math.max(1, Math.round(goalDraft.effortHours)) : 0,
      bufferWeeks: typeof goalDraft.bufferWeeks === 'number' ? Math.max(0, Math.round(goalDraft.bufferWeeks)) : 0,
      priority: typeof goalDraft.priority === 'number' ? Math.max(1, Math.min(5, Math.round(goalDraft.priority))) : 3,
      status,
    },
  };
}

function parseTrajectorySettingsDraft(value: unknown): TrajectorySettingsDraft | null {
  if (!isRecord(value)) return null;
  const hoursPerWeek = typeof value.hoursPerWeek === 'number' ? value.hoursPerWeek : null;
  const horizonMonths = typeof value.horizonMonths === 'number' ? value.horizonMonths : null;
  if (hoursPerWeek === null || horizonMonths === null) return null;
  return {
    hoursPerWeek: Math.min(60, Math.max(5, Math.round(hoursPerWeek))),
    horizonMonths: Math.min(36, Math.max(6, Math.round(horizonMonths))),
  };
}

function parseTrajectoryPlanSummary(value: unknown): TrajectoryPlanSummary | null {
  if (!isRecord(value)) return null;
  const status = value.status;
  if (status !== 'on_track' && status !== 'tight' && status !== 'at_risk') return null;
  const startDate = typeof value.startDate === 'string' ? value.startDate : '';
  const explanation = typeof value.explanation === 'string' ? value.explanation : '';
  const effectiveCapacityHoursPerWeek =
    typeof value.effectiveCapacityHoursPerWeek === 'number' ? value.effectiveCapacityHoursPerWeek : 0;
  if (!startDate || !explanation || effectiveCapacityHoursPerWeek <= 0) return null;
  return { status, startDate, explanation, effectiveCapacityHoursPerWeek };
}

function loadPersistedState(): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) return {};

    const trajectoryRaw = isRecord(parsed.trajectory) ? parsed.trajectory : {};

    return {
      step: parseStep(parsed.step),
      demoSeeded: parsed.demoSeeded === true,
      trajectory: {
        goal: parseTrajectoryGoalPersisted(trajectoryRaw.goal),
        goalDraft: parseTrajectoryGoalDraft(trajectoryRaw.goalDraft),
        settingsDraft: parseTrajectorySettingsDraft(trajectoryRaw.settingsDraft),
        planSummary: parseTrajectoryPlanSummary(trajectoryRaw.planSummary),
      },
    };
  } catch {
    return {};
  }
}

function savePersistedState(state: PersistedState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable
  }
}

function clearPersistedState() {
  try {
    localStorage.removeItem(LS_KEY);
    // Also clear old v1 key
    localStorage.removeItem('innis_onboarding_v1');
  } catch {
    // ignore
  }
}

function resolveRestoredStep(step: number, trajectory: PersistedState['trajectory']): number {
  let resolved = Math.max(1, Math.min(TOTAL_STEPS, step));

  if (resolved >= 4 && !trajectory.planSummary) {
    resolved = 3;
  }

  if (resolved >= 3 && !trajectory.goal) {
    resolved = 2;
  }

  return resolved;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 48 : -48,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -48 : 48,
    opacity: 0,
    transition: { duration: 0.22 },
  }),
};

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(true);

  const [demoSeeded, setDemoSeeded] = useState(false);
  const [trajectoryGoal, setTrajectoryGoal] = useState<TrajectoryGoalPersisted | null>(null);
  const [trajectoryGoalDraft, setTrajectoryGoalDraft] = useState<TrajectoryGoalDraft | null>(null);
  const [trajectorySettingsDraft, setTrajectorySettingsDraft] = useState<TrajectorySettingsDraft | null>(null);
  const [trajectoryPlanSummary, setTrajectoryPlanSummary] = useState<TrajectoryPlanSummary | null>(null);
  const startedRef = useRef(false);

  // Load persisted state + check auth
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const stored = loadPersistedState();
      const restoredTrajectory = stored.trajectory ?? {
        goal: null,
        goalDraft: null,
        settingsDraft: null,
        planSummary: null,
      };

      if (!mounted) return;
      setDemoSeeded(stored.demoSeeded ?? false);
      setTrajectoryGoal(restoredTrajectory.goal ?? null);
      setTrajectoryGoalDraft(restoredTrajectory.goalDraft ?? null);
      setTrajectorySettingsDraft(restoredTrajectory.settingsDraft ?? null);
      setTrajectoryPlanSummary(restoredTrajectory.planSummary ?? null);

      const restoredStep = resolveRestoredStep(stored.step ?? 1, {
        goal: restoredTrajectory.goal ?? null,
        goalDraft: restoredTrajectory.goalDraft ?? null,
        settingsDraft: restoredTrajectory.settingsDraft ?? null,
        planSummary: restoredTrajectory.planSummary ?? null,
      });
      setCurrentStep(restoredStep);

      try {
        const profile = await fetchProfileAction();
        if (!mounted) return;
        if (profile.onboardingCompleted) {
          clearPersistedState();
          router.replace('/today');
          return;
        }
      } catch {
        // silently continue
      }

      // Bootstrap settings if not restored
      if (!restoredTrajectory.settingsDraft) {
        try {
          const response = await fetch('/api/trajectory/settings');
          if (response.ok && mounted) {
            const payload = (await response.json()) as { hoursPerWeek: number; horizonMonths: number };
            setTrajectorySettingsDraft({
              hoursPerWeek: payload.hoursPerWeek,
              horizonMonths: payload.horizonMonths,
            });
          }
        } catch {
          // ignore
        }
      }

      if (mounted) setLoading(false);
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [router]);

  // Track onboarding started
  useEffect(() => {
    if (!loading && !startedRef.current) {
      startedRef.current = true;
      trackOnboardingEvent('onboarding_started');
    }
  }, [loading]);

  // Persist state
  useEffect(() => {
    if (loading) return;
    savePersistedState({
      step: currentStep,
      demoSeeded,
      trajectory: {
        goal: trajectoryGoal,
        goalDraft: trajectoryGoalDraft,
        settingsDraft: trajectorySettingsDraft,
        planSummary: trajectoryPlanSummary,
      },
    });
  }, [loading, currentStep, demoSeeded, trajectoryGoal, trajectoryGoalDraft, trajectorySettingsDraft, trajectoryPlanSummary]);

  // Guard: can't be on step 3 without plan data
  useEffect(() => {
    if (loading) return;
    if (currentStep >= 4 && !trajectoryPlanSummary) {
      setCurrentStep(3);
      return;
    }
    if (currentStep >= 3 && !trajectoryGoal) {
      setCurrentStep(2);
    }
  }, [loading, currentStep, trajectoryGoal, trajectoryPlanSummary]);

  const goNext = () => {
    const fromStep = currentStep;
    setDirection(1);
    const nextStep = Math.min(currentStep + 1, TOTAL_STEPS);
    trackOnboardingEvent('onboarding_step_completed', { step: fromStep });
    setCurrentStep(nextStep);
  };

  const goBack = () => {
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const handleDemoSeeded = (seedResult: DemoSeedResult) => {
    const { trajectory } = seedResult;
    setDemoSeeded(true);
    setTrajectoryGoal({
      goalId: trajectory.goalId,
      goalDraft: trajectory.goalDraft,
    });
    setTrajectoryGoalDraft({
      title: trajectory.goalDraft.title,
      category: trajectory.goalDraft.category,
      dueDate: trajectory.goalDraft.dueDate,
      effortUnit: 'hours',
      effortHours: trajectory.goalDraft.effortHours,
      effortMonths: Math.max(0.25, trajectory.goalDraft.effortHours / trajectory.settingsDraft.hoursPerWeek / 4.345),
      bufferUnit: 'weeks',
      bufferWeeks: trajectory.goalDraft.bufferWeeks,
      bufferMonths: Math.max(0.25, trajectory.goalDraft.bufferWeeks / 4.345),
      priority: trajectory.goalDraft.priority,
    });
    setTrajectorySettingsDraft(trajectory.settingsDraft);
    setTrajectoryPlanSummary(trajectory.planSummary);

    trackOnboardingEvent('onboarding_step_completed', { step: 1 });
    setDirection(1);
    setCurrentStep(TOTAL_STEPS);
  };

  const handleComplete = () => {
    clearPersistedState();
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0A0A0C]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-zinc-600"
        >
          Terminal vorbereiten...
        </motion.div>
      </div>
    );
  }

  const canGoBack = currentStep > 1 && currentStep < TOTAL_STEPS;

  const completeTrajectory =
    trajectoryGoal && trajectorySettingsDraft && trajectoryPlanSummary
      ? {
          goalId: trajectoryGoal.goalId,
          goalTitle: trajectoryGoal.goalDraft.title,
          status: trajectoryPlanSummary.status,
          startDate: trajectoryPlanSummary.startDate,
          explanation: trajectoryPlanSummary.explanation,
          effectiveCapacityHoursPerWeek: trajectoryPlanSummary.effectiveCapacityHoursPerWeek,
        }
      : null;

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={TOTAL_STEPS}
      canGoBack={canGoBack}
      onBack={goBack}
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {currentStep === 1 && (
            <StepWelcome
              onNext={goNext}
              onDemoSeeded={handleDemoSeeded}
            />
          )}

          {currentStep === 2 && (
            <StepTrajectoryGoal
              initialValues={trajectoryGoalDraft}
              existingGoal={trajectoryGoal}
              capacityHoursPerWeek={trajectorySettingsDraft?.hoursPerWeek ?? 8}
              onNext={(goal, draft) => {
                setTrajectoryGoal(goal);
                setTrajectoryGoalDraft(draft);
                goNext();
              }}
            />
          )}

          {currentStep === 3 && trajectoryGoal && (
            <StepTrajectoryPlan
              goalId={trajectoryGoal.goalId}
              initialSettings={trajectorySettingsDraft}
              existingSummary={trajectoryPlanSummary}
              onNext={(settings, plan) => {
                setTrajectorySettingsDraft(settings);
                setTrajectoryPlanSummary(plan);
                goNext();
              }}
            />
          )}

          {currentStep === TOTAL_STEPS && (
            <StepComplete
              completedData={{
                trajectory: completeTrajectory,
                demoSeeded,
              }}
              onComplete={handleComplete}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </OnboardingLayout>
  );
}
