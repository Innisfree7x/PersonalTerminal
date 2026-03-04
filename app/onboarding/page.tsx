'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { fetchProfileAction } from '@/app/actions/profile';
import { trackOnboardingEvent } from '@/app/onboarding/analytics';
import { OnboardingLayout } from '@/components/features/onboarding/OnboardingLayout';
import { StepWelcome } from '@/components/features/onboarding/StepWelcome';
import { StepProfile } from '@/components/features/onboarding/StepProfile';
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

const TOTAL_STEPS = 5;
const LS_KEY = 'innis_onboarding_v1';

interface PersistedState {
  step: number;
  name: string;
  demoSeeded: boolean;
  trajectory: {
    goal: TrajectoryGoalPersisted | null;
    goalFormDraft: TrajectoryGoalDraft | null;
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
  const category =
    value.category === 'thesis' ||
    value.category === 'gmat' ||
    value.category === 'master_app' ||
    value.category === 'internship' ||
    value.category === 'other'
      ? value.category
      : 'thesis';
  const dueDate = typeof value.dueDate === 'string' ? value.dueDate : '';
  if (!title && !dueDate) return null;

  return {
    title,
    category,
    dueDate,
    effortUnit: value.effortUnit === 'hours' ? 'hours' : 'months',
    effortHours: typeof value.effortHours === 'number' ? value.effortHours : 120,
    effortMonths: typeof value.effortMonths === 'number' ? value.effortMonths : 3,
    bufferUnit: value.bufferUnit === 'weeks' ? 'weeks' : 'months',
    bufferWeeks: typeof value.bufferWeeks === 'number' ? value.bufferWeeks : 2,
    bufferMonths: typeof value.bufferMonths === 'number' ? value.bufferMonths : 0.5,
    priority: typeof value.priority === 'number' ? Math.min(5, Math.max(1, Math.round(value.priority))) : 3,
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

  const status = goalDraft.status === 'active' ? 'active' : null;
  const title = typeof goalDraft.title === 'string' ? goalDraft.title : '';
  const dueDate = typeof goalDraft.dueDate === 'string' ? goalDraft.dueDate : '';
  const effortHours = typeof goalDraft.effortHours === 'number' ? goalDraft.effortHours : 0;
  const bufferWeeks = typeof goalDraft.bufferWeeks === 'number' ? goalDraft.bufferWeeks : 0;
  const priority = typeof goalDraft.priority === 'number' ? goalDraft.priority : 3;

  if (!title || !dueDate || !status) return null;

  return {
    goalId,
    goalDraft: {
      title,
      category,
      dueDate,
      effortHours: Math.max(1, Math.round(effortHours)),
      bufferWeeks: Math.max(0, Math.round(bufferWeeks)),
      priority: Math.max(1, Math.min(5, Math.round(priority))),
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

  return {
    status,
    startDate,
    explanation,
    effectiveCapacityHoursPerWeek,
  };
}

function loadPersistedState(): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) return {};

    const trajectoryRaw = isRecord(parsed.trajectory) ? parsed.trajectory : {};

    const parsedState: Partial<PersistedState> = {
      step: parseStep(parsed.step),
      name: typeof parsed.name === 'string' ? parsed.name : '',
      demoSeeded: parsed.demoSeeded === true,
      trajectory: {
        goal: parseTrajectoryGoalPersisted(trajectoryRaw.goal),
        goalFormDraft: parseTrajectoryGoalDraft(trajectoryRaw.goalFormDraft),
        settingsDraft: parseTrajectorySettingsDraft(trajectoryRaw.settingsDraft),
        planSummary: parseTrajectoryPlanSummary(trajectoryRaw.planSummary),
      },
    };

    return parsedState;
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
  } catch {
    // ignore
  }
}

function hoursToMonths(hours: number, capacityHoursPerWeek: number): number {
  const normalizedHours = Math.max(1, hours);
  const normalizedWeekly = Math.max(1, capacityHoursPerWeek);
  return Math.max(0.25, normalizedHours / normalizedWeekly / 4.345);
}

function weeksToMonths(weeks: number): number {
  return Math.max(0.25, weeks / 4.345);
}

function resolveRestoredStep(step: number, trajectory: PersistedState['trajectory']): number {
  let resolved = Math.max(1, Math.min(TOTAL_STEPS, step));

  if (resolved >= 5 && !trajectory.planSummary) {
    resolved = trajectory.goal ? 4 : 3;
  }

  if (resolved === 4 && !trajectory.goal) {
    resolved = 3;
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
  const [initialName, setInitialName] = useState('');
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [demoSeeded, setDemoSeeded] = useState(false);
  const [trajectoryGoal, setTrajectoryGoal] = useState<TrajectoryGoalPersisted | null>(null);
  const [trajectoryGoalFormDraft, setTrajectoryGoalFormDraft] = useState<TrajectoryGoalDraft | null>(null);
  const [trajectorySettingsDraft, setTrajectorySettingsDraft] = useState<TrajectorySettingsDraft | null>(null);
  const [trajectoryPlanSummary, setTrajectoryPlanSummary] = useState<TrajectoryPlanSummary | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const stored = loadPersistedState();
      const restoredTrajectory = stored.trajectory ?? {
        goal: null,
        goalFormDraft: null,
        settingsDraft: null,
        planSummary: null,
      };

      if (!mounted) return;
      setName(stored.name ?? '');
      setDemoSeeded(stored.demoSeeded ?? false);
      setTrajectoryGoal(restoredTrajectory.goal ?? null);
      setTrajectoryGoalFormDraft(restoredTrajectory.goalFormDraft ?? null);
      setTrajectorySettingsDraft(restoredTrajectory.settingsDraft ?? null);
      setTrajectoryPlanSummary(restoredTrajectory.planSummary ?? null);

      const restoredStep = resolveRestoredStep(stored.step ?? 1, {
        goal: restoredTrajectory.goal ?? null,
        goalFormDraft: restoredTrajectory.goalFormDraft ?? null,
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
        setInitialName(profile.fullName || '');
      } catch {
        // silently continue
      }

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
          // ignore bootstrap settings errors
        }
      }

      if (mounted) setLoading(false);
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!loading && !startedRef.current) {
      startedRef.current = true;
      trackOnboardingEvent('onboarding_started');
    }
  }, [loading]);

  useEffect(() => {
    if (loading) return;

    savePersistedState({
      step: currentStep,
      name,
      demoSeeded,
      trajectory: {
        goal: trajectoryGoal,
        goalFormDraft: trajectoryGoalFormDraft,
        settingsDraft: trajectorySettingsDraft,
        planSummary: trajectoryPlanSummary,
      },
    });
  }, [
    loading,
    currentStep,
    name,
    demoSeeded,
    trajectoryGoal,
    trajectoryGoalFormDraft,
    trajectorySettingsDraft,
    trajectoryPlanSummary,
  ]);

  useEffect(() => {
    if (loading) return;

    if (currentStep >= 4 && !trajectoryGoal) {
      setCurrentStep(3);
      return;
    }

    if (currentStep >= 5 && !trajectoryPlanSummary) {
      setCurrentStep(trajectoryGoal ? 4 : 3);
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

    setTrajectoryGoalFormDraft({
      title: trajectory.goalDraft.title,
      category: trajectory.goalDraft.category,
      dueDate: trajectory.goalDraft.dueDate,
      effortUnit: 'hours',
      effortHours: trajectory.goalDraft.effortHours,
      effortMonths: Number(hoursToMonths(trajectory.goalDraft.effortHours, trajectory.settingsDraft.hoursPerWeek).toFixed(2)),
      bufferUnit: 'weeks',
      bufferWeeks: trajectory.goalDraft.bufferWeeks,
      bufferMonths: Number(weeksToMonths(trajectory.goalDraft.bufferWeeks).toFixed(2)),
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
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-background via-surface to-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-text-tertiary"
        >
          Workspace vorbereiten...
        </motion.div>
      </div>
    );
  }

  const canGoBack = currentStep > 1 && currentStep < TOTAL_STEPS;

  const completeTrajectory =
    trajectoryGoal && trajectorySettingsDraft && trajectoryPlanSummary
      ? {
          goalId: trajectoryGoal.goalId,
          status: trajectoryPlanSummary.status,
          startDate: trajectoryPlanSummary.startDate,
          explanation: trajectoryPlanSummary.explanation,
          effectiveCapacityHoursPerWeek: trajectoryPlanSummary.effectiveCapacityHoursPerWeek,
          horizonMonths: trajectorySettingsDraft.horizonMonths,
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
            <StepProfile
              initialName={initialName || name}
              onNext={(n) => {
                setName(n);
                goNext();
              }}
            />
          )}

          {currentStep === 3 && (
            <StepTrajectoryGoal
              initialValues={trajectoryGoalFormDraft}
              existingGoal={trajectoryGoal}
              capacityHoursPerWeek={trajectorySettingsDraft?.hoursPerWeek ?? 8}
              onNext={(goal, goalFormDraft) => {
                setTrajectoryGoal(goal);
                setTrajectoryGoalFormDraft(goalFormDraft);
                goNext();
              }}
            />
          )}

          {currentStep === 4 && trajectoryGoal && (
            <StepTrajectoryPlan
              goalId={trajectoryGoal.goalId}
              initialSettings={trajectorySettingsDraft}
              existingSummary={trajectoryPlanSummary}
              onNext={(settingsDraft, planSummary) => {
                setTrajectorySettingsDraft(settingsDraft);
                setTrajectoryPlanSummary(planSummary);
                goNext();
              }}
            />
          )}

          {currentStep === TOTAL_STEPS && (
            <StepComplete
              completedData={{
                name,
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
