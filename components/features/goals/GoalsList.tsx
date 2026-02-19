'use client';

import { Goal } from '@/lib/schemas/goal.schema';
import { motion } from 'framer-motion';
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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function GoalsList({
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col items-center text-center py-20 bg-surface/50 backdrop-blur-sm border border-border rounded-xl"
      >
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
      </motion.div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {goals.map((goal) => (
        <motion.div key={goal.id} variants={itemVariants}>
          <GoalCard
            goal={goal}
            layoutId={`goal-card-${goal.id}`}
            onClick={() => handleGoalClick(goal)}
            onDelete={onDelete}
            focused={focusedGoalId === goal.id}
            listNavId={goal.id}
            {...(onGoalFocus ? { onFocusHover: () => onGoalFocus(goal.id) } : {})}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
