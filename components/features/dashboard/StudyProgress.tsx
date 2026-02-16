'use client';

import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import Link from 'next/link';

interface CourseProgress {
  id: string;
  name: string;
  completed: number;
  total: number;
  percentage: number;
  daysUntilExam?: number;
}

interface StudyProgressProps {
  courses: CourseProgress[];
}

export default function StudyProgress({ courses }: StudyProgressProps) {
  if (courses.length === 0) {
    return (
      <div className="card-surface rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="w-5 h-5 text-university-accent" />
          <h3 className="text-base font-semibold text-text-primary">Study Progress</h3>
        </div>
        <p className="text-sm text-text-tertiary text-center py-4">
          No courses yet.{' '}
          <Link href="/university" className="text-primary hover:underline">
            Add one
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="card-surface rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-university-accent" />
          <h3 className="text-base font-semibold text-text-primary">Study Progress</h3>
        </div>
        <Link
          href="/university"
          className="text-xs text-text-tertiary hover:text-primary transition-colors"
        >
          View all
        </Link>
      </div>

      <div className="space-y-3">
        {courses.map((course, index) => {
          const examUrgency =
            course.daysUntilExam !== undefined && course.daysUntilExam < 30
              ? 'urgent'
              : course.daysUntilExam !== undefined && course.daysUntilExam < 60
                ? 'warning'
                : 'normal';

          const barColor =
            examUrgency === 'urgent'
              ? 'bg-error'
              : examUrgency === 'warning'
                ? 'bg-warning'
                : 'bg-university-accent';

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary truncate">
                  {course.name}
                </span>
                <span className="text-xs text-text-tertiary font-mono ml-2 flex-shrink-0">
                  {course.completed}/{course.total}
                </span>
              </div>

              <div className="relative h-2 bg-surface-hover rounded-full overflow-hidden">
                <motion.div
                  className={`absolute inset-y-0 left-0 ${barColor} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${course.percentage}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                />
              </div>

              {course.daysUntilExam !== undefined && (
                <div className="flex justify-end">
                  <span
                    className={`text-[10px] font-medium ${
                      examUrgency === 'urgent'
                        ? 'text-error'
                        : examUrgency === 'warning'
                          ? 'text-warning'
                          : 'text-text-tertiary'
                    }`}
                  >
                    Exam in {course.daysUntilExam}d
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
