'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ArrowRight, BookOpen, CheckCircle2, Circle, Timer, TrendingUp, Loader2, ChevronRight } from 'lucide-react';
import { seedDemoData } from '@/app/onboarding/demoSeedService';
import toast from 'react-hot-toast';

interface StepWelcomeProps {
  onNext: () => void;
  onDemoSeeded: () => void;
}

// Animated mini-dashboard preview
function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="relative rounded-xl border border-border bg-surface/60 p-4 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/60 pointer-events-none rounded-xl z-10" />

      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-hover"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-text-primary">Lineare Algebra II</p>
              <p className="text-xs text-text-tertiary">7/12 Blätter</p>
            </div>
            <div className="h-1 bg-border rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '58%' }}
                transition={{ delay: 0.7, duration: 0.8 }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-1.5"
        >
          {[
            { label: 'Übungsblatt 8 abgeben', done: true },
            { label: 'Klausurvorbereitung Kapitel 5', done: false },
          ].map((task) => (
            <div key={task.label} className="flex items-center gap-2 px-1">
              {task.done ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
              )}
              <p className={`text-xs ${task.done ? 'line-through text-text-tertiary' : 'text-text-secondary'}`}>
                {task.label}
              </p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-2 gap-2"
        >
          <div className="p-2.5 rounded-lg bg-surface-hover flex items-center gap-2">
            <Timer className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-text-tertiary">Heute fokussiert</p>
              <p className="text-xs font-semibold text-text-primary">2h 40m</p>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-hover flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-text-tertiary">Ziel-Streak</p>
              <p className="text-xs font-semibold text-text-primary">🔥 12 Tage</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function StepWelcome({ onNext, onDemoSeeded }: StepWelcomeProps) {
  const [seeding, setSeeding] = useState(false);

  const handleDemoSeed = async () => {
    setSeeding(true);
    try {
      await seedDemoData();
      onDemoSeeded();
    } catch {
      toast.error('Beispieldaten konnten nicht geladen werden. Versuche es erneut.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
      <motion.div variants={itemVariants}>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium text-primary">Setup in unter 5 Minuten</span>
        </div>
        <h1 className="text-3xl font-bold text-text-primary leading-tight mb-2">
          Willkommen bei{' '}
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            INNIS
          </span>
        </h1>
        <p className="text-text-secondary text-sm leading-relaxed">
          Studium, Ziele und Karriere — alles an einem Ort. So sieht dein Dashboard bald aus:
        </p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <DashboardPreview />
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-col gap-2">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={onNext}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Loslegen
        </Button>

        <button
          type="button"
          onClick={handleDemoSeed}
          disabled={seeding}
          className="flex items-center justify-center gap-1.5 py-2 text-sm text-text-tertiary hover:text-text-secondary transition-colors disabled:opacity-50"
        >
          {seeding ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Beispieldaten werden geladen...
            </>
          ) : (
            <>
              Mit Beispieldaten starten
              <ChevronRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}
