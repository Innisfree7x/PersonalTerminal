'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, ArrowRight, Compass, Info } from 'lucide-react';
import { updateProfileAction } from '@/app/actions/profile';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { trackOnboardingEvent } from '@/app/onboarding/analytics';

type TrajectoryStatus = 'on_track' | 'tight' | 'at_risk';

interface CompletedData {
  name: string;
  trajectory: {
    goalId: string;
    status: TrajectoryStatus;
    startDate: string;
    explanation: string;
    effectiveCapacityHoursPerWeek: number;
    horizonMonths: number;
  } | null;
  demoSeeded?: boolean;
}

interface StepCompleteProps {
  completedData: CompletedData;
  onComplete?: () => void;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

function formatDateLabel(dateIso: string): string {
  const parsed = new Date(`${dateIso}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return dateIso;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function statusVariant(status: TrajectoryStatus): 'success' | 'warning' | 'error' {
  if (status === 'on_track') return 'success';
  if (status === 'tight') return 'warning';
  return 'error';
}

function statusLabel(status: TrajectoryStatus): string {
  if (status === 'on_track') return 'on track';
  if (status === 'tight') return 'tight';
  return 'at risk';
}

export function StepComplete({ completedData, onComplete }: StepCompleteProps) {
  const router = useRouter();
  const firedRef = useRef(false);
  const [savingTarget, setSavingTarget] = useState<'trajectory' | 'today' | null>(null);
  const [error, setError] = useState('');

  const trajectoryReady = completedData.trajectory !== null;

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        origin: { y: 0.6 },
        ...opts,
        particleCount: Math.floor(200 * particleRatio),
      });
    };

    const t = setTimeout(() => {
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }, 200);

    return () => clearTimeout(t);
  }, []);

  const handleFinalize = async (destination: '/trajectory' | '/today') => {
    if (!completedData.trajectory) {
      setError('Trajectory data fehlt. Bitte gehe zurück zu Schritt 4 und berechne den Plan erneut.');
      return;
    }

    setError('');
    setSavingTarget(destination === '/trajectory' ? 'trajectory' : 'today');
    try {
      await updateProfileAction({ onboardingCompleted: true });
      trackOnboardingEvent('onboarding_completed', {
        trajectory_status: completedData.trajectory.status,
        trajectory_goal_id: completedData.trajectory.goalId,
        destination,
        demo_seeded: completedData.demoSeeded ?? false,
      });
      onComplete?.();

      const displayName = completedData.name.trim();
      toast.success(displayName ? `Willkommen, ${displayName}!` : 'Willkommen bei INNIS!');
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onboarding konnte nicht abgeschlossen werden.');
    } finally {
      setSavingTarget(null);
    }
  };

  const displayName = completedData.name.trim() || 'dir';

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="text-center">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10"
        >
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </motion.div>
        <h2 className="mb-2 text-2xl font-bold text-text-primary">
          INNIS ist bereit,{' '}
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {displayName}!
          </span>
        </h2>
        <p className="text-sm text-text-secondary">
          Dein Trajectory-Setup ist abgeschlossen. Du kannst direkt loslegen.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-3 rounded-xl border border-primary/20 bg-primary/10 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-text-primary">Trajectory status</p>
          {completedData.trajectory ? (
            <Badge size="sm" variant={statusVariant(completedData.trajectory.status)}>
              {statusLabel(completedData.trajectory.status)}
            </Badge>
          ) : (
            <Badge size="sm" variant="error">
              missing
            </Badge>
          )}
        </div>

        {completedData.trajectory ? (
          <>
            <p className="text-sm text-text-secondary">
              Prep starts {formatDateLabel(completedData.trajectory.startDate)}
            </p>
            <p className="text-xs text-text-tertiary">{completedData.trajectory.explanation}</p>
            <p className="text-xs text-text-tertiary">
              Capacity {completedData.trajectory.effectiveCapacityHoursPerWeek}h/week · horizon {completedData.trajectory.horizonMonths} months
            </p>
          </>
        ) : (
          <p className="text-xs text-error">
            Completion ist gesperrt, bis Goal + Capacity + Plan erfolgreich gespeichert wurden.
          </p>
        )}
      </motion.div>

      {completedData.demoSeeded && (
        <motion.div variants={itemVariants}>
          <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/10 p-3">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-text-secondary">
              Demo seed aktiv: Du kannst die Beispiel-Daten später unter{' '}
              <span className="font-medium text-text-primary">Einstellungen → Daten</span> entfernen.
            </p>
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-hover p-3">
          <span className="mt-0.5 flex-shrink-0 text-sm">⚡</span>
          <p className="text-xs leading-relaxed text-text-secondary">
            <span className="font-medium text-text-primary">Lucian ist aktiv.</span>{' '}
            Deine nächsten Schritte werden jetzt mit Fokus- und Risiko-Signalen priorisiert.
          </p>
        </div>
      </motion.div>

      {error ? (
        <motion.div variants={itemVariants}>
          <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">{error}</div>
        </motion.div>
      ) : null}

      <motion.div variants={itemVariants} className="space-y-2">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={() => handleFinalize('/trajectory')}
          loading={savingTarget === 'trajectory'}
          disabled={!trajectoryReady || savingTarget !== null}
          rightIcon={<Compass className="h-4 w-4" />}
        >
          Open Trajectory
        </Button>

        <Button
          variant="ghost"
          fullWidth
          size="lg"
          onClick={() => handleFinalize('/today')}
          loading={savingTarget === 'today'}
          disabled={!trajectoryReady || savingTarget !== null}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Go to Today
        </Button>
      </motion.div>
    </motion.div>
  );
}
