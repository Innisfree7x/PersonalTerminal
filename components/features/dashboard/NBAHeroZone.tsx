'use client';

import { useMemo, useState, useTransition } from 'react';
import { Zap, ArrowRight, CalendarClock, XCircle, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAppSound } from '@/lib/hooks/useAppSound';
import {
  useFocusTimerActions,
  useFocusTimerSession,
} from '@/components/providers/FocusTimerProvider';
import { createDailyTaskAction, updateDailyTaskAction } from '@/app/actions/daily-tasks';
import { toggleExerciseCompletionAction } from '@/app/actions/university';
import { dispatchChampionEvent } from '@/lib/champion/championEvents';
import { getTodayKey, loadDismissedIds, persistDismissedIds } from '@/lib/dashboard/nbaDismissals';
import type { RankedExecutionCandidate, ExecutionRiskSignal } from '@/lib/application/use-cases/execution-engine';

interface NBAHeroZoneProps {
  nextBestAction: RankedExecutionCandidate | null;
  alternatives: RankedExecutionCandidate[];
  riskSignals: ExecutionRiskSignal[];
  onChanged: (() => void) | undefined;
}

export default function NBAHeroZone({ nextBestAction, alternatives, riskSignals, onChanged }: NBAHeroZoneProps) {
  const router = useRouter();
  const { play } = useAppSound();
  const { status: timerStatus } = useFocusTimerSession();
  const { startTimer } = useFocusTimerActions();
  const [isPending, startTransition] = useTransition();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => loadDismissedIds());

  const candidates = useMemo(
    () => [nextBestAction, ...alternatives].filter((c): c is RankedExecutionCandidate => c !== null),
    [nextBestAction, alternatives],
  );

  const activeCandidate = useMemo(
    () => candidates.find((c) => !dismissedIds.has(c.id)) ?? null,
    [candidates, dismissedIds],
  );

  const topRisk = riskSignals[0];

  const dismissCandidate = (id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      persistDismissedIds(next);
      return next;
    });
  };

  const completeCandidateNow = async (candidate: RankedExecutionCandidate) => {
    const payload = candidate.payload ?? {};
    switch (candidate.type) {
      case 'daily-task': {
        const taskId = String(payload.taskId ?? '');
        if (!taskId) throw new Error('Missing task id');
        await updateDailyTaskAction(taskId, { completed: true });
        play('task-completed');
        dispatchChampionEvent({ type: 'TASK_COMPLETED' });
        toast.success('Task completed');
        break;
      }
      case 'homework': {
        const courseId = String(payload.courseId ?? '');
        const exerciseNumber = Number(payload.exerciseNumber ?? 0);
        if (!courseId || !exerciseNumber) throw new Error('Missing homework payload');
        await toggleExerciseCompletionAction(courseId, exerciseNumber, true);
        play('task-completed');
        dispatchChampionEvent({ type: 'EXERCISE_COMPLETED' });
        toast.success('Exercise completed');
        break;
      }
      case 'goal': {
        await createDailyTaskAction({
          title: `Goal sprint: ${candidate.title}`,
          date: getTodayKey(),
          source: 'manual',
        });
        play('swoosh');
        toast.success('Goal converted to today task');
        break;
      }
      case 'interview': {
        play('swoosh');
        toast.success('Opening career board');
        router.push('/career');
        break;
      }
      default:
        break;
    }
  };

  const handleDoNow = () => {
    if (!activeCandidate) return;
    startTransition(async () => {
      try {
        await completeCandidateNow(activeCandidate);
        dismissCandidate(activeCandidate.id);
        onChanged?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Aktion fehlgeschlagen.');
      }
    });
  };

  const handleFocusStart = () => {
    if (!activeCandidate) return;
    const label = activeCandidate.title;
    startTimer({ label });
    play('swoosh');
    toast.success(`Focus gestartet: ${label}`);
  };

  const handlePlanLater = () => {
    if (!activeCandidate) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = tomorrow.toISOString().split('T')[0] ?? '';
    startTransition(async () => {
      try {
        await createDailyTaskAction({
          title: `Plan: ${activeCandidate.title}`,
          date: tomorrowKey,
          source: 'manual',
        });
        play('click');
        dismissCandidate(activeCandidate.id);
        onChanged?.();
        toast.success('Auf morgen verschoben');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Verschieben fehlgeschlagen.');
      }
    });
  };

  const handleDrop = () => {
    if (!activeCandidate) return;
    play('click');
    dismissCandidate(activeCandidate.id);
    toast.success('Aktion entfernt');
  };

  const timerRunning = timerStatus === 'running' || timerStatus === 'paused';

  if (!activeCandidate) {
    return (
      <div className="card-surface dashboard-premium-card relative overflow-hidden rounded-xl p-6 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <p className="text-sm text-text-secondary">Kein offener Move — gut gemacht.</p>
      </div>
    );
  }

  return (
    <div className="card-surface dashboard-premium-card relative overflow-hidden rounded-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-r-full bg-primary/70 shadow-[0_0_12px_rgb(var(--primary)/0.35)]" />

      <div className="px-5 py-4 sm:px-6 sm:py-5">
        {/* Header: label + risk */}
        <div className="mb-1 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/80">
            Nächster Move
          </span>
          {topRisk && (
            <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[9px] font-semibold uppercase text-warning">
              {topRisk.severity}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 key={activeCandidate.id} className="text-lg font-semibold text-text-primary sm:text-xl">
          {activeCandidate.title}
        </h2>

        {/* Meta */}
        <p className="mt-1 text-[12px] text-text-secondary">
          {activeCandidate.urgencyLabel}
          {activeCandidate.type === 'homework' && ' · Übung'}
          {activeCandidate.type === 'goal' && ' · Ziel'}
          {activeCandidate.type === 'interview' && ' · Interview'}
        </p>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!timerRunning && (
            <button
              onClick={handleFocusStart}
              className="inline-flex items-center gap-2 rounded-lg bg-primary/15 border border-primary/30 px-4 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/25"
            >
              <Play className="h-3.5 w-3.5" />
              Focus starten
            </button>
          )}
          <button
            onClick={handleDoNow}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
          >
            <ArrowRight className="h-3 w-3" />
            Erledigt
          </button>
          <button
            onClick={handlePlanLater}
            disabled={isPending}
            title="Auf morgen verschieben"
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <CalendarClock className="h-4 w-4" />
          </button>
          <button
            onClick={handleDrop}
            disabled={isPending}
            title="Entfernen"
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-error/10 hover:text-error"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
