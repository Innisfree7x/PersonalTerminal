'use client';

import { motion } from 'framer-motion';
import { UserPlus, LayoutDashboard, Zap, Check } from 'lucide-react';

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
    preview: (
      <div className="mt-5 rounded-xl border border-white/8 bg-white/[0.02] p-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <div className="h-1.5 w-20 rounded-full bg-white/10" />
        </div>
        <div className="space-y-1.5">
          {['Email', 'Passwort'].map((field) => (
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
    icon: LayoutDashboard,
    title: 'Kurse & Ziele anlegen',
    description:
      'Trag deine Kurse, Prüfungsdaten und Bewerbungen ein — einmal. INNIS weiß danach, was wichtig ist und wann es kritisch wird.',
    accent: 'text-yellow-400',
    border: 'border-yellow-500/20',
    bg: 'bg-yellow-500/8',
    glow: 'from-yellow-500/10',
    preview: (
      <div className="mt-5 space-y-1.5">
        {[
          { label: 'Lineare Algebra II', type: 'Kurs', color: 'text-blue-400' },
          { label: 'SWE Praktikum', type: 'Ziel', color: 'text-emerald-400' },
          { label: 'Klausur 15. Feb', type: 'Deadline', color: 'text-red-400' },
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
    icon: Zap,
    title: 'Fokussiert bleiben',
    description:
      'Lucian erinnert dich wenn eine Prüfung näher rückt. Der Fokus-Timer trackt deine Sessions. Analytics zeigen dir wo deine Zeit wirklich hingeht.',
    accent: 'text-violet-400',
    border: 'border-violet-500/20',
    bg: 'bg-violet-500/8',
    glow: 'from-violet-500/10',
    preview: (
      <div className="mt-5 flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/5 px-3 py-2.5">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-violet-500/20">
          <Zap className="h-3.5 w-3.5 text-violet-400" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-violet-300">Lucian</p>
          <p className="truncate text-[10px] text-zinc-500">Klausur in 3 Tagen — Fokus-Session?</p>
        </div>
      </div>
    ),
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
