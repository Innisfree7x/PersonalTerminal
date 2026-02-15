'use client';

import { Goal } from '@/lib/schemas/goal.schema';
import { motion } from 'framer-motion';
import GoalCard from './GoalCard';

interface GoalsListProps {
  goals: Goal[];
  onGoalClick?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
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

export default function GoalsList({ goals, onGoalClick, onDelete }: GoalsListProps) {
  const handleGoalClick = (goal: Goal) => {
    if (onGoalClick) {
      onGoalClick(goal);
    }
  };

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
            onClick={() => handleGoalClick(goal)}
            onDelete={onDelete}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
