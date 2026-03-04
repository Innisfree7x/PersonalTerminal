'use client';

import { motion } from 'framer-motion';
import { UserPlus, Gauge, Check, Command, Timer, Sparkles } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Konto + Ziel setzen',
    description:
      'In unter 2 Minuten: Email, Profil und dein erstes strategisches Ziel mit Deadline. Direkt im Onboarding, ohne Umwege.',
    accent: 'text-red-400',
    border: 'border-red-500/20',
    bg: 'bg-red-500/8',
    glow: 'from-red-500/10',
    preview: (
      <div className="mt-5 rounded-xl border border-white/8 bg-white/[0.02] p-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <div className="h-1.5 w-20 rounded-full bg-white/10" />
        </div>
        <div className="space-y-1.5">
          {['Email', 'Ziel: GMAT 2027', 'Deadline: 01.03.2027'].map((field) => (
            <div key={field} className="flex items-center gap-2 rounded-md border border-white/8 bg-white/[0.02] px-2.5 py-1.5">
              <span className="text-[10px] text-zinc-600">{field}</span>
            </div>
          ))}
          <div className="mt-2 flex h-6 items-center justify-center rounded-md bg-red-500/80">
            <span className="text-[10px] font-semibold text-white">Starten →</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    number: '02',
    icon: Gauge,
    title: 'Kapazität simulieren',
    description:
      'Stunden pro Woche einstellen und sofort sehen, ob dein Plan on track, tight oder at risk ist. Ohne Ratespiel.',
    accent: 'text-yellow-400',
    border: 'border-yellow-500/20',
    bg: 'bg-yellow-500/8',
    glow: 'from-yellow-500/10',
    preview: (
      <div className="mt-5 space-y-1.5">
        {[
          { label: 'Simulation: 10h/Woche', type: 'tight', color: 'text-amber-400' },
          { label: 'Simulation: 18h/Woche', type: 'on track', color: 'text-emerald-400' },
          { label: 'Startblock: 09.11.2026', type: 'auto', color: 'text-blue-400' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2.5 rounded-lg border border-white/8 bg-white/[0.02] px-2.5 py-1.5">
            <Check className="h-3 w-3 text-emerald-500/60 flex-shrink-0" />
            <span className="min-w-0 flex-1 truncate text-[10px] text-zinc-400">{item.label}</span>
            <span className={`shrink-0 text-[9px] font-medium ${item.color}`}>{item.type}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'Daily ausführen',
    description:
      'Command Rail, Focus Screen, Lucian und Analytics greifen ineinander. Strategie oben, Execution jeden Tag unten.',
    accent: 'text-violet-400',
    border: 'border-violet-500/20',
    bg: 'bg-violet-500/8',
    glow: 'from-violet-500/10',
    preview: (
      <div className="mt-5 space-y-2.5">
        <div className="flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/5 px-3 py-2.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-violet-500/20">
            <Command className="h-3.5 w-3.5 text-violet-300" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-violet-300">Command Rail</p>
            <p className="truncate text-[10px] text-zinc-500">create task &quot;GMAT Block&quot; tomorrow</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1.5">
            <p className="text-[9px] uppercase tracking-wide text-zinc-600">Focus</p>
            <p className="mt-1 flex items-center gap-1 text-[10px] text-zinc-300">
              <Timer className="h-3 w-3 text-red-300" />
              25m running
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1.5">
            <p className="text-[9px] uppercase tracking-wide text-zinc-600">Lucian</p>
            <p className="mt-1 truncate text-[10px] text-zinc-300">„Puffer wird knapp.“</p>
          </div>
        </div>
      </div>
    ),
  },
];

export function HowItWorksSection() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="marketing-container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <p className="premium-kicker">So funktioniert es</p>
          <h2 className="premium-heading mb-4 text-3xl font-semibold text-[#FAF0E6] md:text-5xl">
            Drei Schritte.{' '}
            <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Strategisch + täglich.
            </span>
          </h2>
          <p className="premium-subtext mx-auto max-w-md">
            Erst Risiko-Klarheit, dann Execution. Genau in dieser Reihenfolge.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative mx-auto max-w-5xl">
          {/* Horizontal connector (desktop) */}
          <div className="pointer-events-none absolute left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] top-[2.75rem] hidden h-px bg-gradient-to-r from-white/10 via-white/5 to-white/10 lg:block" />

          <div className="space-y-5 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.12 }}
                className="relative"
              >
                <div className="premium-card-soft group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
                  {/* Top glow */}
                  <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${step.glow} to-transparent opacity-40`} />

                  {/* Header row */}
                  <div className="mb-5 flex items-center justify-between">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${step.border} ${step.bg}`}>
                      <step.icon className={`h-5 w-5 ${step.accent}`} />
                    </div>
                    <span className="select-none font-mono text-3xl font-bold text-white/5">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mb-2 text-lg font-semibold text-[#FAF0E6]">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-400">{step.description}</p>

                  {/* Mini UI preview */}
                  {step.preview}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
