'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Goal, CreateGoalInput, GoalCategory } from '@/lib/schemas/goal.schema';
import { calculateProgress, goalToCreateInput } from '@/lib/utils/goalUtils';
import { createGoalAction, updateGoalAction, deleteGoalAction, fetchGoalsAction } from '@/app/actions/goals';
import toast from 'react-hot-toast';
import GoalsList from '@/components/features/goals/GoalsList';
import GoalModal from '@/components/features/goals/GoalModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Target, Filter } from 'lucide-react';

type SortOption = 'date' | 'progress' | 'title';
type FilterOption = GoalCategory | 'all';

const categoryConfig: Record<FilterOption, { label: string; icon: string; color: string }> = {
  all: { label: 'All Goals', icon: '🎯', color: 'primary' },
  fitness: { label: 'Fitness', icon: '💪', color: 'error' },
  career: { label: 'Career', icon: '💼', color: 'career-accent' },
  learning: { label: 'Learning', icon: '📚', color: 'primary' },
  finance: { label: 'Finance', icon: '💰', color: 'success' },
};

function normalizeGoal(goal: any): Goal {
  return {
    ...goal,
    targetDate: new Date(goal.targetDate),
    createdAt: new Date(goal.createdAt),
  };
}

export default function GoalsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  // Fetch goals with React Query
  const {
    data: goals = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const fetchedGoals = await fetchGoalsAction();
      return fetchedGoals.map(normalizeGoal);
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createGoalAction,
    onMutate: async (newGoalInput) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      const previousGoals = queryClient.getQueryData<Goal[]>(['goals']) || [];
      const tempId = crypto.randomUUID();
      const optimisticGoal: Goal = {
        id: tempId,
        ...newGoalInput,
        createdAt: new Date(),
      };
      queryClient.setQueryData<Goal[]>(['goals'], [optimisticGoal, ...previousGoals]);
      return { previousGoals, tempId };
    },
    onSuccess: (createdGoal, _variables, context) => {
      const normalizedCreatedGoal = normalizeGoal(createdGoal);
      queryClient.setQueryData<Goal[]>(['goals'], (current = []) => {
        if (!context?.tempId) return [normalizedCreatedGoal, ...current];
        const replaced = current.map((goal) =>
          goal.id === context.tempId ? normalizedCreatedGoal : goal
        );
        const hasTemp = current.some((goal) => goal.id === context.tempId);
        return hasTemp ? replaced : [normalizedCreatedGoal, ...current];
      });
      setIsModalOpen(false);
      setEditingGoal(null);
      toast.success('Goal created!');
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(['goals'], context.previousGoals);
      }
      toast.error(err.message || 'Failed to create goal');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: CreateGoalInput }) =>
      updateGoalAction(goalId, data),
    onMutate: async ({ goalId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      const previousGoals = queryClient.getQueryData<Goal[]>(['goals']) || [];
      queryClient.setQueryData<Goal[]>(['goals'], (current = []) =>
        current.map((goal) =>
          goal.id === goalId
            ? {
                ...goal,
                ...data,
                targetDate: data.targetDate ?? goal.targetDate,
              }
            : goal
        )
      );
      return { previousGoals };
    },
    onSuccess: () => {
      setIsModalOpen(false);
      setEditingGoal(null);
      toast.success('Goal updated!');
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(['goals'], context.previousGoals);
      }
      toast.error(err.message || 'Failed to update goal');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteGoalAction,
    onMutate: async (goalId) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      const previousGoals = queryClient.getQueryData<Goal[]>(['goals']) || [];
      queryClient.setQueryData<Goal[]>(
        ['goals'],
        previousGoals.filter((goal) => goal.id !== goalId)
      );
      return { previousGoals };
    },
    onSuccess: () => {
      toast.success('Goal deleted');
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(['goals'], context.previousGoals);
      }
      toast.error(err.message || 'Failed to delete goal');
    },
  });

  const handleAddGoal = (data: CreateGoalInput) => {
    createMutation.mutate(data);
  };

  const handleEditGoal = (data: CreateGoalInput) => {
    if (!editingGoal) return;
    updateMutation.mutate({ goalId: editingGoal.id, data });
  };

  const handleDeleteGoal = (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      deleteMutation.mutate(goalId);
    }
  };

  const handleGoalClick = (goal: Goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
    createMutation.reset();
    updateMutation.reset();
  };

  // Filter and sort goals
  const filteredAndSortedGoals = useMemo(() => {
    let filtered = goals;

    // Filter by category
    if (filterBy !== 'all') {
      filtered = filtered.filter((goal) => goal.category === filterBy);
    }

    // Sort goals
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return a.targetDate.getTime() - b.targetDate.getTime();
        case 'progress':
          const progressA = a.metrics ? calculateProgress(a.metrics) : 0;
          const progressB = b.metrics ? calculateProgress(b.metrics) : 0;
          return progressB - progressA;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return sorted;
  }, [goals, filterBy, sortBy]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = goals.length;
    const byCategory = goals.reduce((acc, goal) => {
      acc[goal.category] = (acc[goal.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const completed = goals.filter(g =>
      g.metrics && (g.metrics.current / g.metrics.target) >= 1
    ).length;

    const overdue = goals.filter(g =>
      g.targetDate < new Date()
    ).length;

    return { total, byCategory, completed, overdue };
  }, [goals]);

  const isEditMode = editingGoal !== null;
  const initialData = editingGoal ? goalToCreateInput(editingGoal) : undefined;
  const saveError = isEditMode ? updateMutation.error : createMutation.error;
  const saveErrorMessage = saveError instanceof Error ? saveError.message : null;
  const isSaving = isEditMode ? updateMutation.isPending : createMutation.isPending;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const action = new URLSearchParams(window.location.search).get('action');
    if (action !== 'new-goal') return;
    setEditingGoal(null);
    setIsModalOpen(true);
    router.replace(pathname);
  }, [pathname, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface rounded w-1/4" />
          <div className="h-12 bg-surface rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-surface rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[400px] space-y-4"
      >
        <div className="text-4xl">⚠️</div>
        <div className="text-error text-center">
          <div className="font-semibold mb-1">Failed to load goals</div>
          <div className="text-sm text-text-tertiary">
            {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3 mb-2">
            <Target className="w-8 h-8 text-primary" />
            Goals
          </h1>
          <p className="text-text-secondary">
            Track your goals and monitor your progress
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingGoal(null);
            setIsModalOpen(true);
          }}
          variant="primary"
          className="shadow-glow"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Goal
        </Button>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="card-surface p-4">
          <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
          <div className="text-xs text-text-tertiary">Total Goals</div>
        </div>
        <div className="bg-success/10 border border-success/30 rounded-lg p-4">
          <div className="text-2xl font-bold text-success">{stats.completed}</div>
          <div className="text-xs text-text-tertiary">Completed</div>
        </div>
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <div className="text-2xl font-bold text-primary">
            {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
          </div>
          <div className="text-xs text-text-tertiary">Success Rate</div>
        </div>
        {stats.overdue > 0 && (
          <div className="bg-error/10 border border-error/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-error">{stats.overdue}</div>
            <div className="text-xs text-text-tertiary">Overdue</div>
          </div>
        )}
      </motion.div>

      {/* Pill Tabs + Sort */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap items-center gap-4"
      >
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(categoryConfig) as FilterOption[]).map((category) => {
            const config = categoryConfig[category];
            const count = category === 'all' ? stats.total : (stats.byCategory[category] || 0);
            const isActive = filterBy === category;

            return (
              <motion.button
                key={category}
                onClick={() => setFilterBy(category)}
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive
                    ? 'bg-primary text-white shadow-glow'
                    : 'bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border'
                  }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="mr-2">{config.icon}</span>
                {config.label}
                {count > 0 && (
                  <Badge
                    variant={isActive ? 'default' : 'default'}
                    size="sm"
                    className="ml-2"
                  >
                    {count}
                  </Badge>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Sort Dropdown */}
        <div className="ml-auto flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-tertiary" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="input-field text-sm"
          >
            <option value="date">Target Date</option>
            <option value="progress">Progress</option>
            <option value="title">Title</option>
          </select>
        </div>
      </motion.div>

      {/* Goals Grid */}
      <AnimatePresence mode="wait">
        {filteredAndSortedGoals.length > 0 ? (
          <motion.div
            key="goals-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GoalsList
              goals={filteredAndSortedGoals}
              onGoalClick={handleGoalClick}
              onDelete={handleDeleteGoal}
            />
          </motion.div>
        ) : (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">{categoryConfig[filterBy].icon}</div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No {filterBy !== 'all' ? filterBy : ''} goals yet
            </h3>
            <p className="text-text-tertiary mb-6">
              Create your first {filterBy !== 'all' ? filterBy : ''} goal to get started!
            </p>
            <Button
              onClick={() => {
                setEditingGoal(null);
                setIsModalOpen(true);
              }}
              variant="primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Goal
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal Modal */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={isEditMode ? handleEditGoal : handleAddGoal}
        {...(editingGoal ? { layoutId: `goal-card-${editingGoal.id}` } : {})}
        initialData={initialData}
        isEdit={isEditMode}
        errorMessage={saveErrorMessage}
        isSaving={isSaving}
      />
    </div>
  );
}
