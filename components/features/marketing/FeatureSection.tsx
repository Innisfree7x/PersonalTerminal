'use client';

import { motion } from 'framer-motion';
import { Calendar, BookOpen, Target, Briefcase, Timer, BarChart2, Zap } from 'lucide-react';

const features = [
  {
    id: 'focus',
    icon: Calendar,
    title: 'Tagesplanung + Fokus',
    description:
      'Kein Morgen mehr, an dem du nicht weißt womit du anfängst. Aufgaben, Kalender und Timer auf einem Blick — damit du sofort weißt was jetzt dran ist.',
    accent: 'text-red-300',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    glow: 'group-hover:shadow-red-500/20',
    layout: 'lg:col-span-2 lg:row-span-2',
  },
  {
    id: 'goals',
    icon: Target,
    title: 'Ziele',
    description:
      'Ziele die du aufschreibst, erreichst du. Mit Deadline, Priorität und wöchentlichem Fortschritt — nicht nur ein frommer Wunsch.',
    accent: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'group-hover:shadow-emerald-500/20',
    layout: 'lg:col-span-1',
  },
  {
    id: 'university',
    icon: BookOpen,
    title: 'Universität',
    description:
      'Kein Übungsblatt mehr vergessen. Kein Prüfungsdatum mehr suchen. Klausurcountdown und Abgaben auf einen Blick.',
    accent: 'text-violet-300',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    glow: 'group-hover:shadow-violet-500/20',
    layout: 'lg:col-span-1',
  },
  {
    id: 'career',
    icon: Briefcase,
    title: 'Karriere',
    description:
      'Bewerbungen die du nicht verlierst. Kanban von Applied bis Offer, mit CV-Upload und automatischen Deadlines.',
    accent: 'text-orange-300',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    glow: 'group-hover:shadow-orange-500/20',
    layout: 'lg:col-span-1',
  },
  {
    id: 'timer',
    icon: Timer,
    title: 'Fokus-Timer',
    description:
      'Läuft auf jeder Seite mit. Du weißt immer wie lang du schon sitzt — und wann eine Pause fällig ist.',
    accent: 'text-yellow-300',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    glow: 'group-hover:shadow-yellow-500/20',
    layout: 'lg:col-span-1',
  },
  {
    id: 'analytics',
    icon: BarChart2,
    title: 'Analytics',
    description:
      'Siehst du wie viel du wirklich lernst — oder wie viel du denkst dass du lernst? INNIS zeigt dir den Unterschied.',
    accent: 'text-sky-300',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    glow: 'group-hover:shadow-sky-500/20',
    layout: 'lg:col-span-1',
  },
];

export function FeatureSection() {
  return (
    <section className="relative py-24 md:py-32">
      {/* Top divider */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="marketing-container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <p className="premium-kicker">Alle Module</p>
          <h2 className="premium-heading mb-4 text-3xl font-semibold text-[#FAF0E6] md:text-5xl">
            Sechs Module. Ein System.
          </h2>
          <p className="premium-subtext mx-auto max-w-xl">
            INNIS wurde für Studenten gebaut, die nicht zehn Apps jonglieren wollen —
            sondern ein System, das wirklich funktioniert.
          </p>
        </motion.div>

        <div className="grid auto-rows-[minmax(168px,auto)] gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className={`group premium-card-soft relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01] hover:border-white/20 hover:bg-[#171717] ${feature.glow} ${feature.layout}`}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="pointer-events-none absolute -right-16 -top-16 h-28 w-28 rounded-full bg-white/5 blur-2xl opacity-0 transition duration-300 group-hover:opacity-100" />
              <div
                className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl border ${feature.border} ${feature.bg}`}
              >
                <feature.icon className={`w-5 h-5 ${feature.accent}`} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[#FAF0E6]">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{feature.description}</p>

              {feature.id === 'focus' ? (
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {/* Left: Task list */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">Aufgaben heute</p>
                    {[
                      { label: 'Übungsblatt 8 einreichen', done: true },
                      { label: 'Kap. 5 Klausurvorbereitung', done: true },
                      { label: 'Bewerbung Praktikum', done: false },
                      { label: 'LA II Zusammenfassung', done: false },
                    ].map((task) => (
                      <div key={task.label} className="flex items-center gap-2">
                        <div className={`h-3 w-3 flex-shrink-0 rounded-full border ${task.done ? 'border-red-500 bg-red-500/30' : 'border-white/20'}`} />
                        <span className={`text-[11px] leading-tight ${task.done ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>
                          {task.label}
                        </span>
                      </div>
                    ))}
                    {/* Progress bar */}
                    <div className="pt-2">
                      <div className="h-1 rounded-full bg-white/5">
                        <motion.div
                          className="h-1 rounded-full bg-red-500/80"
                          initial={{ width: 0 }}
                          whileInView={{ width: '72%' }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.9, delay: 0.3 }}
                        />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[10px]">
                        <span className="text-zinc-600">Heute erledigt</span>
                        <span className="font-semibold text-[#FAF0E6]">9 / 12</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Timer + stats */}
                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">Fokus-Timer</p>
                    <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] py-4">
                      <p className="font-mono text-2xl font-semibold tracking-widest text-[#FAF0E6]">23:14</p>
                      <p className="mt-1 text-[9px] uppercase tracking-widest text-zinc-600">Session 2 · läuft</p>
                      <div className="mt-2 h-1 w-16 rounded-full bg-white/5">
                        <motion.div
                          className="h-1 rounded-full bg-red-500/60"
                          initial={{ width: 0 }}
                          whileInView={{ width: '58%' }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: 0.5 }}
                        />
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <p className="text-[10px] text-zinc-600">Fokuszeit heute</p>
                      <p className="text-lg font-bold text-[#FAF0E6]">2h 40m</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {feature.id === 'goals' ? (
                <div className="mt-5 space-y-2">
                  {[
                    { label: 'Fitness', pct: 80, color: 'bg-emerald-500/80' },
                    { label: 'Lernen', pct: 95, color: 'bg-emerald-400/80' },
                    { label: 'Karriere', pct: 52, color: 'bg-emerald-600/70' },
                  ].map((goal) => (
                    <div key={goal.label} className="flex items-center gap-2">
                      <span className="w-14 shrink-0 text-[10px] text-zinc-500">{goal.label}</span>
                      <div className="h-1 flex-1 rounded-full bg-white/5">
                        <motion.div
                          className={`h-1 rounded-full ${goal.color}`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${goal.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-[10px] text-zinc-500">{goal.pct}%</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {feature.id === 'university' ? (
                <div className="mt-5 space-y-3">
                  <div className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    <span className="text-[10px] font-medium text-red-300">Klausur in 12 Tagen</span>
                  </div>
                  <div>
                    <div className="mb-1.5 flex flex-wrap gap-1">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 w-2 rounded-sm ${i < 7 ? 'bg-violet-500/70' : 'bg-white/10'}`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-zinc-500">7 / 12 Übungen</span>
                  </div>
                </div>
              ) : null}

              {feature.id === 'career' ? (
                <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                  <span className="rounded-md border border-white/10 bg-white/[0.02] px-2 py-1 text-zinc-300">Applied 12</span>
                  <span className="rounded-md border border-white/10 bg-white/[0.02] px-2 py-1 text-zinc-300">Interview 4</span>
                  <span className="rounded-md border border-white/10 bg-white/[0.02] px-2 py-1 text-zinc-300">Offer 2</span>
                  <span className="rounded-md border border-white/10 bg-white/[0.02] px-2 py-1 text-zinc-300">Winrate 28%</span>
                </div>
              ) : null}

              {feature.id === 'timer' ? (
                <div className="mt-5 flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] py-3">
                  <p className="font-mono text-lg font-semibold tracking-widest text-[#FAF0E6]">25 : 00</p>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">Fokus · Session 3</p>
                </div>
              ) : null}

              {feature.id === 'analytics' ? (
                <div className="mt-5 flex h-12 items-end gap-1">
                  {[55, 80, 40, 90, 65].map((h, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-t-sm bg-sky-500/60"
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.1 + i * 0.07 }}
                    />
                  ))}
                </div>
              ) : null}
            </motion.div>
          ))}
        </div>

        {/* Lucian Companion Callout */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="premium-card-soft flex items-start gap-5 rounded-2xl p-6 sm:items-center sm:flex-row flex-col"
        >
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-yellow-500/25 bg-yellow-500/10">
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-[#FAF0E6]">Lucian · Execution Companion</span>
              <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-400">
                Inklusive
              </span>
            </div>
            <p className="text-sm leading-relaxed text-zinc-400">
              Lucian ist dein kontextueller Begleiter im Dashboard — er gibt gezielte Impulse, wenn Fokus
              oder Deadlines kritisch werden. Kein Chatbot, kein Spam: nur relevante Hinweise, wann es
              darauf ankommt.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
