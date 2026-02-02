'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfDay } from 'date-fns';
import type { CourseWithExercises, CreateCourseInput } from '@/lib/schemas/course.schema';
import CourseCard from '@/components/features/university/CourseCard';
import CourseModal from '@/components/features/university/CourseModal';

async function fetchCourses(): Promise<CourseWithExercises[]> {
  const response = await fetch('/api/courses');
  if (!response.ok) throw new Error('Failed to fetch courses');
  const data = await response.json();
  return data.map((course: any) => ({
    ...course,
    examDate: course.examDate ? new Date(course.examDate) : undefined,
    createdAt: new Date(course.createdAt),
    exercises: course.exercises.map((ex: any) => ({
      ...ex,
      completedAt: ex.completedAt ? new Date(ex.completedAt) : undefined,
      createdAt: new Date(ex.createdAt),
    })),
  }));
}

async function createCourse(data: CreateCourseInput): Promise<CourseWithExercises> {
  const response = await fetch('/api/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create course');
  return response.json();
}

async function deleteCourse(id: string): Promise<void> {
  const response = await fetch(`/api/courses/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete course');
}

export default function UniversityPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseWithExercises | null>(null);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  // Calculate stats
  const totalECTS = courses.reduce((sum, course) => sum + course.ects, 0);
  const totalExercises = courses.reduce((sum, course) => sum + course.exercises.length, 0);
  const completedExercises = courses.reduce(
    (sum, course) => sum + course.exercises.filter((ex) => ex.completed).length,
    0
  );
  const completionPercent =
    totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

  // Find next exam
  const today = startOfDay(new Date());
  const upcomingExams = courses
    .filter((course) => course.examDate && startOfDay(course.examDate) >= today)
    .sort((a, b) => {
      if (!a.examDate || !b.examDate) return 0;
      return a.examDate.getTime() - b.examDate.getTime();
    });
  const nextExam = upcomingExams[0];

  const handleAddCourse = (data: CreateCourseInput) => {
    createMutation.mutate(data);
  };

  const handleEditCourse = (course: CourseWithExercises) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const handleDeleteCourse = (courseId: string) => {
    if (confirm('Are you sure you want to delete this course? All exercise progress will be lost.')) {
      deleteMutation.mutate(courseId);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100 dark:text-gray-100">
          📚 My Courses - WS 2024/25
        </h1>
      </div>

      {/* Stats Card */}
      <div className="bg-gray-900/50 dark:bg-gray-800/50 rounded-lg border border-gray-700 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total ECTS */}
          <div>
            <div className="text-sm text-gray-400 dark:text-gray-400 mb-1">Total ECTS</div>
            <div className="text-3xl font-mono font-bold text-blue-400 dark:text-blue-400">
              {totalECTS}
            </div>
          </div>

          {/* Completion */}
          <div>
            <div className="text-sm text-gray-400 dark:text-gray-400 mb-1">Completion</div>
            <div className="text-3xl font-mono font-bold text-purple-400 dark:text-purple-400">
              {completedExercises}/{totalExercises}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 font-mono">
              ({completionPercent}%)
            </div>
          </div>

          {/* Next Exam */}
          <div>
            <div className="text-sm text-gray-400 dark:text-gray-400 mb-1">Next Exam</div>
            {nextExam && nextExam.examDate ? (
              <>
                <div className="text-lg font-semibold text-green-400 dark:text-green-400">
                  {nextExam.name}
                </div>
                <div className="text-sm text-gray-400 dark:text-gray-400 font-mono">
                  {format(nextExam.examDate, 'dd.MM.yyyy')}
                </div>
              </>
            ) : (
              <div className="text-lg text-gray-500 dark:text-gray-500">No upcoming exams</div>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-400">
          Loading courses...
        </div>
      )}

      {/* Course Cards */}
      {!isLoading && (
        <div className="space-y-4">
          {courses.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-500">
              No courses yet. Add your first course to get started!
            </div>
          ) : (
            courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEdit={() => handleEditCourse(course)}
                onDelete={() => handleDeleteCourse(course.id)}
              />
            ))
          )}
        </div>
      )}

      {/* Add Course Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={() => {
            setEditingCourse(null);
            setIsModalOpen(true);
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          + Add Course
        </button>
      </div>

      {/* Course Modal */}
      <CourseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleAddCourse}
        initialData={
          editingCourse
            ? {
                name: editingCourse.name,
                ects: editingCourse.ects,
                numExercises: editingCourse.numExercises,
                examDate: editingCourse.examDate,
                semester: editingCourse.semester,
              }
            : undefined
        }
        isEdit={!!editingCourse}
      />
    </div>
  );
}
