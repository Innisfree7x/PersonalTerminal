'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Compass } from 'lucide-react';
import { updateProfileAction } from '@/app/actions/profile';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { trackOnboardingEvent } from '@/app/onboarding/analytics';
import { formatTrajectoryRiskLabel } from '@/lib/trajectory/risk-model';

type TrajectoryStatus = 'on_track' | 'tight' | 'at_risk';

interface CompletedData {
  trajectory: {
    goalId: string;
    goalTitle: string;
    status: TrajectoryStatus;
    startDate: string;
    explanation: string;
    effectiveCapacityHoursPerWeek: number;
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
  return parsed.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function StepComplete({ completedData, onComplete }: StepCompleteProps) {
  const router = useRouter();
  const firedRef = useRef(false);
  const [savingTarget, setSavingTarget] = useState<'trajectory' | 'today' | null>(null);
  const [error, setError] = useState('');

  const trajectory = completedData.trajectory;

  const statusColor = !trajectory
    ? { border: 'border-red-500/25', bg: 'bg-red-500/8', text: 'text-red-400', dot: 'bg-red-400' }
    : trajectory.status === 'on_track'
      ? { border: 'border-emerald-500/25', bg: 'bg-emerald-500/8', text: 'text-emerald-400', dot: 'bg-emerald-400' }
      : trajectory.status === 'tight'
        ? { border: 'border-[#E8B930]/25', bg: 'bg-[#E8B930]/8', text: 'text-[#E8B930]', dot: 'bg-[#E8B930]' }
        : { border: 'border-red-500/25', bg: 'bg-red-500/8', text: 'text-red-400', dot: 'bg-red-400' };

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
        demo_seeded: completedData.demoSeeded ?? false,
      });
      onComplete?.();
      toast.success('Willkommen bei INNIS!');
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onboarding konnte nicht abgeschlossen werden.');
    } finally {
      setSavingTarget(null);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#E8B930]/20 bg-[#E8B930]/[0.08]"
        >
          <span className="text-3xl">⚡</span>
        </motion.div>
        <h2 className="mb-2 text-2xl font-bold text-[#FAF0E6]">
          Dein Terminal ist{' '}
          <span className="bg-gradient-to-r from-[#E8B930] via-[#F5D565] to-[#E8B930] bg-clip-text text-transparent">
            bereit.
          </span>
        </h2>
        <p className="text-sm text-zinc-400">
          Trajectory ist konfiguriert. Prüfe deinen Plan und starte die Execution.
        </p>
      </motion.div>

      {/* Trajectory summary card */}
      {trajectory ? (
        <motion.div variants={itemVariants} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          {/* Status header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04]">
            <p className="text-[13px] font-medium text-[#FAF0E6]">{trajectory.goalTitle}</p>
            <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusColor.border} ${statusColor.bg} ${statusColor.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${statusColor.dot} animate-pulse`} />
              {formatTrajectoryRiskLabel(trajectory.status)}
            </span>
          </div>
          {/* Details */}
          {[
            { label: 'Prep Start', value: formatDateLabel(trajectory.startDate) },
            { label: 'Kapazität', value: `${trajectory.effectiveCapacityHoursPerWeek}h / Woche` },
          ].map((row, i) => (
            <div
              key={row.label}
              className={`flex items-center justify-between px-5 py-3 ${i < 1 ? 'border-b border-white/[0.04]' : ''}`}
            >
              <span className="text-[12px] text-zinc-500">{row.label}</span>
              <span className="text-[12px] font-medium text-[#FAF0E6]">{row.value}</span>
            </div>
          ))}
          <div className="px-5 py-3 border-t border-white/[0.04]">
            <p className="text-[11px] text-zinc-500 leading-relaxed">{trajectory.explanation}</p>
          </div>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants}>
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">
              Trajectory-Daten fehlen. Bitte gehe zurück zu Schritt 2.
            </p>
          </div>
        </motion.div>
      )}

      {/* Demo seed hint */}
      {completedData.demoSeeded && (
        <motion.div variants={itemVariants}>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Demo-Daten aktiv — entfernbar unter{' '}
              <span className="font-medium text-zinc-300">Einstellungen → Daten</span>
            </p>
          </div>
        </motion.div>
      )}

      {error ? (
        <motion.div variants={itemVariants}>
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
        </motion.div>
      ) : null}

      {/* CTAs */}
      <motion.div variants={itemVariants} className="space-y-2">
        <button
          type="button"
          onClick={() => handleFinalize('/trajectory')}
          disabled={!trajectory || savingTarget !== null}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#E8B930] px-6 py-3 text-sm font-semibold text-[#0A0A0C] transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none"
        >
          {savingTarget === 'trajectory' ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0C]/30 border-t-[#0A0A0C]" />
          ) : (
            <Compass className="h-4 w-4" />
          )}
          Trajectory öffnen
        </button>

        <button
          type="button"
          onClick={() => handleFinalize('/today')}
          disabled={!trajectory || savingTarget !== null}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-transparent px-6 py-3 text-sm font-medium text-zinc-300 transition-all hover:border-[#E8B930]/30 hover:text-[#FAF0E6] disabled:opacity-50 disabled:pointer-events-none"
        >
          {savingTarget === 'today' ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500/30 border-t-zinc-300" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          Direkt zu Today
        </button>
      </motion.div>
    </motion.div>
  );
}
