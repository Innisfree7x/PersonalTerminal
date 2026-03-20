'use client';

import { motion } from 'framer-motion';
import { Route, CalendarDays, Command, ShieldCheck } from 'lucide-react';

const pillars = [
  {
    id: 'trajectory',
    number: '01',
    icon: Route,
    title: 'Trajectory ist das Gehirn.',
    description:
      'Die App beginnt nicht mit einer To-do-Liste, sondern mit deinem strategischen Konfliktmodell.',
    points: [
      'Milestones für Thesis, GMAT, Praktika und Master-Apps',
      'Startfenster, Buffer und Risk-Status aus einer gemeinsamen Logik',
      'Opportunity Windows statt verstreuter Reminder',
    ],
    preview: [
      'GMAT -> start 09.11.2026',
      'Master-Apps -> tight',
      'Praktikum Q3 -> window open',
    ],
  },
  {
    id: 'today',
    number: '02',
    icon: CalendarDays,
    title: 'Today ist die Übersetzung.',
    description:
      'Der Wert entsteht nicht im Plan allein, sondern in der täglichen Verdichtung auf das, was heute wirklich zählt.',
    points: [
      'Morning Briefing verbindet Strategie und Tagesarbeit',
      'Top-Moves statt offenem Task-Wust',
      'Kalender, Fokus und Aufgaben ohne Tab-Switching',
    ],
    preview: [
      'Critical move: GMAT verbal block',
      'Exam in 9d -> highlighted',
      'Done-for-today signal statt leerem Dashboard',
    ],
  },
  {
    id: 'command',
    number: '03',
    icon: Command,
    title: 'Execution bleibt ruhig.',
    description:
      'Command Rail, Fokus und Career sind keine Spielerei, sondern machen Ambition ausführbar ohne mehr Oberflächenstress.',
    points: [
      'Deterministische Commands statt menübasiertem Klicken',
      'Fokus-Sessions mit klarer Rückmeldung und Persistenz',
      'Career bleibt im selben System wie die Studienplanung',
    ],
    preview: [
      '> create task "GMAT block" tomorrow',
      '25m focus running',
      'Interview prep linked to same weekly plan',
    ],
  },
  {
    id: 'reliability',
    number: '04',
    icon: ShieldCheck,
    title: 'Premium heißt auch verlässlich.',
    description:
      'Wenn das Produkt ernst wirken soll, darf es nicht an Build-Qualität, OAuth oder Hotpaths zerfasern.',
    points: [
      'CI-Gates für Type, Lint, Build und blocker E2E',
      'Ops-Metriken und Route-Latenzen statt stiller Drift',
      'Security- und Tenant-Isolation-Hardening im Kernscope',
    ],
    preview: [
      'Quality Checks required',
      'E2E blocker suite serial',
      'Route latency visible in ops',
    ],
  },
];

export function FeatureSection() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="marketing-container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <p className="premium-kicker">Warum es sich anders anfühlt</p>
          <h2 className="premium-heading mb-4 text-3xl font-semibold text-[#FAF0E6] md:text-5xl">
            Kein Sammelsurium aus Features.
            <span className="block text-zinc-500">Ein System mit klarer Reihenfolge.</span>
          </h2>
          <p className="premium-subtext mx-auto max-w-xl">
            Erst verstehen, wo dein Plan kollidiert. Dann den Tag so verdichten,
            dass aus Ambition tatsächliche Ausführung wird.
          </p>
        </motion.div>

        <div className="space-y-5">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="premium-card group relative overflow-hidden rounded-[1.75rem] p-6 md:p-7"
            >
              <div className="grid gap-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-start">
                <div>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/18 bg-red-500/[0.06]">
                      <pillar.icon className="h-5 w-5 text-red-300" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        Block {pillar.number}
                      </p>
                      <h3 className="mt-1 text-2xl font-semibold tracking-tight text-[#FAF0E6]">
                        {pillar.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-base leading-relaxed text-zinc-400">
                    {pillar.description}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_0.88fr]">
                  <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.02] p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Was das konkret bedeutet
                    </p>
                    <ul className="mt-4 space-y-3">
                      {pillar.points.map((point) => (
                        <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-zinc-300">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Im Produkt
                    </p>
                    <div className="mt-4 space-y-2.5">
                      {pillar.preview.map((item) => (
                        <div key={item} className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
                          <p className="text-sm text-zinc-300">{item}</p>
                        </div>
                      ))}
                    </div>
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
