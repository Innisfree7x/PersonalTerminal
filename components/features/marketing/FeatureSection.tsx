'use client';

import { motion } from 'framer-motion';
import { Calendar, BookOpen, Target, Briefcase, Timer, BarChart2 } from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Tagesplanung',
    description:
      'Aufgaben, Kalender und Fokus-Timer auf einem Dashboard. Dein Tag, optimal strukturiert — von morgens bis abends.',
    accent: 'text-blue-400',
    bg: 'bg-blue-500/8',
    border: 'border-blue-500/15',
    glow: 'group-hover:shadow-blue-500/10',
  },
  {
    icon: BookOpen,
    title: 'Universität',
    description:
      'Kursmanagement mit Übungsblatt-Tracking und Klausurcountdown. Abgabetermine verpassen gehört der Vergangenheit an.',
    accent: 'text-violet-400',
    bg: 'bg-violet-500/8',
    border: 'border-violet-500/15',
    glow: 'group-hover:shadow-violet-500/10',
  },
  {
    icon: Target,
    title: 'Ziele',
    description:
      'Definiere Ziele mit Deadline und Priorität. Verfolge deinen Fortschritt — wöchentlich, monatlich, jährlich.',
    accent: 'text-emerald-400',
    bg: 'bg-emerald-500/8',
    border: 'border-emerald-500/15',
    glow: 'group-hover:shadow-emerald-500/10',
  },
  {
    icon: Briefcase,
    title: 'Karriere',
    description:
      'Bewerbungs-Kanban von Applied bis Offer. CV-Upload mit automatischer Extraktion und Terminverfolgung inklusive.',
    accent: 'text-orange-400',
    bg: 'bg-orange-500/8',
    border: 'border-orange-500/15',
    glow: 'group-hover:shadow-orange-500/10',
  },
  {
    icon: Timer,
    title: 'Fokus-Timer',
    description:
      'Globaler Pomodoro-Timer, der über alle Seiten hinweg läuft. Mit Streak-Tracking und täglichen Produktivitätsstats.',
    accent: 'text-red-400',
    bg: 'bg-red-500/8',
    border: 'border-red-500/15',
    glow: 'group-hover:shadow-red-500/10',
  },
  {
    icon: BarChart2,
    title: 'Analytics',
    description:
      'Deine Produktivität auf einen Blick. Fokuszeit nach Tagesabschnitt, Aufgaben-Completion-Rate und Streak-Verlauf.',
    accent: 'text-yellow-400',
    bg: 'bg-yellow-500/8',
    border: 'border-yellow-500/15',
    glow: 'group-hover:shadow-yellow-500/10',
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
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-red-400">Alle Module</p>
          <h2 className="premium-heading mb-4 text-3xl font-semibold text-[#FAF0E6] md:text-5xl">
            Sechs Module. Ein System.
          </h2>
          <p className="premium-subtext mx-auto max-w-xl">
            INNIS wurde für Studenten gebaut, die nicht zehn Apps jonglieren wollen —
            sondern ein System, das wirklich funktioniert.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className={`group premium-card-soft relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-[#171717] ${feature.glow}`}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div
                className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl border ${feature.border} ${feature.bg}`}
              >
                <feature.icon className={`w-5 h-5 ${feature.accent}`} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[#FAF0E6]">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
