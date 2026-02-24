'use client';

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
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${className}`} />
      <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${className}`} />
    </span>
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
  // TODO: wire to real streak API (/api/user/streak)
  const streak = 3;

  const taskPct = tasksToday > 0 ? (tasksCompleted / tasksToday) * 100 : 0;
  const exercisePct = exercisesTotal > 0 ? (exercisesCompleted / exercisesTotal) * 100 : 0;
  const streakPct = Math.min((streak / 7) * 100, 100);

  const taskNumColor =
    taskPct === 100 ? 'text-success' : taskPct > 0 ? 'text-warning' : 'text-error';
  const taskBarColor =
    taskPct === 100 ? 'bg-success' : taskPct > 0 ? 'bg-warning' : 'bg-error/50';

  const examUrgent = nextExam !== null && nextExam.daysUntilExam <= 1;
  const examWarning = nextExam !== null && nextExam.daysUntilExam <= 7;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="relative flex items-stretch overflow-hidden rounded-xl border border-border/60 bg-surface/30 backdrop-blur-sm"
    >
      {/* ─── Tasks ──────────────────────────────────────── */}
      <div className="relative flex flex-1 items-center gap-3 border-r border-border/40 px-4 py-2.5 transition-colors hover:bg-white/[0.025]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-success/40 to-transparent" />

        <CheckCircle2 className={`h-3.5 w-3.5 flex-shrink-0 ${taskNumColor}`} />

        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <div className="flex items-baseline gap-1 leading-none">
            <AnimatedCounter to={tasksCompleted} className={`text-lg font-bold leading-none ${taskNumColor}`} />
            <span className="text-xs leading-none text-text-tertiary">/ {tasksToday}</span>
            <span className="ml-1 text-[9px] font-medium uppercase tracking-wider text-text-tertiary">Tasks</span>
          </div>
          {taskPct === 100 && tasksToday > 0 ? (
            <span className="text-[9px] font-medium text-success">All done · great work</span>
          ) : (
            <span className="text-[9px] text-text-tertiary">{tasksToday - tasksCompleted} remaining</span>
          )}
        </div>

        {/* Progress rail */}
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-border/20">
          <motion.div
            className={`h-full ${taskBarColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${taskPct}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.15 }}
            style={{ boxShadow: taskPct === 100 ? '0 0 6px var(--color-success, #22c55e)' : 'none' }}
          />
        </div>
      </div>

      {/* ─── Exercises ──────────────────────────────────── */}
      <div className="relative flex flex-1 items-center gap-3 border-r border-border/40 px-4 py-2.5 transition-colors hover:bg-white/[0.025]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-university-accent/40 to-transparent" />

        <GraduationCap className="h-3.5 w-3.5 flex-shrink-0 text-university-accent" />

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex flex-col gap-px">
            <div className="flex items-baseline gap-1 leading-none">
              <AnimatedCounter to={exercisesCompleted} className="text-lg font-bold leading-none text-text-primary" />
              <span className="text-xs leading-none text-text-tertiary">/ {exercisesTotal}</span>
              <span className="ml-1 text-[9px] font-medium uppercase tracking-wider text-text-tertiary">Exercises</span>
            </div>
            <span className="text-[9px] text-text-tertiary">{Math.round(exercisePct)}% complete</span>
          </div>

          {nextExam && (
            <div className="ml-auto flex items-center gap-1.5">
              {examUrgent && <PulseDot className="bg-error" />}
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide ${
                  examUrgent ? 'text-error' : examWarning ? 'text-warning' : 'text-text-tertiary'
                }`}
              >
                Exam {nextExam.daysUntilExam}d
              </span>
            </div>
          )}
        </div>

        {/* Progress rail */}
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-border/20">
          <motion.div
            className="h-full bg-university-accent/80"
            initial={{ width: 0 }}
            animate={{ width: `${exercisePct}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.25 }}
          />
        </div>
      </div>

      {/* ─── Streak ─────────────────────────────────────── */}
      <div className="relative flex flex-1 items-center gap-3 border-r border-border/40 px-4 py-2.5 transition-colors hover:bg-white/[0.025]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-warning/40 to-transparent" />

        <Flame className="h-3.5 w-3.5 flex-shrink-0 text-warning" />

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex flex-col gap-px">
            <div className="flex items-baseline gap-1 leading-none">
              <AnimatedCounter to={streak} className="text-lg font-bold leading-none text-text-primary" />
              <span className="text-xs leading-none text-text-tertiary">days</span>
              <span className="ml-1 text-[9px] font-medium uppercase tracking-wider text-text-tertiary">Streak</span>
            </div>
            <span className="text-[9px] text-text-tertiary">{Math.max(0, 7 - streak)}d to weekly goal</span>
          </div>

          {streak > 0 && (
            <div className="ml-auto flex items-center gap-1.5">
              <PulseDot className="bg-warning" />
              <span className="text-[9px] font-medium uppercase tracking-wide text-warning">Active</span>
            </div>
          )}
        </div>

        {/* Progress rail */}
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-border/20">
          <motion.div
            className="h-full bg-warning/80"
            initial={{ width: 0 }}
            animate={{ width: `${streakPct}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.35 }}
          />
        </div>
      </div>

      {/* ─── Career ─────────────────────────────────────── */}
      <div className="relative flex flex-1 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.025]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-career-accent/35 to-transparent" />

        <Briefcase className="h-3.5 w-3.5 flex-shrink-0 text-career-accent" />

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex flex-col gap-px">
            <span className="text-[9px] font-medium uppercase tracking-wider text-text-tertiary">Career</span>
            {interviewsUpcoming > 0 ? (
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold leading-none text-career-accent">{interviewsUpcoming}</span>
                <span className="text-xs text-text-secondary">
                  interview{interviewsUpcoming > 1 ? 's' : ''} upcoming
                </span>
              </div>
            ) : (
              <span className="text-xs text-text-tertiary">No upcoming interviews</span>
            )}
          </div>

          {(goalsDueSoon > 0 || interviewsUpcoming > 0) && (
            <div className="ml-auto flex items-center gap-1.5">
              {goalsDueSoon > 0 ? (
                <>
                  <PulseDot className="bg-error" />
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-error">
                    {goalsDueSoon} goal{goalsDueSoon > 1 ? 's' : ''} due
                  </span>
                </>
              ) : (
                <PulseDot className="bg-career-accent" />
              )}
            </div>
          )}
        </div>

        {/* Progress rail — empty, structural only */}
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-border/20" />
      </div>
    </motion.div>
  );
}
