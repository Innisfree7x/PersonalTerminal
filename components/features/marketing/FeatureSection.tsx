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
    <section className="py-24 md:py-32 relative">
      {/* Top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-4">Alle Module</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#FAF0E6] tracking-tight mb-4">
            Sechs Module. Ein System.
          </h2>
          <p className="text-zinc-500 max-w-lg mx-auto leading-relaxed">
            Prism wurde für Studenten gebaut, die nicht zehn Apps jonglieren wollen —
            sondern ein System, das wirklich funktioniert.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className={`group relative p-6 rounded-2xl border border-white/5 bg-[#111111] hover:border-white/10 hover:bg-[#161616] transition-all duration-300 hover:shadow-lg ${feature.glow}`}
            >
              <div
                className={`w-11 h-11 rounded-xl ${feature.bg} border ${feature.border} flex items-center justify-center mb-5`}
              >
                <feature.icon className={`w-5 h-5 ${feature.accent}`} />
              </div>
              <h3 className="text-[#FAF0E6] font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
