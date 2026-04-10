'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Compass } from 'lucide-react';
import { updateProfileAction } from '@/app/actions/profile';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { trackOnboardingEvent } from '@/app/onboarding/analytics';
import { RiskStatusCard } from '@/components/features/onboarding/RiskStatusCard';
import { Button } from '@/components/ui/Button';

import type { TrajectoryRiskStatus, TrajectoryPlanSummary } from '@/components/features/onboarding/StepTrajectoryPlan';

interface CompletedData {
  trajectory: {
    goalId: string;
    goalTitle: string;
    targetDate: string;
    status: TrajectoryRiskStatus;
    startDate: string;
    explanation: string;
    effectiveCapacityHoursPerWeek: number;
  } | null;
}

interface StepCompleteProps {
  completedData: CompletedData;
  onComplete?: () => void;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function StepComplete({ completedData, onComplete }: StepCompleteProps) {
  const router = useRouter();
  const firedRef = useRef(false);
  const [savingTarget, setSavingTarget] = useState<'trajectory' | 'today' | null>(null);
  const [error, setError] = useState('');

  const trajectory = completedData.trajectory;
  const summary: TrajectoryPlanSummary | null = trajectory
    ? {
        status: trajectory.status,
        startDate: trajectory.startDate,
        explanation: trajectory.explanation,
        effectiveCapacityHoursPerWeek: trajectory.effectiveCapacityHoursPerWeek,
      }
    : null;

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({ origin: { y: 0.6 }, ...opts, particleCount: Math.floor(180 * particleRatio) });
    };

    const timeout = setTimeout(() => {
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    }, 120);

    return () => clearTimeout(timeout);
  }, []);

  const handleFinalize = async (destination: '/trajectory' | '/today') => {
    if (!trajectory) {
      setError('Trajectory-Daten fehlen. Bitte gehe zurück und berechne den Plan.');
      return;
    }

    setError('');
    setSavingTarget(destination === '/trajectory' ? 'trajectory' : 'today');

    try {
      await updateProfileAction({ onboardingCompleted: true });
      trackOnboardingEvent('onboarding_completed', {
        trajectory_status: trajectory.status,
        trajectory_goal_id: trajectory.goalId,
        destination,
      });
      onComplete?.();
      toast.success('Willkommen bei INNIS');
      router.push(destination);
      router.refresh();
    } catch (completionError) {
      setError(completionError instanceof Error ? completionError.message : 'Onboarding konnte nicht abgeschlossen werden.');
    } finally {
      setSavingTarget(null);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="space-y-3 text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#E8B930]/20 bg-[#E8B930]/10 text-2xl">
          ⚡
        </div>
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#8F8577]">Kapitel 3 · Dein Status</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#FAF0E6]">Dein erster strategischer Status ist da.</h1>
          <p className="text-sm leading-6 text-[#C5B9A8]">
            Genau dieser Moment ist der Kern von INNIS: nicht nur planen, sondern sofort sehen, ob dein Vorhaben unter realen Bedingungen tragfähig ist.
          </p>
        </div>
      </motion.div>

      {trajectory && summary ? (
        <motion.div variants={itemVariants}>
          <RiskStatusCard goalTitle={trajectory.goalTitle} targetDate={trajectory.targetDate} summary={summary} />
        </motion.div>
      ) : (
        <motion.div variants={itemVariants}>
          <div className="rounded-2xl border border-[#DC3232]/25 bg-[#DC3232]/10 p-4 text-sm text-[#F5B0B0]">
            Trajectory-Daten fehlen. Bitte gehe zurück zu Schritt 2.
          </div>
        </motion.div>
      )}

      {error ? (
        <motion.div variants={itemVariants}>
          <div className="rounded-2xl border border-[#DC3232]/25 bg-[#DC3232]/10 p-3 text-sm text-[#F5B0B0]">{error}</div>
        </motion.div>
      ) : null}

      <motion.div variants={itemVariants} className="space-y-3">
        <Button
          type="button"
          variant="primary"
          fullWidth
          size="lg"
          onClick={() => handleFinalize('/today')}
          disabled={!trajectory || savingTarget !== null}
          rightIcon={savingTarget === 'today' ? undefined : <ArrowRight className="h-4 w-4" />}
          loading={savingTarget === 'today'}
        >
          INNIS starten
        </Button>

        <button
          type="button"
          onClick={() => handleFinalize('/trajectory')}
          disabled={!trajectory || savingTarget !== null}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-transparent px-6 py-3 text-sm font-medium text-[#C5B9A8] transition hover:border-[#E8B930]/25 hover:text-[#FAF0E6] disabled:pointer-events-none disabled:opacity-50"
        >
          {savingTarget === 'trajectory' ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500/30 border-t-zinc-300" /> : <Compass className="h-4 w-4" />}
          Trajectory öffnen
        </button>
      </motion.div>
    </motion.div>
  );
}
