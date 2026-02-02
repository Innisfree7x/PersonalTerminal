'use client';

import { Goal } from '@/lib/schemas/goal.schema';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Trash2, Calendar, TrendingUp } from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  onClick?: () => void;
  onDelete?: (goalId: string) => void;
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

  const config = categoryConfig[goal.category];
  const isOverdue = daysUntilTarget < 0;
  const isCompleted = progress !== null && progress >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={`group relative bg-gradient-to-br ${config.bgGradient} backdrop-blur-sm border ${config.borderColor} rounded-xl p-6 cursor-pointer overflow-hidden`}
    >
      {/* Animated glow on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      {/* Left border accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${progressGradients[goal.category]} opacity-80`} />

      <div className="relative z-10">
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
            <motion.button
              onClick={handleDelete}
              className="p-2 text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Delete goal"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
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
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress ?? 0}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`absolute top-0 left-0 h-full bg-gradient-to-r ${progressGradients[goal.category]} rounded-full`}
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
            className={`text-xs font-medium ${
              isOverdue
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
      </div>
    </motion.div>
  );
}
