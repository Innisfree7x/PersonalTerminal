'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, BookOpen, ClipboardList, ArrowRight, Info } from 'lucide-react';
import { updateProfileAction } from '@/app/actions/profile';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { trackOnboardingEvent } from '@/app/onboarding/analytics';

interface CompletedData {
  name: string;
  courses: { name: string }[];
  task: { title: string } | null;
  demoSeeded?: boolean;
}

interface StepCompleteProps {
  completedData: CompletedData;
  onComplete?: () => void;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function StepComplete({ completedData, onComplete }: StepCompleteProps) {
  const router = useRouter();
  const firedRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        origin: { y: 0.6 },
        ...opts,
        particleCount: Math.floor(200 * particleRatio),
      });
    };

    const t = setTimeout(() => {
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }, 200);

    return () => clearTimeout(t);
  }, [completedData.courses.length, completedData.task, completedData.demoSeeded]);

  const handleGoToDashboard = async () => {
    setError('');
    setSaving(true);
    try {
      await updateProfileAction({ onboardingCompleted: true });
      trackOnboardingEvent('onboarding_completed', {
        courses_count: completedData.courses.length,
        task_created: completedData.task !== null,
        demo_seeded: completedData.demoSeeded ?? false,
      });
      onComplete?.();
      const n = completedData.name.trim();
      toast.success(n ? `Willkommen, ${n}! 🎉` : 'Willkommen bei INNIS! 🎉');
      router.push('/today');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onboarding konnte nicht abgeschlossen werden');
    } finally {
      setSaving(false);
    }
  };

  const displayName = completedData.name.trim() || 'dir';
  const hasAnything = completedData.courses.length > 0 || completedData.task !== null || completedData.demoSeeded;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="text-center">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4"
        >
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </motion.div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          INNIS ist bereit,{' '}
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {displayName}!
          </span>
        </h2>
        <p className="text-text-secondary text-sm">
          {hasAnything ? 'Dein Dashboard ist eingerichtet. Hier ist eine Zusammenfassung:' : 'Dein Dashboard wartet auf dich.'}
        </p>
      </motion.div>

      {/* Demo seeded info */}
      {completedData.demoSeeded && (
        <motion.div variants={itemVariants}>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary leading-relaxed">
              Beispieldaten wurden geladen — du kannst sie jederzeit unter{' '}
              <span className="font-medium text-text-primary">Einstellungen → Daten</span> entfernen.
            </p>
          </div>
        </motion.div>
      )}

      {/* Courses list */}
      {completedData.courses.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-2">
          {completedData.courses.map((course) => (
            <div
              key={course.name}
              className="flex items-center gap-3 p-3 rounded-xl border bg-blue-500/10 border-blue-500/20"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10 border-blue-500/20 flex-shrink-0">
                <BookOpen className="w-4 h-4 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-text-tertiary">Kurs angelegt</p>
                <p className="text-sm font-medium text-text-primary truncate">{course.name}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Task */}
      {completedData.task && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 p-3 rounded-xl border bg-violet-500/10 border-violet-500/20">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-500/10 border-violet-500/20 flex-shrink-0">
              <ClipboardList className="w-4 h-4 text-violet-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-tertiary">Aufgabe für heute</p>
              <p className="text-sm font-medium text-text-primary truncate">{completedData.task.title}</p>
            </div>
          </div>
        </motion.div>
      )}

      {!hasAnything && (
        <motion.div variants={itemVariants}>
          <div className="p-4 rounded-xl bg-surface-hover border border-border text-center">
            <p className="text-sm text-text-secondary">
              Du hast alles übersprungen — kein Problem! Du kannst jederzeit Kurse, Aufgaben und mehr hinzufügen.
            </p>
          </div>
        </motion.div>
      )}

      {/* Lucian hint */}
      <motion.div variants={itemVariants}>
        <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-hover border border-border">
          <span className="text-sm flex-shrink-0 mt-0.5">⚡</span>
          <p className="text-xs text-text-secondary leading-relaxed">
            <span className="font-medium text-text-primary">Lucian ist jetzt aktiv.</span>{' '}
            Dein Execution Companion gibt dir gezielte Hinweise, wenn Fokus oder Deadlines kritisch werden.
          </p>
        </div>
      </motion.div>

      {error ? (
        <motion.div variants={itemVariants}>
          <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
            {error}
          </div>
        </motion.div>
      ) : null}

      <motion.div variants={itemVariants}>
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={handleGoToDashboard}
          loading={saving}
          disabled={saving}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Zum Dashboard
        </Button>
      </motion.div>
    </motion.div>
  );
}
