'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Clock, Target, Flame, TrendingUp, Zap, Award } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useStreak } from '@/lib/hooks/useStreak';
import { isAdminUser } from '@/lib/auth/authorization';
import { fetchFocusAnalytics, fetchFocusSessions } from '@/lib/api/focus-sessions';
import AnalyticsStatCard from '@/components/features/analytics/AnalyticsStatCard';
import DailyFocusChart from '@/components/features/analytics/DailyFocusChart';
import HourlyDistributionChart from '@/components/features/analytics/HourlyDistributionChart';
import CategoryBreakdown from '@/components/features/analytics/CategoryBreakdown';
import WeekdayChart from '@/components/features/analytics/WeekdayChart';
import RecentSessionsList from '@/components/features/analytics/RecentSessionsList';
import WeeklyReview from '@/components/features/analytics/WeeklyReview';

const TIME_RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

function formatTotalTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState(30);
  const { user } = useAuth();
  const isAdmin = isAdminUser(user);
  const { streak, activeDaysLast30 } = useStreak();

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['focus', 'analytics', selectedRange],
    queryFn: () => fetchFocusAnalytics(selectedRange),
    retry: false,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const { data: recentSessions } = useQuery({
    queryKey: ['focus', 'sessions', 'recent'],
    queryFn: () => fetchFocusSessions({ limit: 10 }),
    retry: false,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Focus Analytics
          </h2>
          <p className="text-sm text-text-tertiary mt-1">
            Your productivity patterns and study insights
          </p>
        </div>
        <div className="flex gap-1 bg-surface rounded-xl p-1 border border-border">
          {isAdmin ? (
            <Link
              href="/analytics/ops"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-tertiary hover:text-text-secondary"
            >
              Ops Health
            </Link>
          ) : null}
          {TIME_RANGES.map((range) => (
            <button
              key={range.days}
              onClick={() => setSelectedRange(range.days)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${selectedRange === range.days
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-tertiary hover:text-text-secondary'
                }
              `}
            >
              {range.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Weekly Review */}
      <WeeklyReview />

      {/* Stats Cards */}
      {analyticsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card-surface rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
      ) : analytics ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalyticsStatCard
            title="Total Focus Time"
            value={formatTotalTime(analytics.totalMinutes)}
            subtitle={`${analytics.totalSessions} sessions`}
            icon={Clock}
            color="text-primary"
            delay={0}
          />
          <AnalyticsStatCard
            title="Completed"
            value={`${analytics.completedSessions}`}
            numericValue={analytics.completedSessions}
            subtitle={`of ${analytics.totalSessions} sessions`}
            icon={Target}
            color="text-success"
            delay={0.05}
          />
          <AnalyticsStatCard
            title="Current Streak"
            value={`${streak}d`}
            numericValue={streak}
            subtitle={`${activeDaysLast30} active days / 30d`}
            icon={Flame}
            color="text-orange-400"
            delay={0.1}
          />
          <AnalyticsStatCard
            title="Avg Session"
            value={`${analytics.averageSessionMinutes}m`}
            numericValue={analytics.averageSessionMinutes}
            subtitle={`Best: ${analytics.longestSessionMinutes}m`}
            icon={Zap}
            color="text-sky-400"
            delay={0.15}
          />
        </div>
      ) : (
        <div className="card-surface rounded-xl p-8 text-center">
          <Award className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-sm text-text-tertiary">
            Start your first focus session to see analytics
          </p>
        </div>
      )}

      {/* Charts Grid */}
      {analytics && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DailyFocusChart data={analytics.dailyData} />
            <HourlyDistributionChart data={analytics.hourlyDistribution} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryBreakdown data={analytics.categoryBreakdown} />
            <WeekdayChart data={analytics.weekdayDistribution} />
          </div>
        </>
      )}

      {/* Recent Sessions */}
      <RecentSessionsList sessions={recentSessions || []} />
    </div>
  );
}
