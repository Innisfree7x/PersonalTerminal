'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { createCourseSchema, type CreateCourseInput } from '@/lib/schemas/course.schema';
import type { CourseWithExercises } from '@/lib/schemas/course.schema';
import { Badge } from '@/components/ui/Badge';
import { BookOpen } from 'lucide-react';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCourseInput) => void;
  initialData?: CreateCourseInput | undefined;
  isEdit?: boolean;
  isSaving?: boolean;
  error?: string | null;
  layoutId?: string;
  layoutCourse?: CourseWithExercises | null;
}

const DEFAULT_COURSE_FORM_VALUES: CreateCourseInput = {
  name: '',
  ects: 6,
  numExercises: 12,
  examDate: undefined,
  semester: 'WS 2024/25',
};

export default function CourseModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
  isSaving = false,
  error = null,
  layoutId,
  layoutCourse = null,
}: CourseModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: DEFAULT_COURSE_FORM_VALUES,
  });

  useEffect(() => {
    if (isOpen) {
      reset(initialData ?? DEFAULT_COURSE_FORM_VALUES);
    }
  }, [isOpen, initialData, reset]);

  const handleFormSubmit = (data: CreateCourseInput) => {
    onSubmit(data);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const completedCount = layoutCourse
    ? layoutCourse.exercises.filter((ex) => ex.completed).length
    : 0;
  const totalCount = layoutCourse?.exercises.length ?? 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            {...(layoutId ? { layoutId } : {})}
            className="bg-gray-900 dark:bg-gray-800 rounded-xl border border-gray-700 dark:border-gray-700 p-6 max-w-2xl w-full mx-4"
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
          >
            {isEdit && layoutCourse && (
              <div className="mb-5 rounded-lg border border-gray-700 bg-gray-800/60 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <BookOpen className="w-5 h-5 text-university-accent" />
                  <motion.h3 layoutId={`course-title-${layoutCourse.id}`} className="text-lg font-semibold text-gray-100">
                    {layoutCourse.name}
                  </motion.h3>
                  <motion.div layoutId={`course-ects-${layoutCourse.id}`}>
                    <Badge variant="info" size="sm">
                      {layoutCourse.ects} ECTS
                    </Badge>
                  </motion.div>
                </div>
                <div className="text-xs text-gray-400 mb-2">
                  {completedCount}/{totalCount} exercises completed
                </div>
                <motion.div
                  layoutId={`course-progress-shell-${layoutCourse.id}`}
                  className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700"
                >
                  <motion.div
                    layoutId={`course-progress-fill-${layoutCourse.id}`}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 via-green-400 to-lime-400 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </motion.div>
              </div>
            )}

            <h2 className="text-xl font-semibold text-gray-100 dark:text-gray-100 mb-4">
              {isEdit ? 'Edit Course' : 'Add New Course'}
            </h2>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Course Name */}
          <div>
            <label htmlFor="course-name" className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-1">
              Course Name <span className="text-red-400">*</span>
            </label>
            <input
              id="course-name"
              type="text"
              {...register('name')}
              className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 text-gray-100 dark:text-gray-100 border border-gray-700 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500"
            />
            {errors.name && (
              <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* ECTS */}
          <div>
            <label htmlFor="course-ects" className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-1">
              ECTS <span className="text-red-400">*</span>
            </label>
            <input
              id="course-ects"
              type="number"
              min="1"
              max="15"
              {...register('ects', { valueAsNumber: true })}
              className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 text-gray-100 dark:text-gray-100 border border-gray-700 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 font-mono"
            />
            {errors.ects && (
              <p className="text-xs text-red-400 mt-1">{errors.ects.message}</p>
            )}
          </div>

          {/* Number of Exercises */}
          <div>
            <label htmlFor="course-num-exercises" className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-1">
              Number of Exercises <span className="text-red-400">*</span>
            </label>
            <input
              id="course-num-exercises"
              type="number"
              min="1"
              max="20"
              {...register('numExercises', { valueAsNumber: true })}
              className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 text-gray-100 dark:text-gray-100 border border-gray-700 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 font-mono"
            />
            {errors.numExercises && (
              <p className="text-xs text-red-400 mt-1">{errors.numExercises.message}</p>
            )}
          </div>

          {/* Exam Date */}
          <div>
            <label htmlFor="course-exam-date" className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-1">
              Exam Date (optional)
            </label>
            <input
              id="course-exam-date"
              type="date"
              {...register('examDate')}
              className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 text-gray-100 dark:text-gray-100 border border-gray-700 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 font-mono"
            />
            {errors.examDate && (
              <p className="text-xs text-red-400 mt-1">{String(errors.examDate.message)}</p>
            )}
          </div>

          {/* Semester */}
          <div>
            <label htmlFor="course-semester" className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-1">
              Semester <span className="text-red-400">*</span>
            </label>
            <input
              id="course-semester"
              type="text"
              {...register('semester')}
              className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 text-gray-100 dark:text-gray-100 border border-gray-700 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500"
            />
            {errors.semester && (
              <p className="text-xs text-red-400 mt-1">{errors.semester.message}</p>
            )}
          </div>

          {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  data-testid="course-modal-submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Course'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
