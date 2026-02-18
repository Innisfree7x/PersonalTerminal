'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowRight, BookOpen, ChevronRight, X, Plus, CheckCircle2 } from 'lucide-react';

export interface CourseEntry {
  name: string;
  ects: string;
  numExercises: string;
  examDate: string;
}

interface CourseResult {
  name: string;
}

interface StepCoursesProps {
  initialValues?: CourseEntry[] | null;
  alreadyCreated?: CourseResult[] | null;
  onNext: (results: CourseResult[], drafts: CourseEntry[]) => void;
}

const MAX_COURSES = 3;

const emptyEntry = (): CourseEntry => ({
  name: '',
  ects: '6',
  numExercises: '12',
  examDate: '',
});

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export function StepCourses({ initialValues, alreadyCreated, onNext }: StepCoursesProps) {
  const [courses, setCourses] = useState<CourseEntry[]>(
    initialValues?.length ? initialValues : [emptyEntry()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateCourse = (index: number, field: keyof CourseEntry, value: string) => {
    setCourses((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addCourse = () => {
    if (courses.length < MAX_COURSES) setCourses((prev) => [...prev, emptyEntry()]);
  };

  const removeCourse = (index: number) => {
    setCourses((prev) => prev.filter((_, i) => i !== index));
  };

  const hasValidCourse = courses.some((c) => c.name.trim().length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = courses.filter((c) => c.name.trim().length > 0);
    if (valid.length === 0) return;
    setError('');
    setSaving(true);
    try {
      const results: CourseResult[] = [];
      for (const course of valid) {
        const res = await fetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: course.name.trim(),
            ects: parseInt(course.ects, 10) || 6,
            numExercises: parseInt(course.numExercises, 10) || 12,
            examDate: course.examDate || null,
            semester: 'WS 2025/26',
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error || `Fehler bei "${course.name.trim()}"`);
        }
        results.push({ name: course.name.trim() });
      }
      onNext(results, courses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen');
    } finally {
      setSaving(false);
    }
  };

  // Already created — readonly confirmation state
  if (alreadyCreated && alreadyCreated.length > 0) {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
            <BookOpen className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Kurse anlegen</h2>
        </motion.div>
        <motion.div variants={itemVariants} className="space-y-2">
          {alreadyCreated.map((c) => (
            <div
              key={c.name}
              className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p className="text-sm font-medium text-text-primary">{c.name}</p>
            </div>
          ))}
        </motion.div>
        <motion.div variants={itemVariants}>
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => onNext([], [])}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Weiter
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
          <BookOpen className="w-5 h-5 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Kurse anlegen</h2>
        <p className="text-text-secondary text-sm">
          Trag 1–3 Kurse ein. Prism verfolgt Übungsblätter und Klausurtermine für dich.
        </p>
      </motion.div>

      <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
            {error}
          </div>
        ) : null}

        <div className="space-y-4">
          {courses.map((course, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-surface-hover border border-border space-y-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                  Kurs {index + 1}
                </span>
                {courses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCourse(index)}
                    disabled={saving}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-text-tertiary hover:text-error hover:bg-error/10 transition-all"
                    aria-label="Kurs entfernen"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <Input
                label="Kursname"
                value={course.name}
                onChange={(e) => updateCourse(index, 'name', e.target.value)}
                placeholder="z.B. Lineare Algebra II"
                disabled={saving}
                fullWidth
                autoFocus={index === 0}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="ECTS"
                  type="number"
                  min={1}
                  max={15}
                  value={course.ects}
                  onChange={(e) => updateCourse(index, 'ects', e.target.value)}
                  placeholder="6"
                  disabled={saving}
                  fullWidth
                />
                <Input
                  label="Übungsblätter"
                  type="number"
                  min={1}
                  max={20}
                  value={course.numExercises}
                  onChange={(e) => updateCourse(index, 'numExercises', e.target.value)}
                  placeholder="12"
                  disabled={saving}
                  fullWidth
                />
              </div>

              <Input
                label="Klausurdatum (optional)"
                type="date"
                value={course.examDate}
                onChange={(e) => updateCourse(index, 'examDate', e.target.value)}
                disabled={saving}
                fullWidth
              />
            </motion.div>
          ))}
        </div>

        {courses.length < MAX_COURSES && (
          <button
            type="button"
            onClick={addCourse}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-sm text-text-tertiary hover:border-primary hover:text-primary transition-all"
          >
            <Plus className="w-4 h-4" />
            Weiteren Kurs hinzufügen
          </button>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            loading={saving}
            disabled={saving || !hasValidCourse}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {courses.filter((c) => c.name.trim()).length > 1
              ? `${courses.filter((c) => c.name.trim()).length} Kurse anlegen & weiter`
              : 'Kurs anlegen & weiter'}
          </Button>
          <button
            type="button"
            onClick={() => onNext([], courses)}
            disabled={saving}
            className="text-sm text-text-tertiary hover:text-text-secondary transition-colors flex items-center justify-center gap-1 py-1"
          >
            Später hinzufügen
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
