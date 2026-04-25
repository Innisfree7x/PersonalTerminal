'use client';

import { memo } from 'react';
import { Goal } from '@/lib/schemas/goal.schema';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { Trash2, Calendar, TrendingUp } from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  onClick?: ((goal: Goal) => void) | undefined;
  onDelete?: ((goalId: string) => void) | undefined;
  focused?: boolean;
  listNavId?: string;
  onFocusHover?: ((goalId: string) => void) | undefined;
}

const categoryConfig: Record<Goal['category'], { icon: string; color: string; bgGradient: string; borderColor: string }> = {
  fitness: {
    icon: '💪',
    color: 'text-error',
    bgGradient: 'from-error/10 to-transparent',
    borderColor: 'border-error/30'
  },
  career: {
    icon: '💼',
    color: 'text-career-accent',
    bgGradient: 'from-career-accent/10 to-transparent',
    borderColor: 'border-career-accent/30'
  },
  learning: {
    icon: '📚',
    color: 'text-primary',
    bgGradient: 'from-primary/10 to-transparent',
    borderColor: 'border-primary/30'
  },
  finance: {
    icon: '💰',
    color: 'text-success',
    bgGradient: 'from-success/10 to-transparent',
    borderColor: 'border-success/30'
  },
};

const progressGradients: Record<Goal['category'], string> = {
  fitness: 'from-error to-error/70',
  career: 'from-career-accent to-career-accent/70',
  learning: 'from-primary to-primary-light',
  finance: 'from-success to-success/70',
};

function GoalCard({
  goal,
  onClick,
  onDelete,
  focused = false,
  listNavId,
  onFocusHover,
}: GoalCardProps) {
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

  const handleClick = () => {
    onClick?.(goal);
  };

  const handleFocusHover = () => {
    onFocusHover?.(goal.id);
  };

  const config = categoryConfig[goal.category];
  const isOverdue = daysUntilTarget < 0;
  const isCompleted = progress !== null && progress >= 100;

  return (
    <div
      data-interactive="goal"
      data-item-id={goal.id}
      data-item-title={goal.title}
      {...(listNavId ? { 'data-list-nav-id': listNavId } : {})}
      data-focused={focused ? 'true' : 'false'}
      onClick={handleClick}
      onMouseEnter={handleFocusHover}
      className={`group relative bg-gradient-to-br ${config.bgGradient} backdrop-blur-sm border rounded-xl p-6 cursor-pointer overflow-hidden card-hover-glow ${
        focused ? 'border-primary/70 ring-1 ring-primary/40' : config.borderColor
      } transition-transform duration-150 hover:-translate-y-1`}
    >
      {/* Animated glow on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      {/* Left border accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${progressGradients[goal.category]} opacity-80`} />

      <div className="relative z-10">
        {focused && (
          <div className="absolute -left-3 top-0 text-primary/80 text-xs font-mono">▶</div>
        )}
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{config.icon}</div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">
                {goal.title}
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="default" size="sm">
                  {goal.category}
                </Badge>
                {isCompleted && (
                  <Badge variant="success" size="sm">
                    ✓ Complete
                  </Badge>
                )}
                {isOverdue && !isCompleted && (
                  <Badge variant="error" size="sm">
                    Overdue
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Delete Button */}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Delete goal"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Description */}
        {goal.description && (
          <p className="text-sm text-text-secondary mb-4 line-clamp-2">
            {goal.description}
          </p>
        )}

        {/* Metrics & Progress */}
        {goal.metrics && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-text-tertiary" />
                <span className="text-text-secondary font-mono">
                  {goal.metrics.current} / {goal.metrics.target} {goal.metrics.unit}
                </span>
              </div>
              {progress !== null && (
                <span className={`font-semibold ${config.color}`}>
                  {progress}%
                </span>
              )}
            </div>

            {/* Gradient Progress Bar */}
            <div className="relative w-full h-2 bg-surface rounded-full overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full bg-gradient-to-r ${progressGradients[goal.category]} rounded-full`}
                style={{ width: `${progress ?? 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <Calendar className="w-3 h-3" />
            <span>{format(goal.targetDate, 'MMM dd, yyyy')}</span>
          </div>
          <span
            className={`text-xs font-medium ${isOverdue
                ? 'text-error'
                : daysUntilTarget < 30
                  ? 'text-warning'
                  : 'text-text-tertiary'
              }`}
          >
            {isOverdue
              ? `${Math.abs(daysUntilTarget)}d overdue`
              : `${daysUntilTarget}d left`}
          </span>
        </div>

        {/* Time Progress Bar */}
        <div className="mt-2 h-0.5 w-full rounded-full bg-white/[0.06]">
          <div
            className="h-0.5 rounded-full bg-primary/50 transition-all duration-700"
            style={{
              width: `${Math.min(
                Math.max(
                  (Date.now() - goal.createdAt.getTime()) /
                    (goal.targetDate.getTime() - goal.createdAt.getTime()),
                  0
                ),
                1
              ) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(GoalCard);
