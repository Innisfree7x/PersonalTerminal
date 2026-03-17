'use client';

import { motion } from 'framer-motion';
import { Route, CalendarDays, Command, Briefcase } from 'lucide-react';
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
  {
    icon: Briefcase,
    number: '04',
    title: 'Career Intelligence',
    description:
      'CV-Upload, Opportunity Radar und Gap-Signale in derselben Oberfläche. Nicht nur Jobs finden, sondern sofort verstehen, was realistisch ist.',
    highlights: [
      'CV-Intelligence mit Strengths, Gaps und Rank-Tier',
      'Opportunity Radar mit Reach-Bands statt blindem Keyword-Matching',
      'Career-Pipeline direkt neben Trajectory und Today',
    ],
  },
];

export function ProductShowcase() {
  return (
    <section className="relative py-28 md:py-36">
      <div className="premium-divider" />

      <div className="marketing-container mt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-20 max-w-3xl text-center"
        >
          <p className="premium-kicker">Das System</p>
          <h2 className="premium-heading text-[clamp(2.2rem,5vw,4rem)] font-semibold text-[#FAF0E6]">
            Kein Sammelsurium
            <br />
            aus Features.
          </h2>
          <p className="mt-6 text-lg text-zinc-600">Ein System mit klarer Reihenfolge.</p>
        </motion.div>

        <div className="mx-auto max-w-5xl space-y-6">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group premium-card overflow-hidden rounded-2xl"
            >
              <div className="grid md:grid-cols-[1fr_1.1fr]">
                {/* Left: meta + description */}
                <div className="p-8 md:p-10">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8B930]/10 bg-[#E8B930]/[0.04]">
                      <pillar.icon className="h-5 w-5 text-[#E8B930]/70" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                        {pillar.number}
                      </p>
                      <h3 className="text-xl font-semibold tracking-tight text-[#FAF0E6]">
                        {pillar.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-[15px] leading-[1.7] text-zinc-400">
                    {pillar.description}
                  </p>
                </div>

                {/* Right: highlights */}
                <div className="border-t border-white/[0.04] bg-white/[0.01] p-8 md:border-l md:border-t-0 md:p-10">
                  <div className="space-y-4">
                    {pillar.highlights.map((point) => (
                      <div
                        key={point}
                        className="flex items-start gap-3"
                      >
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#E8B930]/50" />
                        <span className="text-[14px] leading-[1.7] text-zinc-400">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
