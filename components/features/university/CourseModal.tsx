'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCourseSchema, type CreateCourseInput } from '@/lib/schemas/course.schema';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCourseInput) => void;
  initialData?: CreateCourseInput;
  isEdit?: boolean;
}

export default function CourseModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
}: CourseModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: initialData || {
      name: '',
      ects: 6,
      numExercises: 12,
      examDate: undefined,
      semester: 'WS 2024/25',
    },
  });

  const handleFormSubmit = (data: CreateCourseInput) => {
    onSubmit(data);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-900 dark:bg-gray-800 rounded-lg border border-gray-700 dark:border-gray-700 p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-gray-100 dark:text-gray-100 mb-4">
          {isEdit ? 'Edit Course' : 'Add New Course'}
        </h2>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Course Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-1">
              Course Name <span className="text-red-400">*</span>
            </label>
            <input
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
            <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-1">
              ECTS <span className="text-red-400">*</span>
            </label>
            <input
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
            <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-1">
              Number of Exercises <span className="text-red-400">*</span>
            </label>
            <input
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
            <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-1">
              Exam Date (optional)
            </label>
            <input
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
            <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-1">
              Semester <span className="text-red-400">*</span>
            </label>
            <input
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {isEdit ? 'Save Changes' : 'Add Course'}
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
      </div>
    </div>
  );
}
