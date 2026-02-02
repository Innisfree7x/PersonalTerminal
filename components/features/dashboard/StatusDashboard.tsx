'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import Link from 'next/link';

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
        <div className="bg-gray-900/50 dark:bg-gray-800/50 rounded-lg border border-gray-700 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-400">Loading stats...</p>
        </div>
      </div>
    );
  }

  const weekProgressPercent = Math.round((stats.metrics.weekProgress.day / stats.metrics.weekProgress.total) * 100);

  return (
    <div className="space-y-4">
      {/* Career Stats Card */}
      <div className="bg-gray-900/50 dark:bg-gray-800/50 rounded-lg border border-gray-700 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-200 dark:text-gray-200 mb-3 pb-2 border-b border-gray-800 dark:border-gray-700">
          📊 Career Stats
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 dark:text-gray-400">Active Interviews:</span>
            <span className="font-mono font-semibold text-blue-400 dark:text-blue-400">
              {stats.career.activeInterviews}
            </span>
          </div>
          {stats.career.nextInterview && (
            <div className="text-gray-400 dark:text-gray-400">
              Next: <span className="font-mono text-yellow-400 dark:text-yellow-400">
                {format(new Date(stats.career.nextInterview.date), 'EEE d')}
              </span>{' '}
              {stats.career.nextInterview.company}
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-gray-400 dark:text-gray-400">Applications Pending:</span>
            <span className="font-mono font-semibold text-gray-300 dark:text-gray-300">
              {stats.career.applicationsPending}
            </span>
          </div>
          {stats.career.pendingDays > 0 && (
            <div className="text-gray-400 dark:text-gray-400">
              Oldest: <span className="font-mono text-gray-300 dark:text-gray-300">{stats.career.pendingDays}d</span> ago
            </div>
          )}
          {stats.career.followUpNeeded > 0 && (
            <div className="flex justify-between items-center pt-2 border-t border-gray-800 dark:border-gray-700">
              <span className="text-yellow-400 dark:text-yellow-400">⚠️ Follow-up Needed:</span>
              <span className="font-mono font-semibold text-red-400 dark:text-red-400">
                {stats.career.followUpNeeded}
              </span>
            </div>
          )}
          <Link
            href="/career"
            className="block mt-3 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
          >
            Apply to new role
          </Link>
        </div>
      </div>

      {/* Goals Progress Card */}
      <div className="bg-gray-900/50 dark:bg-gray-800/50 rounded-lg border border-gray-700 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-200 dark:text-gray-200 mb-3 pb-2 border-b border-gray-800 dark:border-gray-700">
          🎯 Goals Progress
        </h3>
        <div className="space-y-2 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-400 dark:text-gray-400">This Week:</span>
              <span className="font-mono font-semibold text-green-400 dark:text-green-400">
                {stats.goals.weeklyProgress.onTrack}/{stats.goals.weeklyProgress.total}
              </span>
            </div>
            <div className="w-full bg-gray-800 dark:bg-gray-900 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all"
                style={{
                  width: `${stats.goals.weeklyProgress.total > 0 ? (stats.goals.weeklyProgress.onTrack / stats.goals.weeklyProgress.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
          <div className="pt-2 border-t border-gray-800 dark:border-gray-700">
            <div className="text-gray-400 dark:text-gray-400 mb-1">By Category:</div>
            {Object.entries(stats.goals.byCategory).map(([category, count]) => (
              <div key={category} className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
                <span className="capitalize">{category}:</span>
                <span className="font-mono">{count}</span>
              </div>
            ))}
          </div>
          {stats.goals.overdue > 0 && (
            <div className="pt-2 border-t border-gray-800 dark:border-gray-700">
              <span className="text-red-400 dark:text-red-400">
                ⚠️ {stats.goals.overdue} overdue goal{stats.goals.overdue > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Study Progress Subsection */}
          <div className="pt-3 border-t border-gray-800 dark:border-gray-700">
            <div className="text-gray-300 dark:text-gray-300 font-semibold mb-2">
              📚 Study Progress
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400 dark:text-gray-400">This Week:</span>
                <span className="font-mono text-blue-400 dark:text-blue-400">
                  {stats.study.weekCompleted} exercises
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 dark:text-gray-400">Semester:</span>
                <span className="font-mono text-purple-400 dark:text-purple-400">
                  {stats.study.semesterPercent}% complete
                </span>
              </div>
              {stats.study.nextExam && (
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-gray-400">Next:</span>
                  <span className="font-mono text-yellow-400 dark:text-yellow-400">
                    {stats.study.nextExam.courseName} in {stats.study.nextExam.daysUntil}d
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Metrics Card */}
      <div className="bg-gray-900/50 dark:bg-gray-800/50 rounded-lg border border-gray-700 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-200 dark:text-gray-200 mb-3 pb-2 border-b border-gray-800 dark:border-gray-700">
          ⚡ Quick Metrics
        </h3>
        <div className="space-y-3 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-400 dark:text-gray-400">Today Completion:</span>
              <span className="font-mono font-semibold text-blue-400 dark:text-blue-400">
                {stats.metrics.todayCompletion}%
              </span>
            </div>
            <div className="relative w-full h-1.5 bg-gray-800 dark:bg-gray-900 rounded-full">
              <div
                className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                style={{ width: `${stats.metrics.todayCompletion}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-400 dark:text-gray-400">Week Progress:</span>
              <span className="font-mono font-semibold text-purple-400 dark:text-purple-400">
                Day {stats.metrics.weekProgress.day}/{stats.metrics.weekProgress.total}
              </span>
            </div>
            <div className="w-full bg-gray-800 dark:bg-gray-900 rounded-full h-1.5">
              <div
                className="bg-purple-500 h-1.5 rounded-full transition-all"
                style={{ width: `${weekProgressPercent}%` }}
              />
            </div>
          </div>
          <div className="pt-2 border-t border-gray-800 dark:border-gray-700">
            <div className="text-gray-400 dark:text-gray-400 font-mono text-xs">
              💡 {stats.metrics.focusTime}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
