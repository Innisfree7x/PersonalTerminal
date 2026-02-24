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

/** Vertical gradient separator between segments */
function Sep() {
  return (
    <div className="w-px self-stretch bg-gradient-to-b from-transparent via-white/[0.07] to-transparent" />
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

  const taskPct     = tasksToday > 0     ? (tasksCompleted / tasksToday) * 100         : 0;
  const exercisePct = exercisesTotal > 0 ? (exercisesCompleted / exercisesTotal) * 100  : 0;
  const streakPct   = Math.min((streak / 7) * 100, 100);

  const allTasksDone = taskPct === 100 && tasksToday > 0;
  const taskNumColor = allTasksDone ? 'text-emerald-400' : taskPct > 0 ? 'text-amber-400' : 'text-red-400';
  const taskBarColor = allTasksDone ? 'bg-emerald-500' : taskPct > 0 ? 'bg-amber-500'    : 'bg-red-500/60';

  const examUrgent  = nextExam !== null && nextExam.daysUntilExam <= 1;
  const examWarning = nextExam !== null && nextExam.daysUntilExam <= 7;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="relative flex items-stretch overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d1017]/70 backdrop-blur-md"
    >

      {/* ─── TASKS ───────────────────────────────────────── */}
      <div className="group relative flex flex-1 cursor-default items-center gap-3 px-4 py-3.5 transition-colors hover:bg-emerald-500/[0.04]">
        {/* Corner glow */}
        <div className="pointer-events-none absolute left-0 top-0 h-20 w-28 bg-gradient-to-br from-emerald-500/[0.10] to-transparent" />
        {/* Top shimmer */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/55 to-transparent" />

        {/* Icon badge */}
        <div className="relative z-10 flex-shrink-0 rounded-lg bg-emerald-500/[0.12] p-1.5 text-emerald-400 ring-1 ring-emerald-500/20">
          <CheckCircle2 className="h-3.5 w-3.5" />
        </div>

        {/* Text block */}
        <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-0">
          <span className="text-[9px] font-semibold uppercase tracking-widest text-text-tertiary">Daily Tasks</span>
          <div className="flex items-baseline gap-1 leading-none">
            <AnimatedCounter to={tasksCompleted} className={`text-2xl font-bold leading-none ${taskNumColor}`} />
            <span className="text-sm text-text-tertiary">/ {tasksToday}</span>
          </div>
          {allTasksDone ? (
            <span className="text-[9px] font-medium text-emerald-400/80">All done · great work</span>
          ) : (
            <span className="text-[9px] text-text-tertiary/70">{tasksToday - tasksCompleted} remaining</span>
          )}
        </div>

        {/* Progress rail */}
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/[0.04]">
          <motion.div
            className={`h-full ${taskBarColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${taskPct}%` }}
            transition={{ duration: 1.1, ease: 'easeOut', delay: 0.1 }}
            style={{ boxShadow: allTasksDone ? '0 0 8px #34d399' : 'none' }}
          />
        </div>
      </div>

      <Sep />

      {/* ─── EXERCISES ───────────────────────────────────── */}
      <div className="group relative flex flex-1 cursor-default items-center gap-3 px-4 py-3.5 transition-colors hover:bg-amber-500/[0.04]">
        <div className="pointer-events-none absolute left-0 top-0 h-20 w-28 bg-gradient-to-br from-amber-500/[0.10] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/55 to-transparent" />

        <div className="relative z-10 flex-shrink-0 rounded-lg bg-amber-500/[0.12] p-1.5 text-amber-400 ring-1 ring-amber-500/20">
          <GraduationCap className="h-3.5 w-3.5" />
        </div>

        <div className="relative z-10 flex min-w-0 flex-1 items-center gap-2">
          <div className="flex flex-col gap-0">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-text-tertiary">Exercises</span>
            <div className="flex items-baseline gap-1 leading-none">
              <AnimatedCounter to={exercisesCompleted} className="text-2xl font-bold leading-none text-amber-400" />
              <span className="text-sm text-text-tertiary">/ {exercisesTotal}</span>
            </div>
            <span className="text-[9px] text-text-tertiary/70">{Math.round(exercisePct)}% complete</span>
          </div>

          {nextExam && (
            <div className="ml-auto flex items-center gap-1.5">
              {examUrgent && <PulseDot className="bg-red-500" />}
              <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                examUrgent
                  ? 'bg-red-500/15 text-red-400'
                  : examWarning
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-white/[0.06] text-text-tertiary'
              }`}>
                Exam {nextExam.daysUntilExam}d
              </span>
            </div>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/[0.04]">
          <motion.div
            className="h-full bg-amber-500"
            initial={{ width: 0 }}
            animate={{ width: `${exercisePct}%` }}
            transition={{ duration: 1.1, ease: 'easeOut', delay: 0.2 }}
            style={{ boxShadow: '0 0 6px rgba(245,158,11,0.5)' }}
          />
        </div>
      </div>

      <Sep />

      {/* ─── STREAK ──────────────────────────────────────── */}
      <div className="group relative flex flex-1 cursor-default items-center gap-3 px-4 py-3.5 transition-colors hover:bg-orange-500/[0.04]">
        <div className="pointer-events-none absolute left-0 top-0 h-20 w-28 bg-gradient-to-br from-orange-500/[0.10] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500/55 to-transparent" />

        <div className="relative z-10 flex-shrink-0 rounded-lg bg-orange-500/[0.12] p-1.5 text-orange-400 ring-1 ring-orange-500/20">
          <Flame className="h-3.5 w-3.5" />
        </div>

        <div className="relative z-10 flex min-w-0 flex-1 items-center gap-2">
          <div className="flex flex-col gap-0">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-text-tertiary">Streak</span>
            <div className="flex items-baseline gap-1 leading-none">
              <AnimatedCounter to={streak} className="text-2xl font-bold leading-none text-orange-400" />
              <span className="text-sm text-text-tertiary">days</span>
            </div>
            <span className="text-[9px] text-text-tertiary/70">{Math.max(0, 7 - streak)}d to weekly goal</span>
          </div>

          {streak > 0 && (
            <div className="ml-auto flex items-center gap-1.5">
              <PulseDot className="bg-orange-400" />
              <span className="text-[9px] font-semibold uppercase tracking-wide text-orange-400">Active</span>
            </div>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/[0.04]">
          <motion.div
            className="h-full bg-orange-500"
            initial={{ width: 0 }}
            animate={{ width: `${streakPct}%` }}
            transition={{ duration: 1.1, ease: 'easeOut', delay: 0.3 }}
            style={{ boxShadow: '0 0 6px rgba(249,115,22,0.5)' }}
          />
        </div>
      </div>

      <Sep />

      {/* ─── CAREER ──────────────────────────────────────── */}
      <div className="group relative flex flex-1 cursor-default items-center gap-3 px-4 py-3.5 transition-colors hover:bg-sky-500/[0.04]">
        <div className="pointer-events-none absolute left-0 top-0 h-20 w-28 bg-gradient-to-br from-sky-500/[0.10] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/45 to-transparent" />

        <div className="relative z-10 flex-shrink-0 rounded-lg bg-sky-500/[0.12] p-1.5 text-sky-400 ring-1 ring-sky-500/20">
          <Briefcase className="h-3.5 w-3.5" />
        </div>

        <div className="relative z-10 flex min-w-0 flex-1 items-center gap-2">
          <div className="flex flex-col gap-0">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-text-tertiary">Career</span>
            {interviewsUpcoming > 0 ? (
              <div className="flex items-baseline gap-1 leading-none">
                <span className="text-2xl font-bold leading-none text-sky-400">{interviewsUpcoming}</span>
                <span className="text-sm text-text-tertiary">
                  interview{interviewsUpcoming > 1 ? 's' : ''}
                </span>
              </div>
            ) : (
              <span className="text-sm font-medium leading-tight text-text-tertiary">No interviews</span>
            )}
            {goalsDueSoon > 0 ? (
              <span className="text-[9px] font-medium text-red-400/80">
                {goalsDueSoon} goal{goalsDueSoon > 1 ? 's' : ''} due soon
              </span>
            ) : (
              <span className="text-[9px] text-text-tertiary/70">Pipeline active</span>
            )}
          </div>

          {(goalsDueSoon > 0 || interviewsUpcoming > 0) && (
            <div className="ml-auto flex items-center gap-1.5">
              {goalsDueSoon > 0 ? (
                <>
                  <PulseDot className="bg-red-500" />
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-red-400">
                    {goalsDueSoon} due
                  </span>
                </>
              ) : (
                <PulseDot className="bg-sky-400" />
              )}
            </div>
          )}
        </div>

        {/* no fill — structural only */}
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/[0.04]" />
      </div>
    </motion.div>
  );
}
