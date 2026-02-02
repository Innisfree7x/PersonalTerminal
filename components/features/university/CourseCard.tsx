'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CourseWithExercises } from '@/lib/schemas/course.schema';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CourseCardProps {
  course: CourseWithExercises;
  onEdit: () => void;
  onDelete: () => void;
}

async function toggleExercise(courseId: string, exerciseNumber: number, completed: boolean): Promise<void> {
  const response = await fetch(`/api/courses/${courseId}/exercises/${exerciseNumber}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  });
  if (!response.ok) throw new Error('Failed to toggle exercise');
}

export default function CourseCard({ course, onEdit, onDelete }: CourseCardProps) {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);

  const completedCount = course.exercises.filter((ex) => ex.completed).length;
  const totalCount = course.exercises.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleMutation = useMutation({
    mutationFn: ({ exerciseNumber, completed }: { exerciseNumber: number; completed: boolean }) =>
      toggleExercise(course.id, exerciseNumber, completed),
    onMutate: async ({ exerciseNumber, completed }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['courses'] });
      const previousCourses = queryClient.getQueryData(['courses']);

      queryClient.setQueryData(['courses'], (old: any) => {
        if (!old) return old;
        return old.map((c: CourseWithExercises) => {
          if (c.id !== course.id) return c;
          return {
            ...c,
            exercises: c.exercises.map((ex) =>
              ex.exerciseNumber === exerciseNumber
                ? { ...ex, completed, completedAt: completed ? new Date() : undefined }
                : ex
            ),
          };
        });
      });

      return { previousCourses };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCourses) {
        queryClient.setQueryData(['courses'], context.previousCourses);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  return (
    <div className="bg-gray-900/50 dark:bg-gray-800/50 rounded-lg border border-gray-700 dark:border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-100 dark:text-gray-100">
              {course.name}
            </h3>
            <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-blue-900/30 text-blue-400 dark:bg-blue-900/30 dark:text-blue-400 rounded">
              {course.ects} ECTS
            </span>
          </div>

          {/* Progress */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-400 mb-1">
              <span className="font-mono">
                {completedCount}/{totalCount} ({progressPercent}%)
              </span>
              {course.examDate && (
                <span className="text-yellow-400 dark:text-yellow-400">
                  Klausur: {format(course.examDate, 'dd.MM.yyyy')}
                </span>
              )}
            </div>
            <div className="w-full bg-gray-800 dark:bg-gray-900 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onEdit}
            className="px-2 py-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Expandable Body - Exercise Grid */}
      {isExpanded && (
        <div className="pt-3 border-t border-gray-800 dark:border-gray-700">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {course.exercises.map((exercise) => (
              <label
                key={exercise.id}
                className={`flex items-center gap-2 p-2 rounded border transition-all cursor-pointer ${
                  exercise.completed
                    ? 'bg-green-900/20 border-green-700 opacity-70'
                    : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={exercise.completed}
                  onChange={(e) =>
                    toggleMutation.mutate({
                      exerciseNumber: exercise.exerciseNumber,
                      completed: e.target.checked,
                    })
                  }
                  className="w-5 h-5"
                />
                <span className="text-sm text-gray-300 dark:text-gray-300">
                  {exercise.completed && '✓ '}Blatt {exercise.exerciseNumber}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
