'use client';

import { memo, useState } from 'react';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CourseWithExercises } from '@/lib/schemas/course.schema';
import { toggleExerciseCompletionAction } from '@/app/actions/university';
import { dispatchChampionEvent } from '@/lib/champion/championEvents';
import { invalidateCoursesAndNextTasks } from '@/lib/dashboard/invalidation';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { ChevronDown, ChevronUp, Edit2, Trash2, Calendar, BookOpen, CheckCircle2, Star } from 'lucide-react';

interface CourseCardProps {
  course: CourseWithExercises;
  onOpen: (course: CourseWithExercises) => void;
  onEdit: (course: CourseWithExercises) => void;
  onDelete: (courseId: string) => void;
  focused?: boolean;
  listNavId?: string;
  onFocusHover?: (courseId: string) => void;
}

function CourseCard({
  course,
  onOpen,
  onEdit,
  onDelete,
  focused = false,
  listNavId,
  onFocusHover,
}: CourseCardProps) {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);

  const completedCount = course.exercises.filter((ex) => ex.completed).length;
  const totalCount = course.exercises.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Calculate days until exam
  const daysUntilExam = course.examDate
    ? differenceInDays(startOfDay(course.examDate), startOfDay(new Date()))
    : null;

  const examWritten = daysUntilExam !== null && daysUntilExam < 0;

  const getExamUrgency = () => {
    if (daysUntilExam === null) return 'default';
    if (examWritten) return 'default';
    if (daysUntilExam < 45) return 'error';
    if (daysUntilExam <= 60) return 'warning';
    return 'info';
  };

  const urgencyRing =
    daysUntilExam !== null && !examWritten && daysUntilExam <= 1
      ? 'ring-2 ring-red-500/50 shadow-[0_0_12px_2px_rgba(239,68,68,0.2)]'
      : daysUntilExam !== null && !examWritten && daysUntilExam <= 3
        ? 'ring-2 ring-amber-500/40'
        : daysUntilExam !== null && !examWritten && daysUntilExam <= 7
          ? 'ring-1 ring-amber-400/25'
          : '';

  const gradeColor = (grade: number) => {
    if (grade <= 1.3) return 'text-emerald-400';
    if (grade <= 2.3) return 'text-sky-400';
    if (grade <= 3.3) return 'text-amber-400';
    return 'text-red-400';
  };

  const toggleMutation = useMutation({
    mutationFn: async ({ exerciseNumber, completed }: { exerciseNumber: number; completed: boolean }) => {
      return toggleExerciseCompletionAction(course.id, exerciseNumber, completed);
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
    onSettled: (_data, _error, variables) => {
      if (variables.completed) {
        dispatchChampionEvent({ type: 'EXERCISE_COMPLETED' });
      }
      invalidateCoursesAndNextTasks(queryClient);
    },
  });

  return (
    <div
      data-interactive="course"
      data-item-id={course.id}
      data-item-title={course.name}
      {...(listNavId ? { 'data-list-nav-id': listNavId } : {})}
      data-focused={focused ? 'true' : 'false'}
      className={`group relative bg-gradient-to-br backdrop-blur-sm border rounded-xl overflow-hidden card-hover-glow cursor-pointer ${
        examWritten
          ? 'from-emerald-500/[0.06] to-transparent border-emerald-500/25'
          : focused
            ? 'from-university-accent/10 to-transparent border-primary/70 ring-1 ring-primary/40'
            : `from-university-accent/10 to-transparent border-university-accent/30 ${urgencyRing}`
      } transition-transform duration-150 hover:-translate-y-0.5`}
      onClick={() => onOpen(course)}
      onMouseEnter={() => onFocusHover?.(course.id)}
    >
      {/* Animated glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-university-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Left border accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${
        examWritten
          ? 'from-emerald-500 to-emerald-500/60'
          : 'from-university-accent to-university-accent/70'
      }`} />

      <div className="relative z-10 p-6">
        {focused && (
          <div className="absolute left-1 top-3 text-primary/80 text-xs font-mono">▶</div>
        )}
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-university-accent" />
              <h3 className="text-lg font-semibold text-text-primary">
                {course.name}
              </h3>
              <div>
                <Badge variant="info" size="sm">
                {course.ects} ECTS
                </Badge>
              </div>
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
                  {examWritten ? (
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 rounded-md bg-emerald-500/12 px-1.5 py-0.5 text-xs font-semibold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Klausur geschrieben
                      </div>
                      {course.expectedGrade ? (
                        <div className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold bg-white/[0.06] ${gradeColor(course.expectedGrade)}`}>
                          <Star className="h-3 w-3" />
                          {course.expectedGrade.toFixed(1)}
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(course); }}
                          className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-xs text-text-tertiary hover:text-text-primary hover:bg-white/[0.09] transition-colors"
                        >
                          Note eintragen →
                        </button>
                      )}
                    </div>
                  ) : daysUntilExam !== null ? (
                    daysUntilExam <= 7 ? (
                      <span className="font-mono text-xs font-semibold text-amber-300">
                        {daysUntilExam === 0 ? 'Heute' : daysUntilExam === 1 ? 'Morgen' : `${daysUntilExam}d`}
                      </span>
                    ) : (
                      <Badge variant={getExamUrgency()} size="sm">
                        {daysUntilExam}d left
                      </Badge>
                    )
                  ) : null}
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={(event) => {
                event.stopPropagation();
                onEdit(course);
              }}
              className="p-2 text-text-tertiary hover:text-primary hover:bg-primary/10 rounded-lg transition-all hover:scale-110 active:scale-95"
              aria-label="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onDelete(course.id);
              }}
              className="p-2 text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-all hover:scale-110 active:scale-95"
              aria-label="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-all hover:scale-110 active:scale-95"
              aria-label={isExpanded ? "Collapse" : "Expand"}
              data-testid="course-expand-button"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-mono font-semibold text-text-primary">{progressPercent}% Complete</span>
            <span className="text-text-secondary">{completedCount} of {totalCount}</span>
          </div>
          <div className="relative w-full h-4 bg-gray-800/80 rounded-full overflow-hidden border-2 border-gray-700/50">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 via-green-400 to-lime-400 rounded-full transition-[width] duration-300"
              style={{
                width: `${progressPercent}%`,
                boxShadow: progressPercent > 0 ? '0 0 20px rgba(16, 185, 129, 0.8), inset 0 1px 0 rgba(255,255,255,0.3)' : 'none',
              }}
            />
            {/* Shine effect */}
            {progressPercent > 0 && (
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-b from-white/30 via-transparent to-transparent rounded-full pointer-events-none transition-[width] duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            )}
          </div>
        </div>

        {/* Expandable Exercise Grid */}
        {isExpanded && (
          <div
            className="pt-4 border-t border-border/50 animate-fadeIn"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {course.exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  data-testid={`course-exercise-${exercise.exerciseNumber}`}
                  className={`relative p-3 rounded-lg border transition-colors cursor-pointer group/ex ${exercise.completed
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(CourseCard);
