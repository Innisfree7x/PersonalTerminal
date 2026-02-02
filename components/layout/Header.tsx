'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

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

export default function Header() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchStats,
    refetchInterval: 60000, // Refetch every minute
  });

  const todayCompletion = stats?.metrics.todayCompletion || 0;
  const weekProgress = stats?.metrics.weekProgress || { day: 1, total: 7 };

  // Check for urgent items (notification badge)
  const hasUrgent =
    (stats?.career.nextInterview &&
      new Date(stats.career.nextInterview.date) <= new Date(Date.now() + 24 * 60 * 60 * 1000)) ||
    (stats?.goals.overdue && stats.goals.overdue > 0) ||
    false;

  return (
    <>
      <header className="sticky top-0 z-30 bg-gray-900 dark:bg-gray-950 border-b border-gray-800 dark:border-gray-800">
        <div className="flex items-center h-14 px-4 lg:pl-72">
          {/* Left: Dashboard Title */}
          <h1 className="text-xl font-semibold text-gray-100 dark:text-gray-100 mr-8">
            Dashboard
          </h1>

          {/* Center: Completion Progress */}
          <div className="flex-1 flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-400">
            <div className="flex items-center gap-2 font-mono">
              <span>Today:</span>
              <span className="font-semibold text-blue-400 dark:text-blue-400">
                {todayCompletion}%
              </span>
            </div>
            <div className="text-gray-600 dark:text-gray-600">|</div>
            <div className="flex items-center gap-2 font-mono">
              <span>Week:</span>
              <span className="font-semibold text-purple-400 dark:text-purple-400">
                {weekProgress.day}/{weekProgress.total} days
              </span>
            </div>
          </div>

          {/* Right: Notification Bell */}
          <div className="relative ml-4">
            <button className="p-2 text-gray-400 hover:text-gray-300 transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
            {hasUrgent && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-0.5 bg-gray-800 dark:bg-gray-800">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${todayCompletion}%` }}
          />
        </div>
      </header>
    </>
  );
}
