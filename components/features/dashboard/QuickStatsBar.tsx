'use client';

import { motion } from 'framer-motion';
import { Calendar, TrendingUp, Clock, Flame, Target, BookOpen } from 'lucide-react';

interface QuickStatsBarProps {
  eventsToday: number;
  productivity: number;
  focusTime: number;
  streak: number;
  goalsThisWeek: { completed: number; total: number };
  exercisesThisWeek: number;
}

export default function QuickStatsBar({
  eventsToday,
  productivity,
  focusTime,
  streak,
  goalsThisWeek,
  exercisesThisWeek,
}: QuickStatsBarProps) {
  const stats = [
    {
      icon: Calendar,
      label: 'Events Today',
      value: eventsToday,
      color: 'text-calendar-accent',
      bgColor: 'bg-calendar-accent/10',
    },
    {
      icon: TrendingUp,
      label: 'Productivity',
      value: `${productivity}%`,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      icon: Clock,
      label: 'Focus Time',
      value: `${focusTime}h`,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      icon: Flame,
      label: 'Day Streak',
      value: streak,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      highlight: streak > 0,
    },
    {
      icon: Target,
      label: 'Goals',
      value: `${goalsThisWeek.completed}/${goalsThisWeek.total}`,
      color: 'text-goals-accent',
      bgColor: 'bg-goals-accent/10',
    },
    {
      icon: BookOpen,
      label: 'Exercises',
      value: exercisesThisWeek,
      color: 'text-university-accent',
      bgColor: 'bg-university-accent/10',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8"
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`relative overflow-hidden rounded-xl border border-border bg-surface/50 backdrop-blur-sm p-4 transition-all ${
              stat.highlight ? 'ring-2 ring-warning/30' : ''
            }`}
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 ${stat.bgColor} opacity-50`} />

            {/* Content */}
            <div className="relative z-10 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-tertiary truncate">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>

            {/* Streak animation */}
            {stat.highlight && (
              <motion.div
                className="absolute top-0 right-0 p-1"
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Flame className="w-4 h-4 text-warning" />
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
