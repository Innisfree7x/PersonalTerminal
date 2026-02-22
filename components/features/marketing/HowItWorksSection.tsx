'use client';

import { motion } from 'framer-motion';
import { UserPlus, LayoutDashboard, Zap } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Konto erstellen',
    description:
      'In unter 2 Minuten. Email, Passwort, fertig — kein Abo, keine Kreditkarte. Der Onboarding-Wizard führt dich durch alles.',
    accent: 'text-red-400',
    border: 'border-red-500/20',
    bg: 'bg-red-500/8',
    glow: 'from-red-500/10',
  },
  {
    number: '02',
    icon: LayoutDashboard,
    title: 'Kurse & Ziele anlegen',
    description:
      'Trag deine Kurse, Prüfungsdaten und Bewerbungen ein — einmal. INNIS weiß danach, was wichtig ist und wann es kritisch wird.',
    accent: 'text-yellow-400',
    border: 'border-yellow-500/20',
    bg: 'bg-yellow-500/8',
    glow: 'from-yellow-500/10',
  },
  {
    number: '03',
    icon: Zap,
    title: 'Fokussiert bleiben',
    description:
      'Lucian erinnert dich wenn eine Prüfung näher rückt. Der Fokus-Timer trackt deine Sessions. Analytics zeigen dir wo deine Zeit wirklich hingeht.',
    accent: 'text-violet-400',
    border: 'border-violet-500/20',
    bg: 'bg-violet-500/8',
    glow: 'from-violet-500/10',
  },
];

export function HowItWorksSection() {
  return (
    <section className="relative py-24 md:py-32">
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
              Ein System.
            </span>
          </h2>
          <p className="premium-subtext mx-auto max-w-md">
            Kein langer Onboarding-Prozess, kein Setup-Chaos. Du bist in 2 Minuten drin.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative mx-auto max-w-5xl">
          {/* Connecting line (desktop only) */}
          <div className="pointer-events-none absolute left-1/2 top-12 hidden h-[calc(100%-6rem)] w-px -translate-x-1/2 bg-gradient-to-b from-white/10 via-white/5 to-transparent lg:block" />

          <div className="space-y-5 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.12 }}
                className="relative"
              >
                {/* Card */}
                <div className="premium-card-soft group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
                  {/* Top glow */}
                  <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${step.glow} to-transparent opacity-40`} />

                  {/* Step number */}
                  <div className="mb-5 flex items-center justify-between">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${step.border} ${step.bg}`}>
                      <step.icon className={`h-5 w-5 ${step.accent}`} />
                    </div>
                    <span className="font-mono text-3xl font-bold text-white/5 select-none">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mb-2 text-lg font-semibold text-[#FAF0E6]">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-400">
                    {step.description}
                  </p>
                </div>

                {/* Arrow between steps (desktop) */}
                {i < steps.length - 1 && (
                  <div className="pointer-events-none absolute -right-3.5 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#111111] text-zinc-600">
                      <span className="text-xs">→</span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
