'use client';

import { motion } from 'framer-motion';
import { Calendar, TrendingUp, Clock, Flame, Target, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import { memo } from 'react';

interface QuickStatsBarProps {
  eventsToday: number;
  productivity: number;
  focusTime: number;
  streak: number;
  goalsThisWeek: { completed: number; total: number };
  exercisesThisWeek: number;
  isLoading?: boolean;
}

const QuickStatsBar = memo(function QuickStatsBar({
  eventsToday,
  productivity,
  focusTime,
  streak,
  goalsThisWeek,
  exercisesThisWeek,
  isLoading = false,
}: QuickStatsBarProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl mb-8 p-4 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-border bg-surface/50">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
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
      className="relative overflow-hidden rounded-2xl mb-8 p-4 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20"
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
      
      {/* Stats Grid */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
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
      </div>
    </motion.div>
  );
});

export default QuickStatsBar;
