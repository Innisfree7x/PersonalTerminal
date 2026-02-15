'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createGoalSchema, CreateGoalInput } from '@/lib/schemas/goal.schema';

interface GoalFormProps {
  onSubmit: (data: CreateGoalInput) => void;
  onCancel: () => void;
  initialData?: CreateGoalInput | undefined;
  isEdit?: boolean;
  submitDisabled?: boolean;
}

const DEFAULT_GOAL_FORM_VALUES: CreateGoalInput = {
  title: '',
  description: '',
  category: 'fitness',
  targetDate: new Date(),
  metrics: {
    current: 0,
    target: 0,
    unit: '',
  },
};

export default function GoalForm({
  onSubmit,
  onCancel,
  initialData,
  isEdit = false,
  submitDisabled = false,
}: GoalFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateGoalInput>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: DEFAULT_GOAL_FORM_VALUES,
  });

  // Reset form when initialData changes (edit → add or switching between items)
  useEffect(() => {
    reset(initialData ?? DEFAULT_GOAL_FORM_VALUES);
  }, [initialData, reset]);

  const onSubmitForm = (data: CreateGoalInput) => {
    // Zod preprocess should already handle date conversion, but ensure it's a Date
    const targetDate = data.targetDate instanceof Date 
      ? data.targetDate 
      : new Date(data.targetDate);

    // Prepare metrics - remove if all fields are empty/zero
    let metrics = data.metrics;
    if (
      metrics &&
      (!metrics.current || metrics.current === 0) &&
      (!metrics.target || metrics.target === 0) &&
      (!metrics.unit || metrics.unit.trim() === '')
    ) {
      metrics = undefined;
    }

    onSubmit({
      ...data,
      targetDate,
      metrics,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter goal title"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
          placeholder="Enter goal description (optional)"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          {...register('category')}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 ${
            errors.category ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="fitness">Fitness</option>
          <option value="career">Career</option>
          <option value="learning">Learning</option>
          <option value="finance">Finance</option>
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category.message}</p>
        )}
      </div>

      {/* Target Date */}
      <div>
        <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Target Date <span className="text-red-500">*</span>
        </label>
        <input
          id="targetDate"
          type="date"
          {...register('targetDate', {
            valueAsDate: false, // Keep as string, let zod preprocess handle conversion
            setValueAs: (value: string) => value || undefined,
          })}
          defaultValue={initialData?.targetDate ? new Date(initialData.targetDate).toISOString().split('T')[0] : ''}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 ${
            errors.targetDate ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.targetDate && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.targetDate.message || 'Please select a valid target date'}
          </p>
        )}
      </div>

      {/* Metrics Section */}
      <div className="border-t pt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Metrics (Optional)
        </label>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Current Value */}
            <div>
              <label htmlFor="metrics.current" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Current
              </label>
              <input
                id="metrics.current"
                type="number"
                step="any"
                {...register('metrics.current', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                placeholder="0"
              />
              {errors.metrics?.current && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.metrics.current.message}</p>
              )}
            </div>

            {/* Target Value */}
            <div>
              <label htmlFor="metrics.target" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Target
              </label>
              <input
                id="metrics.target"
                type="number"
                step="any"
                {...register('metrics.target', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                placeholder="0"
              />
              {errors.metrics?.target && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.metrics.target.message}</p>
              )}
            </div>
          </div>

          {/* Unit */}
          <div>
            <label htmlFor="metrics.unit" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Unit
            </label>
            <input
              id="metrics.unit"
              type="text"
              {...register('metrics.unit')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              placeholder="kg, km, €, etc."
            />
            {errors.metrics?.unit && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.metrics.unit.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || submitDisabled}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Goal' : 'Create Goal')}
        </button>
      </div>
    </form>
  );
}
