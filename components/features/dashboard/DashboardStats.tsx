'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle2,
  GraduationCap,
  Briefcase,
  Flame,
} from 'lucide-react';
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

export default function DashboardStats({
  tasksToday,
  tasksCompleted,
  exercisesCompleted,
  exercisesTotal,
  nextExam,
  goalsDueSoon,
  interviewsUpcoming,
}: DashboardStatsProps) {
  // Mock streak (will be real later)
  const streak = 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-2"
    >
      {/* Tasks Progress */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        className="px-2.5 py-2 rounded-lg border border-border bg-surface/50 backdrop-blur-sm hover:border-primary/30 transition-colors group relative overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-success/55 to-transparent" />
        <div className="flex items-center justify-between mb-0.5">
          <div className="p-0.5 rounded-md bg-success/10 text-success">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-[9px] font-medium text-text-tertiary uppercase tracking-wider">
            Daily Tasks
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <AnimatedCounter
            to={tasksCompleted}
            className="text-xl leading-none font-bold text-text-primary"
          />
          <span className="text-sm leading-none text-text-tertiary font-medium">
            / {tasksToday}
          </span>
        </div>
        <div className="w-full bg-surface h-1 rounded-full mt-1 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(tasksCompleted / Math.max(tasksToday, 1)) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-success rounded-full"
            style={{ boxShadow: '0 0 8px var(--color-success, #22c55e)' }}
          />
        </div>
      </motion.div>

      {/* University Progress */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="px-2.5 py-2 rounded-lg border border-border bg-surface/50 backdrop-blur-sm hover:border-university-accent/30 transition-colors group relative overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-university-accent/55 to-transparent" />
        <div className="flex items-center justify-between mb-0.5">
          <div className="p-0.5 rounded-md bg-university-accent/10 text-university-accent">
            <GraduationCap className="w-3.5 h-3.5" />
          </div>
          <span className="text-[9px] font-medium text-text-tertiary uppercase tracking-wider">
            Exercises
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <AnimatedCounter
            to={exercisesCompleted}
            className="text-xl leading-none font-bold text-text-primary"
          />
          <span className="text-sm leading-none text-text-tertiary font-medium">
            / {exercisesTotal}
          </span>
        </div>
        {nextExam && (
          <div className="mt-0.5 text-[9px] flex items-center gap-1">
            <span className={`px-1.5 py-0.5 rounded ${nextExam.daysUntilExam < 14 ? 'bg-error/10 text-error' : 'bg-surface text-text-secondary'
              }`}>
              {nextExam.daysUntilExam}d until exam
            </span>
          </div>
        )}
      </motion.div>

      {/* Streak / Focus (Placeholder for Phase 3 advanced analytics) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className="px-2.5 py-2 rounded-lg border border-border bg-surface/50 backdrop-blur-sm hover:border-warning/30 transition-colors group relative overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-warning/55 to-transparent" />
        <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-warning/10 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex items-center justify-between mb-0.5">
          <div className="p-0.5 rounded-md bg-warning/10 text-warning streak-flame">
            <Flame className="w-3.5 h-3.5" />
          </div>
          <span className="text-[9px] font-medium text-text-tertiary uppercase tracking-wider">
            Streak
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <AnimatedCounter
            to={streak}
            className="text-xl leading-none font-bold text-text-primary"
          />
          <span className="text-sm leading-none text-text-tertiary font-medium ml-1">
            days
          </span>
        </div>
        <div className="mt-0.5 text-[9px] text-text-secondary">
          Keep it up! 🔥
        </div>
      </motion.div>

      {/* Career / Goals Summary */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="px-2.5 py-2 rounded-lg border border-border bg-surface/50 backdrop-blur-sm hover:border-career-accent/30 transition-colors group relative overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-career-accent/55 to-transparent" />
        <div className="flex items-center justify-between mb-0.5">
          <div className="p-0.5 rounded-md bg-career-accent/10 text-career-accent">
            <Briefcase className="w-3.5 h-3.5" />
          </div>
          <span className="text-[9px] font-medium text-text-tertiary uppercase tracking-wider">
            Career
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          {interviewsUpcoming > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-secondary">Next Interview</span>
              <span className="text-xs font-semibold text-career-accent">{interviewsUpcoming}</span>
            </div>
          ) : (
            <div className="text-[11px] text-text-tertiary">No upcoming interviews</div>
          )}
          {goalsDueSoon > 0 && (
            <div className="flex items-center justify-between mt-0.5 pt-0.5 border-t border-border/50">
              <span className="text-[11px] text-text-secondary">Goals Due</span>
              <span className="text-xs font-semibold text-error">{goalsDueSoon}</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
