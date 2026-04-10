'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { fetchProfileAction } from '@/app/actions/profile';
import { trackOnboardingEvent } from '@/app/onboarding/analytics';
import { OnboardingLayout } from '@/components/features/onboarding/OnboardingLayout';
import {
  StepTrajectoryGoal,
  type TrajectoryGoalDraft,
  type TrajectoryGoalPersisted,
} from '@/components/features/onboarding/StepTrajectoryGoal';
import {
  StepTrajectoryPlan,
  type OnboardingContextDraft,
  type TrajectoryPlanSummary,
  type TrajectorySettingsDraft,
} from '@/components/features/onboarding/StepTrajectoryPlan';
import { StepComplete } from '@/components/features/onboarding/StepComplete';

const TOTAL_STEPS = 3;
const LS_KEY = 'innis_onboarding_v2';

interface PersistedState {
  step: number;
  trajectory: {
    goal: TrajectoryGoalPersisted | null;
    goalDraft: TrajectoryGoalDraft | null;
    settingsDraft: TrajectorySettingsDraft | null;
    contextDraft: OnboardingContextDraft | null;
    planSummary: TrajectoryPlanSummary | null;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function clampStep(value: unknown): number {
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
      : 'internship';

  const effortUnit = value.effortUnit === 'hours' || value.effortUnit === 'months' ? value.effortUnit : 'months';
  const effortHours = typeof value.effortHours === 'number' ? Math.max(1, Math.round(value.effortHours)) : 120;
  const effortMonths =
    typeof value.effortMonths === 'number' ? Math.max(0.25, value.effortMonths) : Math.max(0.25, effortHours / 8 / 4.345);
  const bufferUnit = value.bufferUnit === 'weeks' || value.bufferUnit === 'months' ? value.bufferUnit : 'months';
  const bufferWeeks = typeof value.bufferWeeks === 'number' ? Math.max(0, Math.round(value.bufferWeeks)) : 2;
  const bufferMonths =
    typeof value.bufferMonths === 'number' ? Math.max(0.25, value.bufferMonths) : Math.max(0.25, bufferWeeks / 4.345);
  const priority = typeof value.priority === 'number' ? Math.max(1, Math.min(5, Math.round(value.priority))) : 3;

  return {
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
}

function parseTrajectoryGoalPersisted(value: unknown): TrajectoryGoalPersisted | null {
  if (!isRecord(value)) return null;
  const goalId = typeof value.goalId === 'string' ? value.goalId : '';
  const goalDraft = isRecord(value.goalDraft) ? value.goalDraft : null;
  if (!goalId || !goalDraft) return null;

  const title = typeof goalDraft.title === 'string' ? goalDraft.title : '';
  const dueDate = typeof goalDraft.dueDate === 'string' ? goalDraft.dueDate : '';
  const category =
    goalDraft.category === 'thesis' ||
    goalDraft.category === 'gmat' ||
    goalDraft.category === 'master_app' ||
    goalDraft.category === 'internship' ||
    goalDraft.category === 'other'
      ? goalDraft.category
      : 'other';
  const status = goalDraft.status === 'active' ? 'active' : null;
  if (!title || !dueDate || !status) return null;

  return {
    goalId,
    goalDraft: {
      title,
      category,
      dueDate,
      effortHours: typeof goalDraft.effortHours === 'number' ? Math.max(1, Math.round(goalDraft.effortHours)) : 120,
      bufferWeeks: typeof goalDraft.bufferWeeks === 'number' ? Math.max(0, Math.round(goalDraft.bufferWeeks)) : 2,
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
    horizonMonths: Math.min(36, Math.max(3, Math.round(horizonMonths))),
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

function parseOnboardingContextDraft(value: unknown, fallbackHours?: number | null): OnboardingContextDraft | null {
  if (!isRecord(value)) {
    if (fallbackHours && fallbackHours > 0) {
      return {
        currentSemester: 4,
        studyLoad: 'normal',
        weeklyFocusHours: Math.min(60, Math.max(5, Math.round(fallbackHours))),
      };
    }
    return null;
  }

  const currentSemester = typeof value.currentSemester === 'number' ? Math.round(value.currentSemester) : 4;
  const studyLoad = value.studyLoad === 'light' || value.studyLoad === 'normal' || value.studyLoad === 'heavy' ? value.studyLoad : 'normal';
  const weeklyFocusHours =
    typeof value.weeklyFocusHours === 'number'
      ? Math.round(value.weeklyFocusHours)
      : fallbackHours && fallbackHours > 0
        ? Math.round(fallbackHours)
        : 8;

  return {
    currentSemester: Math.min(12, Math.max(1, currentSemester)),
    studyLoad,
    weeklyFocusHours: Math.min(60, Math.max(5, weeklyFocusHours)),
  };
}

function loadPersistedState(): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) return {};

    const trajectoryRaw = isRecord(parsed.trajectory) ? parsed.trajectory : {};
    const settingsDraft = parseTrajectorySettingsDraft(trajectoryRaw.settingsDraft);

    return {
      step: clampStep(parsed.step),
      trajectory: {
        goal: parseTrajectoryGoalPersisted(trajectoryRaw.goal),
        goalDraft: parseTrajectoryGoalDraft(trajectoryRaw.goalDraft),
        settingsDraft,
        contextDraft: parseOnboardingContextDraft(trajectoryRaw.contextDraft, settingsDraft?.hoursPerWeek ?? null),
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
    localStorage.removeItem('innis_onboarding_v1');
  } catch {
    // ignore
  }
}

function resolveRestoredStep(requestedStep: number, trajectory: PersistedState['trajectory']): number {
  let step = clampStep(requestedStep);

  if (step >= 3 && (!trajectory.goal || !trajectory.planSummary)) {
    step = trajectory.goal ? 2 : 1;
  }

  if (step >= 2 && !trajectory.goal) {
    step = 1;
  }

  if (trajectory.planSummary && trajectory.goal) return 3;
  if (trajectory.goal) return Math.max(step, 2);
  return 1;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export function OnboardingWizard() {
  const router = useRouter();
  const startedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const [trajectoryGoal, setTrajectoryGoal] = useState<TrajectoryGoalPersisted | null>(null);
  const [trajectoryGoalDraft, setTrajectoryGoalDraft] = useState<TrajectoryGoalDraft | null>(null);
  const [trajectorySettingsDraft, setTrajectorySettingsDraft] = useState<TrajectorySettingsDraft | null>(null);
  const [trajectoryContextDraft, setTrajectoryContextDraft] = useState<OnboardingContextDraft | null>(null);
  const [trajectoryPlanSummary, setTrajectoryPlanSummary] = useState<TrajectoryPlanSummary | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const stored = loadPersistedState();
      const restoredTrajectory = stored.trajectory ?? {
        goal: null,
        goalDraft: null,
        settingsDraft: null,
        contextDraft: null,
        planSummary: null,
      };

      if (!mounted) return;

      setTrajectoryGoal(restoredTrajectory.goal ?? null);
      setTrajectoryGoalDraft(restoredTrajectory.goalDraft ?? null);
      setTrajectorySettingsDraft(restoredTrajectory.settingsDraft ?? null);
      setTrajectoryContextDraft(restoredTrajectory.contextDraft ?? null);
      setTrajectoryPlanSummary(restoredTrajectory.planSummary ?? null);
      setCurrentStep(resolveRestoredStep(stored.step ?? 1, restoredTrajectory));

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

      if (!restoredTrajectory.settingsDraft) {
        try {
          const response = await fetch('/api/trajectory/settings');
          if (response.ok && mounted) {
            const payload = (await response.json()) as { hoursPerWeek: number; horizonMonths: number };
            setTrajectorySettingsDraft({
              hoursPerWeek: payload.hoursPerWeek,
              horizonMonths: payload.horizonMonths,
            });
            setTrajectoryContextDraft((current) =>
              current ?? {
                currentSemester: 4,
                studyLoad: 'normal',
                weeklyFocusHours: payload.hoursPerWeek,
              }
            );
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
      trajectory: {
        goal: trajectoryGoal,
        goalDraft: trajectoryGoalDraft,
        settingsDraft: trajectorySettingsDraft,
        contextDraft: trajectoryContextDraft,
        planSummary: trajectoryPlanSummary,
      },
    });
  }, [
    currentStep,
    loading,
    trajectoryContextDraft,
    trajectoryGoal,
    trajectoryGoalDraft,
    trajectoryPlanSummary,
    trajectorySettingsDraft,
  ]);

  useEffect(() => {
    if (loading) return;
    if (currentStep >= 3 && (!trajectoryGoal || !trajectoryPlanSummary)) {
      setCurrentStep(trajectoryGoal ? 2 : 1);
    }
  }, [currentStep, loading, trajectoryGoal, trajectoryPlanSummary]);

  const canGoBack = currentStep > 1 && currentStep < TOTAL_STEPS;

  const completeTrajectory = useMemo(() => {
    if (!trajectoryGoal || !trajectoryPlanSummary) return null;
    return {
      goalId: trajectoryGoal.goalId,
      goalTitle: trajectoryGoal.goalDraft.title,
      targetDate: trajectoryGoal.goalDraft.dueDate,
      status: trajectoryPlanSummary.status,
      startDate: trajectoryPlanSummary.startDate,
      explanation: trajectoryPlanSummary.explanation,
      effectiveCapacityHoursPerWeek: trajectoryPlanSummary.effectiveCapacityHoursPerWeek,
    };
  }, [trajectoryGoal, trajectoryPlanSummary]);

  const goBack = () => {
    setDirection(-1);
    setCurrentStep((value) => Math.max(1, value - 1));
  };

  const advance = (fromStep: number, toStep: number) => {
    trackOnboardingEvent('onboarding_step_completed', { step: fromStep });
    setDirection(1);
    setCurrentStep(Math.min(TOTAL_STEPS, toStep));
  };

  const handleComplete = () => {
    clearPersistedState();
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#08080c]">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-[#8F8577]">
          Onboarding wird vorbereitet...
        </motion.div>
      </div>
    );
  }

  return (
    <OnboardingLayout currentStep={currentStep} totalSteps={TOTAL_STEPS} canGoBack={canGoBack} onBack={goBack}>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {currentStep === 1 ? (
            <StepTrajectoryGoal
              initialValues={trajectoryGoalDraft}
              existingGoal={trajectoryGoal}
              capacityHoursPerWeek={trajectorySettingsDraft?.hoursPerWeek ?? trajectoryContextDraft?.weeklyFocusHours ?? 8}
              onNext={(goal, draft) => {
                setTrajectoryGoal(goal);
                setTrajectoryGoalDraft(draft);
                advance(1, 2);
              }}
            />
          ) : null}

          {currentStep === 2 && trajectoryGoal ? (
            <StepTrajectoryPlan
              goalId={trajectoryGoal.goalId}
              goalTitle={trajectoryGoal.goalDraft.title}
              targetDate={trajectoryGoal.goalDraft.dueDate}
              initialSettings={trajectorySettingsDraft}
              initialContext={trajectoryContextDraft}
              existingSummary={trajectoryPlanSummary}
              onNext={(settings, context, planSummary) => {
                setTrajectorySettingsDraft(settings);
                setTrajectoryContextDraft(context);
                setTrajectoryPlanSummary(planSummary);
                advance(2, 3);
              }}
            />
          ) : null}

          {currentStep === 3 ? (
            <StepComplete
              completedData={{
                trajectory: completeTrajectory,
              }}
              onComplete={handleComplete}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </OnboardingLayout>
  );
}
