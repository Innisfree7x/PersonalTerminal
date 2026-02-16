'use client';

import { useMemo, useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Zap, ArrowRight, CalendarClock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useRouter } from 'next/navigation';
import { useAppSound } from '@/lib/hooks/useAppSound';
import { usePrismCommandAction } from '@/lib/hooks/useCommandActions';
import type { RankedExecutionCandidate } from '@/lib/application/use-cases/execution-engine';
import type { ExecutionRiskSignal } from '@/lib/application/use-cases/execution-engine';
import { createDailyTaskAction, updateDailyTaskAction } from '@/app/actions/daily-tasks';
import { toggleExerciseCompletionAction } from '@/app/actions/university';

interface NextBestActionWidgetProps {
  executionScore: number;
  nextBestAction: RankedExecutionCandidate | null;
  alternatives: RankedExecutionCandidate[];
  riskSignals?: ExecutionRiskSignal[];
  onChanged?: () => void;
}

const DISMISS_STORAGE_KEY = 'prism:nba:dismissed';

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

function loadDismissedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set<string>();
  try {
    const raw = window.sessionStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw) as Record<string, string[]>;
    return new Set(parsed[getTodayKey()] ?? []);
  } catch {
    return new Set<string>();
  }
}

function persistDismissedIds(ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.sessionStorage.getItem(DISMISS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    parsed[getTodayKey()] = Array.from(ids);
    window.sessionStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore storage failures
  }
}

function scoreTone(score: number): {
  label: string;
  badgeVariant: 'success' | 'warning' | 'error' | 'primary';
} {
  if (score >= 80) return { label: 'Elite', badgeVariant: 'success' };
  if (score >= 60) return { label: 'Solid', badgeVariant: 'primary' };
  if (score >= 40) return { label: 'Recover', badgeVariant: 'warning' };
  return { label: 'Reset', badgeVariant: 'error' };
}

export default function NextBestActionWidget({
  executionScore,
  nextBestAction,
  alternatives,
  riskSignals = [],
  onChanged,
}: NextBestActionWidgetProps) {
  const router = useRouter();
  const { play } = useAppSound();
  const [isPending, startTransition] = useTransition();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => loadDismissedIds());

  const candidates = useMemo(
    () => [nextBestAction, ...alternatives].filter((candidate): candidate is RankedExecutionCandidate => candidate !== null),
    [nextBestAction, alternatives]
  );

  const activeCandidate = useMemo(
    () => candidates.find((candidate) => !dismissedIds.has(candidate.id)) ?? null,
    [candidates, dismissedIds]
  );

  const tone = scoreTone(executionScore);
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
        play('pop');
        toast.success('Task completed');
        break;
      }
      case 'homework': {
        const courseId = String(payload.courseId ?? '');
        const exerciseNumber = Number(payload.exerciseNumber ?? 0);
        if (!courseId || !exerciseNumber) throw new Error('Missing homework payload');
        await toggleExerciseCompletionAction(courseId, exerciseNumber, true);
        play('pop');
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
        toast.error(error instanceof Error ? error.message : 'Failed to execute action');
      }
    });
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
        toast.success('Moved to tomorrow');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to plan action');
      }
    });
  };

  const handleDrop = () => {
    if (!activeCandidate) return;
    play('click');
    dismissCandidate(activeCandidate.id);
    toast.success('Action removed from today');
  };

  usePrismCommandAction('start-next-best-action', () => {
    if (!activeCandidate || isPending) return;
    handleDoNow();
  });

  return (
    <div className="card-surface rounded-xl p-3 border border-border">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/15 border border-primary/30">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Next Best Action</h2>
            <p className="text-[10px] text-text-tertiary">One high-impact move for right now</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={tone.badgeVariant} size="sm">
            {tone.label}
          </Badge>
          <div className="text-right leading-tight">
            <div className="text-base font-bold text-text-primary">{executionScore}</div>
            <div className="text-[9px] uppercase tracking-wider text-text-tertiary">Execution</div>
          </div>
        </div>
      </div>

      {activeCandidate ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-1.5 mb-2">
            <motion.div
              key={activeCandidate.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-primary/30 bg-primary/5 p-2.5"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Badge variant="primary" size="sm">
                  {activeCandidate.urgencyLabel}
                </Badge>
                <span className="text-[11px] text-text-tertiary">score {Math.round(activeCandidate.score)}</span>
              </div>
              <div className="text-base font-semibold text-text-primary leading-tight">{activeCandidate.title}</div>
              {activeCandidate.subtitle && (
                <div className="text-[11px] text-text-tertiary mt-0.5">{activeCandidate.subtitle}</div>
              )}
              {activeCandidate.reasons.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {activeCandidate.reasons.slice(0, 1).map((reason) => (
                    <span
                      key={reason}
                      className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[9px] uppercase tracking-wider text-text-tertiary"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {topRisk ? (
              <div className="rounded-lg border border-warning/30 bg-warning/10 px-2.5 py-2">
                <div className="text-[10px] uppercase tracking-wider text-warning font-semibold">
                  Risk: {topRisk.severity}
                </div>
                <div className="text-sm text-text-primary leading-tight">{topRisk.title}</div>
                <div className="text-[11px] text-text-tertiary">{topRisk.detail}</div>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-surface/40 px-2.5 py-2 text-[11px] text-text-tertiary flex items-center">
                No high risk signal right now.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
            <Button onClick={handleDoNow} disabled={isPending} variant="primary" size="sm" className="w-full h-9">
              <ArrowRight className="w-4 h-4 mr-2" />
              Do now
            </Button>
            <Button onClick={handlePlanLater} disabled={isPending} variant="secondary" size="sm" className="w-full h-9">
              <CalendarClock className="w-4 h-4 mr-2" />
              Plan later
            </Button>
            <Button onClick={handleDrop} disabled={isPending} variant="ghost" size="sm" className="w-full h-9">
              <XCircle className="w-4 h-4 mr-2" />
              Drop
            </Button>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-border bg-surface/50 p-3 text-sm text-text-tertiary">
          No pending recommendation. Open Command Bar (`Cmd/Ctrl + K`) and run
          {' '}
          <span className="font-semibold text-text-secondary">Start Next Best Action</span>
          {' '}
          after new tasks appear.
        </div>
      )}
    </div>
  );
}
