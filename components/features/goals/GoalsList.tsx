'use client';

import { Goal } from '@/lib/schemas/goal.schema';
import GoalCard from './GoalCard';

interface GoalsListProps {
  goals: Goal[];
  onGoalClick?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
}

export default function GoalsList({ goals, onGoalClick, onDelete }: GoalsListProps) {
  const handleGoalClick = (goal: Goal) => {
    if (onGoalClick) {
      onGoalClick(goal);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          onClick={() => handleGoalClick(goal)}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
