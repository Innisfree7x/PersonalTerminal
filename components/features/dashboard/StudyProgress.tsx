'use client';

import { useMemo } from 'react';
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
  expectedGrade?: number;
}

interface StudyProgressProps {
  courses: CourseProgress[];
}

export default function StudyProgress({ courses }: StudyProgressProps) {
  const sortedCourses = useMemo(() => {
    return [...courses].sort((a, b) => {
      const aDays = a.daysUntilExam;
      const bDays = b.daysUntilExam;

      const aHasExam = typeof aDays === 'number';
      const bHasExam = typeof bDays === 'number';

      if (!aHasExam && !bHasExam) return 0;
      if (!aHasExam) return 1;
      if (!bHasExam) return -1;

      const aUpcoming = (aDays as number) >= 0;
      const bUpcoming = (bDays as number) >= 0;

      // Upcoming exams always come first and are sorted by nearest date.
      if (aUpcoming && bUpcoming) return (aDays as number) - (bDays as number);
      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;

      // Past exams stay below upcoming ones; closest past exam appears first.
      return (bDays as number) - (aDays as number);
    });
  }, [courses]);

  if (courses.length === 0) {
    return (
      <div className="card-surface rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="w-5 h-5 text-university-accent" />
          <h3 className="text-base font-semibold text-text-primary">Lernfortschritt</h3>
        </div>
        <div className="text-center py-4 space-y-2">
          <p className="text-sm text-text-tertiary">Noch keine Kurse angelegt.</p>
          <Link
            href="/university"
            className="inline-block text-xs font-medium text-primary hover:underline"
          >
            Ersten Kurs hinzufügen →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card-surface rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-university-accent" />
          <h3 className="text-base font-semibold text-text-primary">Lernfortschritt</h3>
        </div>
        <Link
          href="/university"
          className="text-xs text-text-tertiary hover:text-primary transition-colors"
        >
          Alle anzeigen
        </Link>
      </div>

      <div className="space-y-3">
        {sortedCourses.map((course, index) => {
          const examWritten = course.daysUntilExam !== undefined && course.daysUntilExam < 0;

          const examUrgency =
            examWritten
              ? 'done'
              : course.daysUntilExam !== undefined && course.daysUntilExam < 30
                ? 'urgent'
                : course.daysUntilExam !== undefined && course.daysUntilExam < 60
                  ? 'warning'
                  : 'normal';

          const barColor = examWritten
            ? 'bg-emerald-500/70'
            : examUrgency === 'urgent'
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
                <span className={`text-sm font-medium truncate ${examWritten ? 'text-text-secondary' : 'text-text-primary'}`}>
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
                  {examWritten ? (
                    <span className="text-[10px] font-medium text-emerald-400/80">
                      Geschrieben
                      {course.expectedGrade && (
                        <span className="ml-1.5 font-bold">· {course.expectedGrade.toFixed(1)}</span>
                      )}
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] font-medium ${
                        examUrgency === 'urgent'
                          ? 'text-error'
                          : examUrgency === 'warning'
                            ? 'text-warning'
                            : 'text-text-tertiary'
                      }`}
                    >
                      Prüfung in {course.daysUntilExam}d
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
