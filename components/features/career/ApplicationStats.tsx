'use client';

import { Application, ApplicationStatus } from '@/lib/schemas/application.schema';

interface ApplicationStatsProps {
  applications: Application[];
}

export default function ApplicationStats({ applications }: ApplicationStatsProps) {
  const stats = {
    total: applications.length,
    applied: applications.filter((a) => a.status === 'applied').length,
    interview: applications.filter((a) => a.status === 'interview').length,
    offer: applications.filter((a) => a.status === 'offer').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  const responseRate =
    stats.total > 0
      ? Math.round(
          ((stats.interview + stats.offer + stats.rejected) / stats.total) * 100
        )
      : 0;

  const statCards = [
    {
      label: 'Total Applications',
      value: stats.total,
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      icon: '📊',
    },
    {
      label: 'Active Interviews',
      value: stats.interview,
      color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      icon: '💼',
    },
    {
      label: 'Offers Received',
      value: stats.offer,
      color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      icon: '✅',
    },
    {
      label: 'Response Rate',
      value: `${responseRate}%`,
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      icon: '📈',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
            <span className="text-3xl">{stat.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
