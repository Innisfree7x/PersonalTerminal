'use client';

import { memo } from 'react';
import { Goal } from '@/lib/schemas/goal.schema';
import { Target, Plus } from 'lucide-react';
import GoalCard from './GoalCard';

interface GoalsListProps {
  goals: Goal[];
  onGoalClick?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
  focusedGoalId?: string | null;
  onGoalFocus?: (goalId: string) => void;
  onAddGoal?: () => void;
}

function GoalsList({
  goals,
  onGoalClick,
  onDelete,
  focusedGoalId = null,
  onGoalFocus,
  onAddGoal,
}: GoalsListProps) {
  const handleGoalClick = (goal: Goal) => {
    if (onGoalClick) {
      onGoalClick(goal);
    }
  };

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-border bg-surface/50 py-20 text-center backdrop-blur-sm">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
          <Target className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Noch keine Ziele angelegt
        </h3>
        <p className="text-sm text-text-tertiary max-w-xs leading-relaxed mb-6">
          Definiere, woran du arbeitest — Fitness, Karriere, Lernen oder Finanzen. Ziele geben deinem Dashboard Kontext.
        </p>
        {onAddGoal && (
          <button
            onClick={onAddGoal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            Erstes Ziel erstellen
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          onClick={handleGoalClick}
          onDelete={onDelete}
          focused={focusedGoalId === goal.id}
          listNavId={goal.id}
          onFocusHover={onGoalFocus}
        />
      ))}
    </div>
  );
}

export default memo(GoalsList);
