'use client';

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { CheckCircle2, GraduationCap, Flame, Briefcase, Zap, ArrowRight, CalendarClock, XCircle } from 'lucide-react';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { useRouter } from 'next/navigation';
import { useAppSound } from '@/lib/hooks/useAppSound';
import { usePrismCommandAction } from '@/lib/hooks/useCommandActions';
import type { RankedExecutionCandidate, ExecutionRiskSignal } from '@/lib/application/use-cases/execution-engine';
import { useStreak } from '@/lib/hooks/useStreak';
import { createDailyTaskAction, updateDailyTaskAction } from '@/app/actions/daily-tasks';
import { toggleExerciseCompletionAction } from '@/app/actions/university';
import { dispatchChampionEvent } from '@/lib/champion/championEvents';
import { getTodayKey, loadDismissedIds, persistDismissedIds } from '@/lib/dashboard/nbaDismissals';
import { STORAGE_KEYS } from '@/lib/storage/keys';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CommandBarProps {
  // Stats
  tasksToday: number;
  tasksCompleted: number;
  exercisesCompleted: number;
  exercisesTotal: number;
  nextExam: { name: string; daysUntilExam: number } | null;
  goalsDueSoon: number;
  interviewsUpcoming: number;
  // NBA
  executionScore: number;
  nextBestAction: RankedExecutionCandidate | null;
  alternatives: RankedExecutionCandidate[];
  riskSignals?: ExecutionRiskSignal[];
  onChanged?: () => void;
}

// ─── Tone color map ───────────────────────────────────────────────────────────

type Tone = 'task' | 'exercise' | 'streak' | 'career';

const TONE: Record<Tone, { icon: string; value: string; stripe: string }> = {
  task:     { icon: 'text-red-300/75',    value: 'text-red-300',    stripe: 'bg-current text-red-400/75' },
  exercise: { icon: 'text-amber-300/75',  value: 'text-amber-300',  stripe: 'bg-current text-amber-400/75' },
  streak:   { icon: 'text-orange-300/75', value: 'text-orange-300', stripe: 'bg-current text-orange-400/75' },
  career:   { icon: 'text-sky-300/75',    value: 'text-sky-300',    stripe: 'bg-current text-sky-400/70' },
};

// ─── RailChip (copied from DashboardStats) ────────────────────────────────────

type ChipTone = 'muted' | 'danger' | 'warning' | 'success' | 'info';

function PulseDot({ className }: { className: string }) {
  return (
    <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${className}`} />
      <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${className}`} />
    </span>
  );
}

function RailChip({ label, tone, pulse = false }: { label: string; tone: ChipTone; pulse?: boolean }) {
  const toneClasses: Record<ChipTone, string> = {
    muted:   'border-border/95 bg-surface/78 text-text-secondary',
    danger:  'border-red-500/35 bg-red-500/10 text-red-300',
    warning: 'border-amber-500/35 bg-amber-500/10 text-amber-300',
    success: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300',
    info:    'border-sky-500/35 bg-sky-500/10 text-sky-300',
  };
  const pulseColor: Record<ChipTone, string> = {
    muted:   'bg-text-tertiary',
    danger:  'bg-red-400',
    warning: 'bg-amber-400',
    success: 'bg-emerald-400',
    info:    'bg-sky-400',
  };
  const glowClasses: Record<ChipTone, string> = {
    muted:   '',
    danger:  'shadow-[0_0_8px_0px] shadow-red-500/25',
    warning: 'shadow-[0_0_8px_0px] shadow-amber-500/25',
    success: 'shadow-[0_0_8px_0px] shadow-emerald-500/25',
    info:    'shadow-[0_0_8px_0px] shadow-sky-500/25',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] transition-shadow duration-200 ${toneClasses[tone]} ${glowClasses[tone]}`}
    >
      {pulse ? <PulseDot className={pulseColor[tone]} /> : null}
      {label}
    </span>
  );
}

// ─── Separators ───────────────────────────────────────────────────────────────

function Sep() {
  return <div className="w-px self-stretch bg-gradient-to-b from-transparent via-border/60 to-transparent" />;
}

function GlowSep() {
  return (
    <div className="relative w-px self-stretch">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-border/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/25 to-transparent" />
    </div>
  );
}

// ─── StatChip ─────────────────────────────────────────────────────────────────

function StatChip({
  icon: Icon,
  tone,
  value,
  meta,
  label,
  chip,
}: {
  icon: LucideIcon;
  tone: Tone;
  value: number;
  meta?: string;
  label: string;
  chip?: ReactNode;
}) {
  const c = TONE[tone];
  return (
    <div className="group relative flex min-w-[140px] flex-1 items-center gap-2.5 overflow-hidden px-4 py-3 transition-all duration-200 hover:bg-primary/[0.08]">
      <div className={`absolute inset-y-2.5 left-0 w-0.5 rounded-r-full transition-all duration-200 ${c.stripe} group-hover:shadow-[0_0_6px_1px] group-hover:shadow-current`} />
      <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${c.icon}`} />
      <div className="min-w-0">
        <div className="flex items-baseline gap-1 leading-none">
          <span className={`text-[1.25rem] sm:text-[1.35rem] font-bold tabular-nums ${c.value}`}>
            <AnimatedCounter to={value} />
          </span>
          {meta && <span className="text-[11px] text-text-secondary/80">{meta}</span>}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.11em] text-text-secondary/75">{label}</span>
          {chip}
        </div>
      </div>
    </div>
  );
}

// ─── ActionSection (inline NBA, logic from NextBestActionWidget) ──────────────

interface ActionSectionProps {
  nextBestAction: RankedExecutionCandidate | null;
  alternatives: RankedExecutionCandidate[];
  riskSignals: ExecutionRiskSignal[];
  onChanged: (() => void) | undefined;
}

function ActionSection({ nextBestAction, alternatives, riskSignals, onChanged }: ActionSectionProps) {
  const router = useRouter();
  const { play } = useAppSound();
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
        toast.error(error instanceof Error ? error.message : 'Aktion konnte nicht ausgeführt werden. Bitte erneut versuchen.');
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
        toast.error(error instanceof Error ? error.message : 'Aufgabe konnte nicht für morgen eingeplant werden.');
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
    <div className="flex min-w-[220px] flex-shrink-0 items-center gap-2 px-3.5">
      <Zap className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
      {activeCandidate ? (
        <>
          <div className="min-w-0 flex-1">
            <motion.p
              key={activeCandidate.id}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              className="truncate text-[13px] font-medium leading-none text-text-primary"
            >
              {activeCandidate.title}
            </motion.p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.11em] text-text-secondary/75">
                {activeCandidate.urgencyLabel}
              </span>
              {topRisk && (
                <span className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-warning">
                  · {topRisk.severity}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleDoNow}
            disabled={isPending}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-primary/30 bg-primary/15 px-2.5 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/25 disabled:opacity-50"
          >
            <ArrowRight className="h-3 w-3" /> Do now
          </button>
          <button
            onClick={handlePlanLater}
            disabled={isPending}
            title="Plan tomorrow"
            className="shrink-0 rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <CalendarClock className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDrop}
            disabled={isPending}
            title="Drop"
            className="shrink-0 rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-error/10 hover:text-error"
          >
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        <span className="text-xs text-text-tertiary">No pending actions</span>
      )}
    </div>
  );
}

// ─── CommandBar ───────────────────────────────────────────────────────────────

export default function CommandBar({
  tasksToday,
  tasksCompleted,
  exercisesCompleted,
  exercisesTotal,
  nextExam,
  goalsDueSoon,
  interviewsUpcoming,
  executionScore: _executionScore,
  nextBestAction,
  alternatives,
  riskSignals = [],
  onChanged,
}: CommandBarProps) {
  const { streak } = useStreak();
  const { play } = useAppSound();
  const doneSignalRef = useRef(false);

  const allDone = tasksToday > 0 && tasksCompleted >= tasksToday;
  const examDays = nextExam?.daysUntilExam ?? null;
  const examUrgent = examDays !== null && examDays <= 1;
  const examWarning = examDays !== null && examDays <= 7;

  useEffect(() => {
    if (!allDone || tasksToday <= 0) {
      doneSignalRef.current = false;
      return;
    }
    if (typeof window === 'undefined') return;

    const today = getTodayKey();
    const alreadySignaled = window.localStorage.getItem(STORAGE_KEYS.todayDoneSignalDate) === today;
    if (alreadySignaled || doneSignalRef.current) return;

    doneSignalRef.current = true;
    window.localStorage.setItem(STORAGE_KEYS.todayDoneSignalDate, today);
    play('task-completed');
    dispatchChampionEvent({ type: 'DONE_FOR_TODAY', completed: tasksCompleted, total: tasksToday });
    toast.success('Done for today. Starker Abschluss.');
  }, [allDone, play, tasksCompleted, tasksToday]);

  const taskChip = allDone ? (
    <RailChip label="Clear" tone="success" />
  ) : tasksCompleted === 0 && tasksToday > 0 ? (
    <RailChip label="Hot" tone="danger" pulse />
  ) : undefined;

  const examChip =
    examDays === null ? undefined : (
      <RailChip
        label={examDays < 0 ? `${Math.abs(examDays)}d late` : `Exam ${examDays}d`}
        tone={examUrgent ? 'danger' : examWarning ? 'warning' : 'muted'}
        pulse={examUrgent}
      />
    );

  const streakChip = (
    <RailChip label={streak > 0 ? 'Active' : 'Cold'} tone={streak > 0 ? 'warning' : 'muted'} pulse={streak > 0} />
  );

  const careerChip =
    goalsDueSoon > 0 ? (
      <RailChip label={`${goalsDueSoon} due`} tone="danger" pulse />
    ) : interviewsUpcoming > 0 ? (
      <RailChip label={`${interviewsUpcoming} live`} tone="info" />
    ) : undefined;

  return (
    <div className="card-warm relative overflow-hidden rounded-xl border shadow-2xl">
      {/* Top inset highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      {/* Bottom 4-color gradient line */}
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            'linear-gradient(to right, rgba(248,113,113,0.45) 0%, rgba(251,191,36,0.45) 33%, rgba(251,146,60,0.45) 66%, rgba(56,189,248,0.42) 100%)',
        }}
      />

      <div className="relative flex items-stretch overflow-x-auto">
        <StatChip
          icon={CheckCircle2}
          tone="task"
          value={tasksCompleted}
          meta={`/ ${tasksToday}`}
          label="Tasks"
          chip={taskChip}
        />
        <Sep />
        <StatChip
          icon={GraduationCap}
          tone="exercise"
          value={exercisesCompleted}
          meta={`/ ${exercisesTotal}`}
          label="Exercises"
          chip={examChip}
        />
        <Sep />
        <StatChip
          icon={Flame}
          tone="streak"
          value={streak}
          meta="days"
          label="Streak"
          chip={streakChip}
        />
        <Sep />
        <StatChip
          icon={Briefcase}
          tone="career"
          value={interviewsUpcoming}
          label="Career"
          chip={careerChip}
        />
        <GlowSep />
        <ActionSection
          nextBestAction={nextBestAction}
          alternatives={alternatives}
          riskSignals={riskSignals}
          onChanged={onChanged}
        />
      </div>
    </div>
  );
}
