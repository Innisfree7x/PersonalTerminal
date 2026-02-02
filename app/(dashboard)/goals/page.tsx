'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Goal, CreateGoalInput, GoalCategory } from '@/lib/schemas/goal.schema';
import { calculateProgress, goalToCreateInput } from '@/lib/utils/goalUtils';
import { fetchGoals, createGoal, updateGoal, deleteGoal } from '@/lib/api/goals';
import GoalsList from '@/components/features/goals/GoalsList';
import GoalModal from '@/components/features/goals/GoalModal';

type SortOption = 'date' | 'progress' | 'title';
type FilterOption = GoalCategory | 'all';

export default function GoalsPage() {
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
    queryFn: fetchGoals,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsModalOpen(false);
      setEditingGoal(null);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: CreateGoalInput }) =>
      updateGoal(goalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsModalOpen(false);
      setEditingGoal(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
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
          return progressB - progressA; // Descending (highest first)
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return sorted;
  }, [goals, filterBy, sortBy]);

  const isEditMode = editingGoal !== null;
  const initialData = editingGoal ? goalToCreateInput(editingGoal) : undefined;
  const saveErrorMessage =
    (isEditMode ? updateMutation.error : createMutation.error) instanceof Error
      ? (isEditMode ? updateMutation.error : createMutation.error)!.message
      : null;
  const isSaving = isEditMode ? updateMutation.isPending : createMutation.isPending;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 dark:text-gray-400">Loading goals...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-600 dark:text-red-400">
          Error loading goals: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Add Button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Goals
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your goals and monitor your progress
          </p>
        </div>
        <button
          onClick={() => {
            setEditingGoal(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          + Add Goal
        </button>
      </div>

      {/* Filters and Sort */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        {/* Filter by Category */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter:
          </label>
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All</option>
            <option value="fitness">Fitness</option>
            <option value="career">Career</option>
            <option value="learning">Learning</option>
            <option value="finance">Finance</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sort by:
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="date">Target Date</option>
            <option value="progress">Progress</option>
            <option value="title">Title</option>
          </select>
        </div>

        {/* Results count */}
        <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
          {filteredAndSortedGoals.length} {filteredAndSortedGoals.length === 1 ? 'goal' : 'goals'}
        </div>
      </div>

      {/* Goals Grid */}
      {filteredAndSortedGoals.length > 0 ? (
        <GoalsList
          goals={filteredAndSortedGoals}
          onGoalClick={handleGoalClick}
          onDelete={handleDeleteGoal}
        />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {filterBy !== 'all'
              ? `No ${filterBy} goals found. Create your first ${filterBy} goal!`
              : 'No goals yet. Create your first goal to get started!'}
          </p>
        </div>
      )}

      {/* Goal Modal */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={isEditMode ? handleEditGoal : handleAddGoal}
        initialData={initialData}
        isEdit={isEditMode}
        errorMessage={saveErrorMessage}
        isSaving={isSaving}
      />
    </div>
  );
}
