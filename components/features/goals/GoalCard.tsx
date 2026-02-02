'use client';

import { Goal } from '@/lib/schemas/goal.schema';
import { format } from 'date-fns';

interface GoalCardProps {
  goal: Goal;
  onClick?: () => void;
  onDelete?: (goalId: string) => void;
}

const categoryIcons: Record<Goal['category'], string> = {
  fitness: '💪',
  career: '💼',
  learning: '📚',
  finance: '💰',
};

const categoryColors: Record<Goal['category'], string> = {
  fitness: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  career: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  learning: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  finance: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
};

const progressBarColors: Record<Goal['category'], string> = {
  fitness: 'bg-red-500',
  career: 'bg-blue-500',
  learning: 'bg-purple-500',
  finance: 'bg-green-500',
};

export default function GoalCard({ goal, onClick, onDelete }: GoalCardProps) {
  const progress = goal.metrics
    ? Math.min(
        Math.round((goal.metrics.current / goal.metrics.target) * 100),
        100
      )
    : null;

  const daysUntilTarget = Math.ceil(
    (goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(goal.id);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer relative group ${
        onClick ? 'hover:border-gray-300 dark:hover:border-gray-600' : ''
      }`}
    >
      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Delete goal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{categoryIcons[goal.category]}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {goal.title}
            </h3>
            <span
              className={`inline-block px-2 py-1 rounded-md text-xs font-medium mt-1 ${categoryColors[goal.category]}`}
            >
              {goal.category}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      {goal.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {goal.description}
        </p>
      )}

      {/* Metrics & Progress */}
      {goal.metrics && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">
              {goal.metrics.current} / {goal.metrics.target} {goal.metrics.unit}
            </span>
            {progress !== null && (
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {progress}%
              </span>
            )}
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                progress !== null && progress >= 100
                  ? 'bg-green-500'
                  : progressBarColors[goal.category]
              }`}
              style={{
                width: `${progress ?? 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
        <span>
          Target: {format(goal.targetDate, 'MMM dd, yyyy')}
        </span>
        <span
          className={
            daysUntilTarget < 0
              ? 'text-red-600 dark:text-red-400'
              : daysUntilTarget < 30
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-gray-500 dark:text-gray-500'
          }
        >
          {daysUntilTarget < 0
            ? `${Math.abs(daysUntilTarget)} days overdue`
            : `${daysUntilTarget} days left`}
        </span>
      </div>
    </div>
  );
}
