'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { CheckCircle2, GraduationCap, Briefcase, Flame } from 'lucide-react';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

interface DashboardStatsProps {
  tasksToday: number;
  tasksCompleted: number;
  exercisesCompleted: number;
  exercisesTotal: number;
  nextExam: { name: string; daysUntilExam: number } | null;
  goalsDueSoon: number;
  interviewsUpcoming: number;
}

function PulseDot({ className }: { className: string }) {
  return (
    <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${className}`} />
      <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${className}`} />
    </span>
  );
}

function Sep() {
  return <div className="w-px self-stretch bg-gradient-to-b from-transparent via-border to-transparent" />;
}

type ChipTone = 'muted' | 'danger' | 'warning' | 'success' | 'info';

function RailChip({ label, tone, pulse = false }: { label: string; tone: ChipTone; pulse?: boolean }) {
  const toneClasses: Record<ChipTone, string> = {
    muted: 'border-white/[0.1] bg-white/[0.04] text-text-tertiary',
    danger: 'border-red-500/35 bg-red-500/10 text-red-300',
    warning: 'border-amber-500/35 bg-amber-500/10 text-amber-300',
    success: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300',
    info: 'border-sky-500/35 bg-sky-500/10 text-sky-300',
  };
  const pulseColor: Record<ChipTone, string> = {
    muted: 'bg-zinc-400',
    danger: 'bg-red-400',
    warning: 'bg-amber-400',
    success: 'bg-emerald-400',
    info: 'bg-sky-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] ${toneClasses[tone]}`}
    >
      {pulse ? <PulseDot className={pulseColor[tone]} /> : null}
      {label}
    </span>
  );
}

type RailTone = 'task' | 'exercise' | 'streak' | 'career';

const RAIL_TONE: Record<RailTone, { icon: string; value: string; progress: string; glow: string }> = {
  task: {
    icon: 'text-red-300/75',
    value: 'text-red-300/95',
    progress: 'bg-red-400/60',
    glow: 'from-red-500/10',
  },
  exercise: {
    icon: 'text-amber-300/75',
    value: 'text-amber-300/95',
    progress: 'bg-amber-400/60',
    glow: 'from-amber-500/10',
  },
  streak: {
    icon: 'text-orange-300/75',
    value: 'text-orange-300/95',
    progress: 'bg-orange-400/60',
    glow: 'from-orange-500/10',
  },
  career: {
    icon: 'text-sky-300/75',
    value: 'text-sky-300/90',
    progress: 'bg-sky-400/55',
    glow: 'from-sky-500/8',
  },
};

function RailSegment({
  icon: Icon,
  tone,
  label,
  value,
  valueMeta,
  subtitle,
  chip,
  progress,
}: {
  icon: LucideIcon;
  tone: RailTone;
  label: string;
  value: ReactNode;
  valueMeta?: string;
  subtitle: string;
  chip?: ReactNode;
  progress: number;
}) {
  const style = RAIL_TONE[tone];
  const clampedProgress = Math.max(0, Math.min(progress, 100));

  return (
    <div className="group relative flex flex-1 min-w-[200px] items-center px-4 py-2.5 transition-colors hover:bg-surface-hover/50">
      <div className={`pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r ${style.glow} to-transparent opacity-55`} />
      <div className="relative z-10 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 flex-shrink-0 ${style.icon}`} />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-text-tertiary/70">
            {label}
          </span>
          {chip ? <div className="ml-auto">{chip}</div> : null}
        </div>

        <div className="mt-1 flex items-baseline gap-1.5 leading-none">
          <span className={`text-[1.65rem] font-black leading-none tabular-nums ${style.value}`}>{value}</span>
          {valueMeta ? <span className="mb-0.5 text-sm font-medium text-text-tertiary/60">{valueMeta}</span> : null}
        </div>

        <p className="mt-1 text-[11px] text-text-tertiary/80">{subtitle}</p>

        <div className="mt-2 h-[1.5px] w-full rounded-full bg-border/60">
          <motion.div
            className={`h-[1.5px] rounded-full ${style.progress}`}
            initial={{ width: 0 }}
            animate={{ width: `${clampedProgress}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function DashboardStats({
  tasksToday,
  tasksCompleted,
  exercisesCompleted,
  exercisesTotal,
  nextExam,
  goalsDueSoon,
  interviewsUpcoming,
}: DashboardStatsProps) {
  // TODO: wire to /api/user/streak
  const streak = 3;

  const taskPct = tasksToday > 0 ? (tasksCompleted / tasksToday) * 100 : 0;
  const exercisePct = exercisesTotal > 0 ? (exercisesCompleted / exercisesTotal) * 100 : 0;
  const streakPct = Math.min((streak / 7) * 100, 100);

  const allDone = taskPct === 100 && tasksToday > 0;
  const examUrgent = nextExam !== null && nextExam.daysUntilExam <= 1;
  const examWarning = nextExam !== null && nextExam.daysUntilExam <= 7;
  const tasksRemaining = Math.max(tasksToday - tasksCompleted, 0);
  const examDays = nextExam?.daysUntilExam ?? null;
  const careerProgress = interviewsUpcoming > 0
    ? Math.min(100, interviewsUpcoming * 25)
    : goalsDueSoon > 0
      ? 45
      : 18;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className="relative overflow-hidden rounded-xl border border-border bg-surface/65 backdrop-blur-md"
      style={{
        boxShadow:
          '0 1px 2px rgba(0,0,0,0.2), 0 10px 22px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.06),transparent_45%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.04),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.14] to-transparent" />
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            'linear-gradient(to right, rgba(248,113,113,0.45) 0%, rgba(251,191,36,0.45) 33%, rgba(251,146,60,0.45) 66%, rgba(56,189,248,0.42) 100%)',
        }}
      />

      <div className="relative flex items-stretch overflow-x-auto">
        <RailSegment
          icon={CheckCircle2}
          tone="task"
          label="Daily Tasks"
          value={<AnimatedCounter to={tasksCompleted} />}
          valueMeta={`/ ${tasksToday}`}
          subtitle={allDone ? 'All done, momentum is high' : `${tasksRemaining} remaining`}
          chip={
            allDone ? (
              <RailChip label="Clear" tone="success" />
            ) : taskPct === 0 && tasksToday > 0 ? (
              <RailChip label="Hot" tone="danger" pulse />
            ) : undefined
          }
          progress={taskPct}
        />

        <Sep />

        <RailSegment
          icon={GraduationCap}
          tone="exercise"
          label="Exercises"
          value={<AnimatedCounter to={exercisesCompleted} />}
          valueMeta={`/ ${exercisesTotal}`}
          subtitle={`${Math.round(exercisePct)}% complete`}
          chip={
            examDays === null ? undefined : (
              <RailChip
                label={examDays < 0 ? `${Math.abs(examDays)}d late` : `Exam ${examDays}d`}
                tone={examUrgent ? 'danger' : examWarning ? 'warning' : 'muted'}
                pulse={examUrgent}
              />
            )
          }
          progress={exercisePct}
        />

        <Sep />

        <RailSegment
          icon={Flame}
          tone="streak"
          label="Streak"
          value={<AnimatedCounter to={streak} />}
          valueMeta="days"
          subtitle={`${Math.max(0, 7 - streak)}d to weekly goal`}
          chip={<RailChip label={streak > 0 ? 'Active' : 'Cold'} tone={streak > 0 ? 'warning' : 'muted'} pulse={streak > 0} />}
          progress={streakPct}
        />

        <Sep />

        <RailSegment
          icon={Briefcase}
          tone="career"
          label="Career"
          value={<AnimatedCounter to={interviewsUpcoming} />}
          valueMeta="interviews"
          subtitle={
            goalsDueSoon > 0
              ? `${goalsDueSoon} goal${goalsDueSoon > 1 ? 's' : ''} due soon`
              : interviewsUpcoming > 0
                ? 'Pipeline active'
                : 'No interviews yet'
          }
          chip={
            goalsDueSoon > 0 ? (
              <RailChip label={`${goalsDueSoon} due`} tone="danger" pulse />
            ) : interviewsUpcoming > 0 ? (
              <RailChip label={`${interviewsUpcoming} live`} tone="info" />
            ) : undefined
          }
          progress={careerProgress}
        />
      </div>
    </motion.div>
  );
}
