'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfDay, differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import type { CourseWithExercises, CreateCourseInput } from '@/lib/schemas/course.schema';
import {
  createCourseAction,
  deleteCourseAction,
  fetchCoursesAction,
  updateCourseAction
} from '@/app/actions/university';
import CourseCard from '@/components/features/university/CourseCard';
import CourseModal from '@/components/features/university/CourseModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, GraduationCap, BookOpen, Calendar, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

function normalizeCourse(course: any): CourseWithExercises {
  return {
    ...course,
    examDate: course.examDate ? new Date(course.examDate) : undefined,
    createdAt: new Date(course.createdAt),
    exercises: (course.exercises || []).map((ex: any) => ({
      ...ex,
      completedAt: ex.completedAt ? new Date(ex.completedAt) : undefined,
      createdAt: new Date(ex.createdAt),
    })),
  };
}

async function updateCourse({
  id,
  data,
}: {
  id: string;
  data: Partial<CreateCourseInput>;
}): Promise<void> {
  await updateCourseAction(id, data);
}

async function deleteCourse(id: string): Promise<void> {
  await deleteCourseAction(id);
}

export default function UniversityPage() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseWithExercises | null>(null);

  const { data: courses = [], isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const data = await fetchCoursesAction();
      return data.map(normalizeCourse);
    },
  });

  const createMutation = useMutation({
    mutationFn: createCourseAction,
    onMutate: async (newCourseInput) => {
      await queryClient.cancelQueries({ queryKey: ['courses'] });
      const previousCourses = queryClient.getQueryData<CourseWithExercises[]>(['courses']) || [];

      const now = new Date();
      const tempId = crypto.randomUUID();
      const optimisticCourse: CourseWithExercises = {
        id: tempId,
        name: newCourseInput.name,
        ects: newCourseInput.ects,
        numExercises: newCourseInput.numExercises,
        examDate: newCourseInput.examDate,
        semester: newCourseInput.semester,
        createdAt: now,
        exercises: Array.from({ length: newCourseInput.numExercises }, (_, index) => ({
          id: crypto.randomUUID(),
          courseId: tempId,
          exerciseNumber: index + 1,
          completed: false,
          completedAt: undefined,
          createdAt: now,
        })),
      };

      queryClient.setQueryData<CourseWithExercises[]>(['courses'], [optimisticCourse, ...previousCourses]);
      return { previousCourses, tempId };
    },
    onSuccess: (createdCourse, _variables, context) => {
      const normalizedCreatedCourse = normalizeCourse(createdCourse);
      queryClient.setQueryData<CourseWithExercises[]>(['courses'], (current = []) => {
        if (!context?.tempId) return [normalizedCreatedCourse, ...current];
        const replaced = current.map((course) =>
          course.id === context.tempId ? normalizedCreatedCourse : course
        );
        const hasTemp = current.some((course) => course.id === context.tempId);
        return hasTemp ? replaced : [normalizedCreatedCourse, ...current];
      });
      setIsModalOpen(false);
      setEditingCourse(null);
      toast.success('Course created!');
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousCourses) {
        queryClient.setQueryData(['courses'], context.previousCourses);
      }
      toast.error(error.message || 'Failed to create course');
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCourse,
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['courses'] });
      const previousCourses = queryClient.getQueryData<CourseWithExercises[]>(['courses']) || [];

      queryClient.setQueryData<CourseWithExercises[]>(['courses'], (current = []) =>
        current.map((course) =>
          course.id === id
            ? {
                ...course,
                ...data,
                examDate: data.examDate === undefined ? course.examDate : data.examDate,
              }
            : course
        )
      );

      return { previousCourses };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsModalOpen(false);
      setEditingCourse(null);
      toast.success('Course updated!');
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousCourses) {
        queryClient.setQueryData(['courses'], context.previousCourses);
      }
      toast.error(error.message || 'Failed to update course');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onMutate: async (courseId) => {
      await queryClient.cancelQueries({ queryKey: ['courses'] });
      const previousCourses = queryClient.getQueryData<CourseWithExercises[]>(['courses']) || [];
      queryClient.setQueryData<CourseWithExercises[]>(
        ['courses'],
        previousCourses.filter((course) => course.id !== courseId)
      );
      return { previousCourses };
    },
    onSuccess: () => {
      toast.success('Course deleted');
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousCourses) {
        queryClient.setQueryData(['courses'], context.previousCourses);
      }
      toast.error(error.message || 'Failed to delete course');
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

  const handleSubmitCourse = (data: CreateCourseInput) => {
    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, data });
    } else {
      createMutation.mutate(data);
    }
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const action = new URLSearchParams(window.location.search).get('action');
    if (action !== 'new-course') return;
    setEditingCourse(null);
    setIsModalOpen(true);
    router.replace(pathname);
  }, [pathname, router]);

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

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-error/30 bg-error/10 px-6 py-4 text-error">
        Error loading courses: {error instanceof Error ? error.message : 'Unknown error'}
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
            WS 2025/26 · Track courses and exercise progress
          </p>
        </div>
        <Button
          data-testid="add-course-button"
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
                <AnimatedCounter to={totalECTS} />
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
                <AnimatedCounter to={completionPercent} suffix="%" />
              </div>
              <div className="text-sm text-text-tertiary mb-3">
                {completedExercises}/{totalExercises} Exercises
              </div>
              {/* Mini Progress Bar */}
              <div className="relative w-full h-2 bg-surface-hover rounded-full overflow-hidden border border-border">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary-light rounded-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Next Exam */}
        <div className={`relative overflow-hidden bg-gradient-to-br ${daysUntilNextExam !== null && daysUntilNextExam < 45
          ? 'from-error/20 to-error/10 border-error/30'
          : 'from-warning/20 to-warning/10 border-warning/30'
          } backdrop-blur-sm border rounded-lg p-6 group col-span-1 sm:col-span-2 lg:col-span-2`}>
          <div className="absolute inset-0 bg-gradient-to-br from-warning/20 to-warning/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg ${daysUntilNextExam !== null && daysUntilNextExam < 45
                ? 'bg-error/20 border-error/30'
                : 'bg-warning/20 border-warning/30'
                } border`}>
                <Calendar className={`w-5 h-5 ${daysUntilNextExam !== null && daysUntilNextExam < 45
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
                <div className={`text-2xl font-bold mb-1 ${daysUntilNextExam !== null && daysUntilNextExam < 45
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
                  You&apos;re all caught up! 🎉
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
        onSubmit={handleSubmitCourse}
        {...(editingCourse ? { layoutId: `course-card-${editingCourse.id}` } : {})}
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
        isSaving={createMutation.isPending || updateMutation.isPending}
        error={null}
      />
    </div>
  );
}
