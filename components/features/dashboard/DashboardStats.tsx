'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, GraduationCap, Target, Briefcase, Calendar } from 'lucide-react';

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
  const stats = [
    {
      icon: CheckCircle2,
      label: 'Tasks',
      value: `${tasksCompleted}/${tasksToday}`,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      icon: GraduationCap,
      label: 'Exercises',
      value: `${exercisesCompleted}/${exercisesTotal}`,
      color: 'text-university-accent',
      bgColor: 'bg-university-accent/10',
    },
    {
      icon: Calendar,
      label: 'Next Exam',
      value: nextExam ? `${nextExam.daysUntilExam}d` : '—',
      detail: nextExam?.name,
      color: nextExam && nextExam.daysUntilExam < 30 ? 'text-error' : 'text-info',
      bgColor: nextExam && nextExam.daysUntilExam < 30 ? 'bg-error/10' : 'bg-info/10',
    },
    {
      icon: Target,
      label: 'Goals Due',
      value: goalsDueSoon,
      color: 'text-goals-accent',
      bgColor: 'bg-goals-accent/10',
    },
    ...(interviewsUpcoming > 0
      ? [{
          icon: Briefcase,
          label: 'Interviews',
          value: interviewsUpcoming,
          color: 'text-career-accent',
          bgColor: 'bg-career-accent/10',
        }]
      : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-3"
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface/50 backdrop-blur-sm"
          >
            <div className={`p-1.5 rounded-md ${stat.bgColor}`}>
              <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-sm font-bold ${stat.color}`}>{stat.value}</span>
              <span className="text-xs text-text-tertiary">{stat.label}</span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
