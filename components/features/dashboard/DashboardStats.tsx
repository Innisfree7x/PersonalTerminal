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
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${className}`} />
      <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${className}`} />
    </span>
  );
}

/** Thin vertical separator */
function Sep() {
  return <div className="w-px self-stretch bg-white/[0.05]" />;
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

  const taskPct     = tasksToday > 0     ? (tasksCompleted / tasksToday) * 100        : 0;
  const exercisePct = exercisesTotal > 0 ? (exercisesCompleted / exercisesTotal) * 100 : 0;
  const streakPct   = Math.min((streak / 7) * 100, 100);

  const allDone = taskPct === 100 && tasksToday > 0;
  // Left stripe + bloom + number color per urgency
  const taskColor  = allDone ? '#34d399' : taskPct > 0 ? '#fbbf24' : '#f87171';
  const taskLabel  = allDone ? 'text-emerald-400' : taskPct > 0 ? 'text-amber-400' : 'text-red-400';

  const examUrgent  = nextExam !== null && nextExam.daysUntilExam <= 1;
  const examWarning = nextExam !== null && nextExam.daysUntilExam <= 7;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="relative flex items-stretch overflow-hidden rounded-xl border border-white/[0.06] bg-[#07090f]"
    >
      {/* Master 4-colour gradient line at bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            'linear-gradient(to right, rgba(52,211,153,0.8) 0%, rgba(251,191,36,0.8) 33%, rgba(251,146,60,0.8) 66%, rgba(56,189,248,0.8) 100%)',
        }}
      />

      {/* ─── TASKS ───────────────────────────────────────────── */}
      <div className="group relative flex flex-1 cursor-default items-center hover:bg-white/[0.018] transition-colors">
        {/* Left accent stripe — dynamic colour */}
        <div
          className="w-[2px] self-stretch flex-shrink-0 transition-opacity"
          style={{ backgroundColor: taskColor }}
        />

        {/* Bloom behind content */}
        <div
          className="pointer-events-none absolute left-0 top-1/2 h-24 w-36 -translate-y-1/2 opacity-50 transition-opacity group-hover:opacity-75"
          style={{
            background: `radial-gradient(ellipse at left, ${taskColor}22 0%, transparent 70%)`,
            filter: 'blur(18px)',
          }}
        />

        <div className="relative z-10 flex flex-1 items-center gap-3 px-4 py-3.5">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 opacity-50" style={{ color: taskColor }} />

          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="font-mono text-[8.5px] font-semibold uppercase tracking-[0.18em] text-text-tertiary/70">
              Daily Tasks
            </span>
            <div className="flex items-baseline gap-1 leading-none">
              <span
                className={`text-[1.85rem] font-black leading-none tabular-nums ${taskLabel}`}
                style={{ textShadow: `0 0 22px ${taskColor}99` }}
              >
                <AnimatedCounter to={tasksCompleted} />
              </span>
              <span className="mb-0.5 text-sm font-medium text-text-tertiary/60">/ {tasksToday}</span>
            </div>
            {allDone ? (
              <span className="text-[9px] font-medium text-emerald-400/70">All done · great work</span>
            ) : (
              <span className="text-[9px] text-text-tertiary/50">{tasksToday - tasksCompleted} remaining</span>
            )}
          </div>
        </div>
      </div>

      <Sep />

      {/* ─── EXERCISES ───────────────────────────────────────── */}
      <div className="group relative flex flex-1 cursor-default items-center hover:bg-white/[0.018] transition-colors">
        <div className="w-[2px] self-stretch flex-shrink-0 bg-amber-500/80" />

        <div
          className="pointer-events-none absolute left-0 top-1/2 h-24 w-36 -translate-y-1/2 opacity-50 transition-opacity group-hover:opacity-75"
          style={{
            background: 'radial-gradient(ellipse at left, rgba(251,191,36,0.18) 0%, transparent 70%)',
            filter: 'blur(18px)',
          }}
        />

        <div className="relative z-10 flex flex-1 items-center gap-3 px-4 py-3.5">
          <GraduationCap className="h-4 w-4 flex-shrink-0 text-amber-400/50" />

          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="font-mono text-[8.5px] font-semibold uppercase tracking-[0.18em] text-text-tertiary/70">
              Exercises
            </span>
            <div className="flex items-baseline gap-1 leading-none">
              <span
                className="text-[1.85rem] font-black leading-none tabular-nums text-amber-400"
                style={{ textShadow: '0 0 22px rgba(251,191,36,0.5)' }}
              >
                <AnimatedCounter to={exercisesCompleted} />
              </span>
              <span className="mb-0.5 text-sm font-medium text-text-tertiary/60">/ {exercisesTotal}</span>
            </div>
            <span className="text-[9px] text-text-tertiary/50">{Math.round(exercisePct)}% complete</span>
          </div>

          {nextExam && (
            <div className="ml-auto flex items-center gap-1.5">
              {examUrgent && <PulseDot className="bg-red-500" />}
              <span
                className={`rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${
                  examUrgent
                    ? 'bg-red-500/15 text-red-400'
                    : examWarning
                      ? 'bg-amber-500/12 text-amber-400'
                      : 'bg-white/[0.05] text-text-tertiary'
                }`}
              >
                Exam {nextExam.daysUntilExam}d
              </span>
            </div>
          )}
        </div>
      </div>

      <Sep />

      {/* ─── STREAK ──────────────────────────────────────────── */}
      <div className="group relative flex flex-1 cursor-default items-center hover:bg-white/[0.018] transition-colors">
        <div className="w-[2px] self-stretch flex-shrink-0 bg-orange-500/80" />

        <div
          className="pointer-events-none absolute left-0 top-1/2 h-24 w-36 -translate-y-1/2 opacity-50 transition-opacity group-hover:opacity-75"
          style={{
            background: 'radial-gradient(ellipse at left, rgba(251,146,60,0.18) 0%, transparent 70%)',
            filter: 'blur(18px)',
          }}
        />

        <div className="relative z-10 flex flex-1 items-center gap-3 px-4 py-3.5">
          <Flame className="h-4 w-4 flex-shrink-0 text-orange-400/50" />

          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="font-mono text-[8.5px] font-semibold uppercase tracking-[0.18em] text-text-tertiary/70">
              Streak
            </span>
            <div className="flex items-baseline gap-1 leading-none">
              <span
                className="text-[1.85rem] font-black leading-none tabular-nums text-orange-400"
                style={{ textShadow: '0 0 22px rgba(251,146,60,0.5)' }}
              >
                <AnimatedCounter to={streak} />
              </span>
              <span className="mb-0.5 text-sm font-medium text-text-tertiary/60">days</span>
            </div>
            <span className="text-[9px] text-text-tertiary/50">{Math.max(0, 7 - streak)}d to weekly goal</span>
          </div>

          {streak > 0 && (
            <div className="ml-auto flex items-center gap-1.5">
              <PulseDot className="bg-orange-400" />
              <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-orange-400/80">
                Active
              </span>
            </div>
          )}

          {/* Mini progress bar */}
          <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/[0.04]">
            <motion.div
              className="h-full bg-orange-500/70"
              initial={{ width: 0 }}
              animate={{ width: `${streakPct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
        </div>
      </div>

      <Sep />

      {/* ─── CAREER ──────────────────────────────────────────── */}
      <div className="group relative flex flex-1 cursor-default items-center hover:bg-white/[0.018] transition-colors">
        <div className="w-[2px] self-stretch flex-shrink-0 bg-sky-500/70" />

        <div
          className="pointer-events-none absolute left-0 top-1/2 h-24 w-36 -translate-y-1/2 opacity-50 transition-opacity group-hover:opacity-75"
          style={{
            background: 'radial-gradient(ellipse at left, rgba(56,189,248,0.15) 0%, transparent 70%)',
            filter: 'blur(18px)',
          }}
        />

        <div className="relative z-10 flex flex-1 items-center gap-3 px-4 py-3.5">
          <Briefcase className="h-4 w-4 flex-shrink-0 text-sky-400/50" />

          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="font-mono text-[8.5px] font-semibold uppercase tracking-[0.18em] text-text-tertiary/70">
              Career
            </span>
            {interviewsUpcoming > 0 ? (
              <div className="flex items-baseline gap-1 leading-none">
                <span
                  className="text-[1.85rem] font-black leading-none tabular-nums text-sky-400"
                  style={{ textShadow: '0 0 22px rgba(56,189,248,0.5)' }}
                >
                  {interviewsUpcoming}
                </span>
                <span className="mb-0.5 text-sm font-medium text-text-tertiary/60">
                  interview{interviewsUpcoming > 1 ? 's' : ''}
                </span>
              </div>
            ) : (
              <span
                className="text-[1.1rem] font-bold leading-tight text-sky-400/60"
                style={{ textShadow: '0 0 16px rgba(56,189,248,0.3)' }}
              >
                No interviews
              </span>
            )}
            {goalsDueSoon > 0 ? (
              <span className="text-[9px] font-medium text-red-400/70">
                {goalsDueSoon} goal{goalsDueSoon > 1 ? 's' : ''} due soon
              </span>
            ) : (
              <span className="text-[9px] text-text-tertiary/50">Pipeline active</span>
            )}
          </div>

          {(goalsDueSoon > 0 || interviewsUpcoming > 0) && (
            <div className="ml-auto flex items-center gap-1.5">
              {goalsDueSoon > 0 ? (
                <>
                  <PulseDot className="bg-red-500" />
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-red-400">
                    {goalsDueSoon} due
                  </span>
                </>
              ) : (
                <PulseDot className="bg-sky-400" />
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
