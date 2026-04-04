'use client';

import { useMemo } from 'react';
import { memo } from 'react';
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

const StudyProgress = memo(function StudyProgress({ courses }: StudyProgressProps) {
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
      <div className="card-warm rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="w-5 h-5 text-university-accent" />
          <h3 className="text-base font-semibold text-text-primary">Lernfortschritt</h3>
        </div>
        <div className="text-center py-4 space-y-2">
          <p className="text-sm text-text-tertiary">Noch keine Kurse angelegt.</p>
          <Link
            href="/uni/courses"
            className="inline-block text-xs font-medium text-primary hover:underline"
          >
            Ersten Kurs hinzufügen →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card-warm rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-university-accent" />
          <h3 className="text-base font-semibold text-text-primary">Lernfortschritt</h3>
        </div>
        <Link
          href="/uni/courses"
          className="text-xs text-text-tertiary hover:text-primary transition-colors"
        >
          Alle anzeigen
        </Link>
      </div>

      <div className="space-y-3">
        {sortedCourses.map((course) => {
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
            <div
              key={course.id}
              className="space-y-1.5 transition-transform duration-200 hover:-translate-y-0.5"
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
                <div
                  className={`absolute inset-y-0 left-0 ${barColor} rounded-full`}
                  style={{ width: `${course.percentage}%` }}
                />
              </div>

              {course.daysUntilExam !== undefined && (
                <div className="flex justify-end">
                  {examWritten ? (
                    <span className="text-xs font-medium text-emerald-400/80">
                      Geschrieben
                      {course.expectedGrade && (
                        <span className="ml-1.5 font-bold">· {course.expectedGrade.toFixed(1)}</span>
                      )}
                    </span>
                  ) : (
                    <span
                      className={`text-xs font-medium ${
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
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default StudyProgress;
