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
                <div className="mt-5 space-y-2.5">
                  <div className="h-1.5 rounded-full bg-white/5">
                    <motion.div
                      className="h-1.5 rounded-full bg-red-500/80"
                      initial={{ width: 0 }}
                      whileInView={{ width: '72%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: 0.3 }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Heute erledigt</span>
                    <span className="font-semibold text-[#FAF0E6]">9 / 12 Tasks</span>
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
