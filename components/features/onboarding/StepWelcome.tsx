'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, ChevronRight, Shield, Crosshair, Zap } from 'lucide-react';
import { seedDemoData, type DemoSeedResult } from '@/app/onboarding/demoSeedService';
import toast from 'react-hot-toast';

interface StepWelcomeProps {
  onNext: () => void;
  onDemoSeeded: (result: DemoSeedResult) => void;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const valueProps = [
  {
    icon: Crosshair,
    title: 'Kollisionen erkennen',
    desc: 'Bevor Thesis, GMAT und Praktikum gleichzeitig crashen.',
  },
  {
    icon: Zap,
    title: 'Täglicher Move',
    desc: 'Jeden Morgen den nächsten sinnvollen Schritt — kein Sortieren.',
  },
  {
    icon: Shield,
    title: 'Buffer eingebaut',
    desc: 'Sicherheitspuffer und Risikologik von Tag eins.',
  },
];

export function StepWelcome({ onNext, onDemoSeeded }: StepWelcomeProps) {
  const [seeding, setSeeding] = useState(false);

  const handleDemoSeed = async () => {
    setSeeding(true);
    try {
      const seedResult = await seedDemoData();
      onDemoSeeded(seedResult);
    } catch {
      toast.error('Beispieldaten konnten nicht geladen werden. Versuche es erneut.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-5 inline-flex"
        >
          <span className="inline-flex items-center gap-2.5 rounded-full border border-[#E8B930]/15 bg-[#E8B930]/[0.05] px-3.5 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#E8B930]" />
            <span className="text-[11px] font-medium tracking-[0.06em] text-[#E8B930]/90">
              Setup in 2 Minuten
            </span>
          </span>
        </motion.div>

        <h1 className="text-2xl font-bold text-[#FAF0E6] leading-tight mb-2">
          Dein Terminal wird{' '}
          <span className="bg-gradient-to-r from-[#E8B930] via-[#F5D565] to-[#E8B930] bg-clip-text text-transparent">
            eingerichtet.
          </span>
        </h1>
        <p className="text-sm leading-relaxed text-zinc-400">
          Ein Ziel. Ein Kapazitätsplan. Dann zeigt dir INNIS, ob dein Zeitplan hält.
        </p>
      </motion.div>

      {/* Value props */}
      <motion.div variants={itemVariants} className="space-y-3">
        {valueProps.map((prop) => (
          <div
            key={prop.title}
            className="flex items-start gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3.5"
          >
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[#E8B930]/15 bg-[#E8B930]/[0.06]">
              <prop.icon className="h-3.5 w-3.5 text-[#E8B930]" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#FAF0E6]">{prop.title}</p>
              <p className="text-[12px] text-zinc-500 leading-relaxed">{prop.desc}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* CTAs */}
      <motion.div variants={itemVariants} className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={onNext}
          className="flex items-center justify-center gap-2 rounded-full bg-[#E8B930] px-6 py-3 text-sm font-semibold text-[#0A0A0C] transition-all hover:brightness-110 active:scale-[0.97]"
        >
          Erstes Ziel definieren
          <ArrowRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleDemoSeed}
          disabled={seeding}
          className="flex items-center justify-center gap-1.5 py-2 text-sm text-zinc-600 hover:text-zinc-400 transition-colors disabled:opacity-50"
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
