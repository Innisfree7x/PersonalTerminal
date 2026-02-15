'use client';

import { useState } from 'react';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import type { CourseWithExercises } from '@/lib/schemas/course.schema';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { ChevronDown, ChevronUp, Edit2, Trash2, Calendar, BookOpen } from 'lucide-react';

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
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to toggle exercise (${response.status})`);
  }
}

export default function CourseCard({ course, onEdit, onDelete }: CourseCardProps) {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);

  const completedCount = course.exercises.filter((ex) => ex.completed).length;
  const totalCount = course.exercises.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Calculate days until exam
  const daysUntilExam = course.examDate
    ? differenceInDays(startOfDay(course.examDate), startOfDay(new Date()))
    : null;

  const getExamUrgency = () => {
    if (!daysUntilExam) return 'default';
    if (daysUntilExam < 45) return 'error';
    if (daysUntilExam <= 60) return 'warning';
    return 'info';
  };

  const toggleMutation = useMutation({
    mutationFn: async ({ exerciseNumber, completed }: { exerciseNumber: number; completed: boolean }) => {
      return toggleExercise(course.id, exerciseNumber, completed);
    },
    onMutate: async ({ exerciseNumber, completed }) => {
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
    onError: (_err, _variables, context) => {
      if (context?.previousCourses) {
        queryClient.setQueryData(['courses'], context.previousCourses);
      }
    },
    onSettled: async () => {
      await queryClient.refetchQueries({ queryKey: ['courses'] });
      await queryClient.refetchQueries({ queryKey: ['study-tasks'] });
      await queryClient.refetchQueries({ queryKey: ['dashboard'] });
    },
  });

  return (
    <motion.div
      className="group relative bg-gradient-to-br from-university-accent/10 to-transparent backdrop-blur-sm border border-university-accent/30 rounded-xl overflow-hidden card-hover-glow"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Animated glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-university-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Left border accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-university-accent to-university-accent/70" />

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-university-accent" />
              <h3 className="text-lg font-semibold text-text-primary">
                {course.name}
              </h3>
              <Badge variant="info" size="sm">
                {course.ects} ECTS
              </Badge>
            </div>

            {/* Progress & Exam Info */}
            <div className="flex items-center gap-4 text-sm text-text-tertiary">
              <div className="flex items-center gap-1.5">
                <span className="font-mono">
                  {completedCount}/{totalCount}
                </span>
                <span>Exercises</span>
              </div>
              {course.examDate && (
                <>
                  <span>·</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>{format(course.examDate, 'dd.MM.yyyy')}</span>
                  </div>
                  {daysUntilExam !== null && (
                    <Badge variant={getExamUrgency()} size="sm">
                      {daysUntilExam}d left
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-4">
            <motion.button
              onClick={onEdit}
              className="p-2 text-text-tertiary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={onDelete}
              className="p-2 text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-mono font-semibold text-text-primary">{progressPercent}% Complete</span>
            <span className="text-text-secondary">{completedCount} of {totalCount}</span>
          </div>
          <div className="relative w-full h-4 bg-gray-800/80 rounded-full overflow-hidden border-2 border-gray-700/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 via-green-400 to-lime-400 rounded-full"
              style={{
                boxShadow: progressPercent > 0 ? '0 0 20px rgba(16, 185, 129, 0.8), inset 0 1px 0 rgba(255,255,255,0.3)' : 'none'
              }}
            />
            {/* Shine effect */}
            {progressPercent > 0 && (
              <div
                className="absolute top-0 left-0 h-full w-full bg-gradient-to-b from-white/30 via-transparent to-transparent rounded-full pointer-events-none"
                style={{ width: `${progressPercent}%` }}
              />
            )}
          </div>
        </div>

        {/* Expandable Exercise Grid */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="pt-4 border-t border-border/50 overflow-hidden"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {course.exercises.map((exercise, index) => (
                  <motion.div
                    key={exercise.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className={`relative p-3 rounded-lg border transition-all cursor-pointer group/ex ${exercise.completed
                        ? 'bg-success/10 border-success/30'
                        : 'bg-surface border-border hover:border-primary/50'
                      }`}
                    onClick={() =>
                      toggleMutation.mutate({
                        exerciseNumber: exercise.exerciseNumber,
                        completed: !exercise.completed,
                      })
                    }
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Checkbox
                        checked={exercise.completed}
                        className="pointer-events-none"
                      />
                    </div>
                    <span className={`text-sm font-medium ${exercise.completed ? 'text-success' : 'text-text-primary'
                      }`}>
                      Blatt {exercise.exerciseNumber}
                    </span>
                    {exercise.completedAt && (
                      <div className="text-xs text-text-tertiary mt-1">
                        {format(exercise.completedAt, 'dd.MM')}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
