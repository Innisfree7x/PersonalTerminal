'use client';

import { motion } from 'framer-motion';
import { UserPlus, Gauge, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Setze eine echte Deadline.',
    description:
      'Nicht "ich will mal den GMAT machen", sondern ein klares Ziel mit Termin und realistischer Kapazitaet.',
    preview: (
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
        <div className="space-y-2">
          {['Ziel: GMAT 2027', 'Deadline: 01.03.2027', 'Kapazitaet: 18h/Woche'].map((field) => (
            <div key={field} className="rounded-xl border border-white/8 bg-black/20 px-3 py-2">
              <span className="text-xs text-zinc-400">{field}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    number: '02',
    icon: Gauge,
    title: 'Sieh, wo der Buffer bricht.',
    description:
      'INNIS rechnet rueckwaerts. Du siehst frueh, ob dein Plan on track ist oder ob du nur beschaeftigt wirkst.',
    preview: (
      <div className="space-y-2">
        {[
          { label: '10h/Woche', type: 'tight', color: 'text-amber-400' },
          { label: '18h/Woche', type: 'on track', color: 'text-emerald-400' },
          { label: 'Prep Start 09.11.2026', type: 'auto', color: 'text-zinc-300' },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-3 py-2.5">
            <span className="min-w-0 flex-1 text-sm text-zinc-300">{item.label}</span>
            <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] ${item.color}`}>{item.type}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    number: '03',
    icon: ArrowRight,
    title: 'Trage den Plan in den Tag.',
    description:
      'Morning Briefing, Today, Fokus und Career greifen ineinander, statt neue Oberflaechenarbeit zu produzieren.',
    preview: (
      <div className="space-y-2">
        <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Morning Briefing</p>
          <p className="mt-1 text-sm text-zinc-300">Naechster kritischer Move: GMAT verbal block</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Fokus</p>
            <p className="mt-1 text-sm text-zinc-300">25m running</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Career</p>
            <p className="mt-1 text-sm text-zinc-300">Interview prep linked</p>
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
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <p className="premium-kicker">So funktioniert es</p>
          <h2 className="premium-heading mb-4 text-3xl font-semibold text-[#FAF0E6] md:text-5xl">
            Kein magisches Produkt.
            <span className="block text-zinc-500">Nur die richtige Reihenfolge.</span>
          </h2>
          <p className="premium-subtext mx-auto max-w-xl">
            Erst den Konflikt sichtbar machen. Dann den Buffer ehrlich bewerten.
            Erst danach den Tag verdichten.
          </p>
        </motion.div>

        <div className="relative mx-auto max-w-5xl space-y-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.12 }}
              className="relative"
            >
              <div className="premium-card-soft rounded-[1.75rem] p-6 md:p-7">
                <div className="grid gap-5 lg:grid-cols-[120px_1fr_320px] lg:items-start">
                  <div>
                    <p className="font-mono text-sm text-zinc-500">{step.number}</p>
                    <div className="mt-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/18 bg-red-500/[0.06]">
                      <step.icon className="h-5 w-5 text-red-300" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight text-[#FAF0E6]">{step.title}</h3>
                    <p className="mt-3 text-base leading-relaxed text-zinc-400">{step.description}</p>
                  </div>

                  {step.preview}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
