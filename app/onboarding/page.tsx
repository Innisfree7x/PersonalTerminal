'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { fetchProfileAction } from '@/app/actions/profile';
import { trackOnboardingEvent } from '@/app/onboarding/analytics';
import { OnboardingLayout } from '@/components/features/onboarding/OnboardingLayout';
import { StepWelcome } from '@/components/features/onboarding/StepWelcome';
import { StepProfile } from '@/components/features/onboarding/StepProfile';
import { StepCourses, type CourseEntry } from '@/components/features/onboarding/StepCourses';
import { StepFirstTask, type TaskFormValues } from '@/components/features/onboarding/StepFirstTask';
import { StepComplete } from '@/components/features/onboarding/StepComplete';

const TOTAL_STEPS = 5;
const LS_KEY = 'prism_onboarding_v1';

interface PersistedState {
  step: number;
  name: string;
  coursesDraft: CourseEntry[] | null;
  taskDraft: TaskFormValues | null;
  coursesResult: { name: string }[] | null;
  taskResult: { title: string } | null;
}

function loadPersistedState(): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Partial<PersistedState>) : {};
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

  // Wizard data
  const [name, setName] = useState('');
  const [coursesDraft, setCoursesDraft] = useState<CourseEntry[] | null>(null);
  const [taskDraft, setTaskDraft] = useState<TaskFormValues | null>(null);
  const [coursesResult, setCoursesResult] = useState<{ name: string }[] | null>(null);
  const [taskResult, setTaskResult] = useState<{ title: string } | null>(null);
  const [demoSeeded, setDemoSeeded] = useState(false);
  const startedRef = useRef(false);

  // Load from localStorage + check profile on mount
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const stored = loadPersistedState();
      if (stored.step && stored.step > 1) {
        const clampedStep = Math.max(1, Math.min(stored.step, TOTAL_STEPS));
        setCurrentStep(clampedStep);
        setName(stored.name ?? '');
        setCoursesDraft(stored.coursesDraft ?? null);
        setTaskDraft(stored.taskDraft ?? null);
        setCoursesResult(stored.coursesResult ?? null);
        setTaskResult(stored.taskResult ?? null);
      }

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
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [router]);

  // Fire onboarding_started once when wizard is ready
  useEffect(() => {
    if (!loading && !startedRef.current) {
      startedRef.current = true;
      trackOnboardingEvent('onboarding_started');
    }
  }, [loading]);

  // Sync to localStorage
  useEffect(() => {
    if (loading) return;
    savePersistedState({ step: currentStep, name, coursesDraft, taskDraft, coursesResult, taskResult });
  }, [loading, currentStep, name, coursesDraft, taskDraft, coursesResult, taskResult]);

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

  const handleDemoSeeded = () => {
    setDemoSeeded(true);
    trackOnboardingEvent('onboarding_step_completed', { step: 1 });
    // Jump directly to complete screen
    setDirection(1);
    setCurrentStep(TOTAL_STEPS);
  };

  const handleComplete = () => {
    clearPersistedState();
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-background via-surface to-background">
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

  // Back available on steps 2-4 (not welcome, not complete)
  const canGoBack = currentStep > 1 && currentStep < TOTAL_STEPS;

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
            <StepCourses
              initialValues={coursesDraft}
              alreadyCreated={coursesResult}
              onNext={(results, drafts) => {
                setCoursesDraft(drafts.length > 0 ? drafts : null);
                if (results.length > 0) setCoursesResult(results);
                goNext();
              }}
            />
          )}

          {currentStep === 4 && (
            <StepFirstTask
              initialValues={taskDraft}
              alreadyCreated={taskResult}
              onNext={(task, draft) => {
                setTaskDraft(draft.title ? draft : null);
                if (task) setTaskResult(task);
                goNext();
              }}
            />
          )}

          {currentStep === TOTAL_STEPS && (
            <StepComplete
              completedData={{
                name,
                courses: coursesResult ?? [],
                task: taskResult,
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
