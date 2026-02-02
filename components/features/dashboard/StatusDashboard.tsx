'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Briefcase, Target, GraduationCap, TrendingUp, AlertCircle, Zap, Clock } from 'lucide-react';

interface DashboardStats {
  career: {
    activeInterviews: number;
    nextInterview?: { company: string; position: string; date: string };
    applicationsPending: number;
    pendingDays: number;
    followUpNeeded: number;
  };
  goals: {
    weeklyProgress: { onTrack: number; total: number };
    byCategory: Record<string, number>;
    overdue: number;
  };
  study: {
    weekCompleted: number;
    semesterPercent: number;
    nextExam?: { courseName: string; daysUntil: number };
  };
  metrics: {
    todayCompletion: number;
    weekProgress: { day: number; total: number };
    focusTime: string;
  };
}

async function fetchStats(): Promise<DashboardStats> {
  const response = await fetch('/api/dashboard/stats');
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
}

export default function StatusDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchStats,
  });

  if (isLoading || !stats) {
    return (
      <div className="space-y-4">
        <div className="bg-surface/50 backdrop-blur-sm rounded-lg border border-border p-6 animate-pulse">
          <div className="h-4 bg-surface-hover rounded w-1/2 mb-4" />
          <div className="space-y-3">
            <div className="h-3 bg-surface-hover rounded" />
            <div className="h-3 bg-surface-hover rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  const weekProgressPercent = Math.round((stats.metrics.weekProgress.day / stats.metrics.weekProgress.total) * 100);
  const goalsProgressPercent = stats.goals.weeklyProgress.total > 0 
    ? Math.round((stats.goals.weeklyProgress.onTrack / stats.goals.weeklyProgress.total) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Quick Metrics Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 rounded-xl p-6"
      >
        {/* Animated background glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Today's Progress</h3>
          </div>

          {/* Large Completion Number */}
          <div className="mb-4">
            <div className="text-5xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              {stats.metrics.todayCompletion}%
            </div>
            <div className="text-xs text-text-tertiary mt-1">Completion Rate</div>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-2 bg-surface rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.metrics.todayCompletion}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary-light rounded-full"
            />
          </div>

          {/* Week Progress */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">Week Progress</span>
              <span className="text-primary font-semibold">
                Day {stats.metrics.weekProgress.day}/{stats.metrics.weekProgress.total}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Career Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-surface/50 backdrop-blur-sm rounded-lg border border-border p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-5 h-5 text-career-accent" />
          <h3 className="text-sm font-semibold text-text-primary">Career</h3>
        </div>

        <div className="space-y-4">
          {/* Active Interviews */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Active Interviews</span>
            <Badge variant="info" size="sm">
              {stats.career.activeInterviews}
            </Badge>
          </div>

          {/* Next Interview */}
          {stats.career.nextInterview && (
            <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3 h-3 text-warning" />
                <span className="text-xs font-medium text-warning">Next Interview</span>
              </div>
              <div className="text-sm text-text-primary font-medium">
                {stats.career.nextInterview.company}
              </div>
              <div className="text-xs text-text-secondary">
                {format(new Date(stats.career.nextInterview.date), 'EEE, MMM d')}
              </div>
            </div>
          )}

          {/* Applications Pending */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Pending</span>
            <span className="text-sm font-mono text-text-primary">
              {stats.career.applicationsPending}
            </span>
          </div>

          {/* Follow-up Needed */}
          {stats.career.followUpNeeded > 0 && (
            <div className="flex items-center gap-2 p-2 bg-error/10 border border-error/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-error" />
              <span className="text-xs text-error font-medium">
                {stats.career.followUpNeeded} need follow-up
              </span>
            </div>
          )}

          <Link href="/career" className="block">
            <Button variant="secondary" size="sm" className="w-full">
              Apply to New Role
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Goals Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-surface/50 backdrop-blur-sm rounded-lg border border-border p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-goals-accent" />
          <h3 className="text-sm font-semibold text-text-primary">Goals</h3>
        </div>

        <div className="space-y-4">
          {/* Weekly Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">This Week</span>
              <span className="text-sm font-semibold text-success">
                {stats.goals.weeklyProgress.onTrack}/{stats.goals.weeklyProgress.total}
              </span>
            </div>
            <div className="relative w-full h-2 bg-surface rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goalsProgressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-success to-success/70 rounded-full"
              />
            </div>
          </div>

          {/* By Category */}
          <div className="space-y-2">
            <div className="text-xs text-text-tertiary mb-2">By Category</div>
            {Object.entries(stats.goals.byCategory).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary capitalize">{category}</span>
                <Badge variant="default" size="sm">{count}</Badge>
              </div>
            ))}
          </div>

          {/* Overdue Warning */}
          {stats.goals.overdue > 0 && (
            <div className="flex items-center gap-2 p-2 bg-error/10 border border-error/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-error" />
              <span className="text-xs text-error font-medium">
                {stats.goals.overdue} overdue
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Study Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-surface/50 backdrop-blur-sm rounded-lg border border-border p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5 text-university-accent" />
          <h3 className="text-sm font-semibold text-text-primary">Study</h3>
        </div>

        <div className="space-y-4">
          {/* This Week */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">This Week</span>
            <Badge variant="info" size="sm">
              {stats.study.weekCompleted} exercises
            </Badge>
          </div>

          {/* Semester Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Semester</span>
              <span className="text-sm font-semibold text-primary">
                {stats.study.semesterPercent}%
              </span>
            </div>
            <div className="relative w-full h-2 bg-surface rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.study.semesterPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-university-accent to-university-accent/70 rounded-full"
              />
            </div>
          </div>

          {/* Next Exam */}
          {stats.study.nextExam && (
            <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3 h-3 text-warning" />
                <span className="text-xs font-medium text-warning">Next Exam</span>
              </div>
              <div className="text-sm text-text-primary font-medium">
                {stats.study.nextExam.courseName}
              </div>
              <div className="text-xs text-text-secondary">
                in {stats.study.nextExam.daysUntil} days
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Focus Time Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-info/10 to-transparent border border-info/30 rounded-lg p-4"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-info" />
          <div className="flex-1">
            <div className="text-xs text-text-tertiary mb-1">Focus Time Today</div>
            <div className="text-lg font-bold text-info font-mono">
              {stats.metrics.focusTime}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
