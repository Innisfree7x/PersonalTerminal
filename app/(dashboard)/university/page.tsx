'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfDay, differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';
import type { CourseWithExercises, CreateCourseInput } from '@/lib/schemas/course.schema';
import CourseCard from '@/components/features/university/CourseCard';
import CourseModal from '@/components/features/university/CourseModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, GraduationCap, BookOpen, Calendar, TrendingUp } from 'lucide-react';

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
  const daysUntilNextExam = nextExam?.examDate 
    ? differenceInDays(nextExam.examDate, today)
    : null;

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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface rounded w-1/4" />
          <div className="h-20 bg-surface rounded" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-surface rounded-lg" />
            ))}
          </div>
        </div>
      </div>
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
            <GraduationCap className="w-8 h-8 text-university-accent" />
            University
          </h1>
          <p className="text-text-secondary">
            WS 2024/25 · Track courses and exercise progress
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingCourse(null);
            setIsModalOpen(true);
          }}
          variant="primary"
          className="shadow-glow"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Course
        </Button>
      </motion.div>

      {/* Stats Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Total ECTS */}
        <div className="relative overflow-hidden bg-gradient-to-br from-university-accent/20 to-university-accent/10 backdrop-blur-sm border border-university-accent/30 rounded-lg p-6 group">
          <div className="absolute inset-0 bg-gradient-to-br from-university-accent/20 to-university-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 rounded-lg bg-university-accent/20 border border-university-accent/30">
                <BookOpen className="w-5 h-5 text-university-accent" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-university-accent mb-1">
                {totalECTS}
              </div>
              <div className="text-sm text-text-tertiary">Total ECTS</div>
            </div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm border border-primary/30 rounded-lg p-6 group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-1">
                {completionPercent}%
              </div>
              <div className="text-sm text-text-tertiary">
                {completedExercises}/{totalExercises} Exercises
              </div>
            </div>
          </div>
        </div>

        {/* Next Exam */}
        <div className={`relative overflow-hidden bg-gradient-to-br ${
          daysUntilNextExam !== null && daysUntilNextExam < 45 
            ? 'from-error/20 to-error/10 border-error/30' 
            : 'from-warning/20 to-warning/10 border-warning/30'
        } backdrop-blur-sm border rounded-lg p-6 group col-span-1 sm:col-span-2 lg:col-span-2`}>
          <div className="absolute inset-0 bg-gradient-to-br from-warning/20 to-warning/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg ${
                daysUntilNextExam !== null && daysUntilNextExam < 45 
                  ? 'bg-error/20 border-error/30' 
                  : 'bg-warning/20 border-warning/30'
              } border`}>
                <Calendar className={`w-5 h-5 ${
                  daysUntilNextExam !== null && daysUntilNextExam < 45 
                    ? 'text-error' 
                    : 'text-warning'
                }`} />
              </div>
              {daysUntilNextExam !== null && (
                <Badge 
                  variant={daysUntilNextExam < 45 ? 'error' : 'warning'}
                  size="sm"
                >
                  {daysUntilNextExam}d left
                </Badge>
              )}
            </div>
            {nextExam && nextExam.examDate ? (
              <div>
                <div className={`text-2xl font-bold mb-1 ${
                  daysUntilNextExam !== null && daysUntilNextExam < 45 
                    ? 'text-error' 
                    : 'text-warning'
                }`}>
                  {nextExam.name}
                </div>
                <div className="text-sm text-text-tertiary">
                  Exam: {format(nextExam.examDate, 'dd.MM.yyyy')}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-2xl font-bold text-text-tertiary mb-1">
                  No upcoming exams
                </div>
                <div className="text-sm text-text-tertiary">
                  You're all caught up! 🎉
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Course Cards */}
      {courses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center py-20 bg-surface/50 backdrop-blur-sm border border-border rounded-lg"
        >
          <div className="text-6xl mb-4">🎓</div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            No courses yet
          </h3>
          <p className="text-text-tertiary mb-6">
            Add your first course to start tracking your semester progress
          </p>
          <Button
            onClick={() => {
              setEditingCourse(null);
              setIsModalOpen(true);
            }}
            variant="primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Course
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <CourseCard
                course={course}
                onEdit={() => handleEditCourse(course)}
                onDelete={() => handleDeleteCourse(course.id)}
              />
            </motion.div>
          ))}
        </div>
      )}

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
