'use client';

import { motion } from 'framer-motion';
import { Route, CalendarDays, Command } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Pillar {
  icon: LucideIcon;
  number: string;
  title: string;
  description: string;
  highlights: string[];
}

const pillars: Pillar[] = [
  {
    icon: Route,
    number: '01',
    title: 'Trajectory',
    description:
      'Dein strategisches Konfliktmodell. Startfenster, Buffer und Risk-Status für alle parallelen Ziele — aus einer einzigen Logik.',
    highlights: [
      'Milestones für Thesis, GMAT, Praktika, Master-Apps',
      'Automatische Kollisionserkennung mit Risk-Ampel',
      'Opportunity Windows statt verstreuter Reminder',
    ],
  },
  {
    icon: CalendarDays,
    number: '02',
    title: 'Today',
    description:
      'Dein strategischer Plan wird jeden Morgen in einen konkreten Move verdichtet — kein offener Task-Wust, keine Dashboard-Unruhe.',
    highlights: [
      'Morning Briefing mit Strategie-Kontext',
      'Top-Moves statt endloser To-do-Listen',
      'Fokus-Sessions mit klarer Rückmeldung',
    ],
  },
  {
    icon: Command,
    number: '03',
    title: 'Command Rail',
    description:
      'Deterministische Commands statt Klick-Menüs. Career, Uni und Goals im selben System — kein Tab-Switching.',
    highlights: [
      'Natürliche Sprache: "create task GMAT block tomorrow"',
      'Career-Pipeline parallel zur Studienplanung',
      'Keyboard-first für schnelle Ausführung',
    ],
  },
];

export function ProductShowcase() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="marketing-container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <p className="premium-kicker">Das System</p>
          <h2 className="premium-heading text-[clamp(2rem,4.5vw,3.6rem)] font-semibold text-[#FAF0E6]">
            Kein Sammelsurium aus Features.
            <br />
            <span className="text-zinc-600">Ein System mit klarer Reihenfolge.</span>
          </h2>
        </motion.div>

        <div className="mx-auto max-w-5xl space-y-5">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.number}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="premium-card overflow-hidden rounded-2xl p-6 md:p-8"
            >
              <div className="grid gap-6 md:grid-cols-[1fr_1.2fr] md:items-start">
                {/* Left: title + description */}
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.06]">
                      <pillar.icon className="h-4.5 w-4.5 text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                        {pillar.number}
                      </p>
                      <h3 className="text-xl font-semibold tracking-tight text-[#FAF0E6]">
                        {pillar.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-400">
                    {pillar.description}
                  </p>
                </div>

                {/* Right: highlights */}
                <div className="space-y-2.5">
                  {pillar.highlights.map((point) => (
                    <div
                      key={point}
                      className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4AF37]/60" />
                      <span className="text-sm leading-relaxed text-zinc-300">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
