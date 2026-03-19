'use client';

import { motion } from 'framer-motion';
import { BriefcaseBusiness, Command, Route } from 'lucide-react';

const stats = [
  { value: '-47%', label: 'weniger Deadline-Risiko', detail: 'durch Backward Planning + Buffer' },
  { value: '+7h', label: 'mehr Fokuszeit / Woche', detail: 'durch Morning Brief + Focus Flow' },
  { value: '86%', label: 'Wochen mit klarem Next Move', detail: 'statt taeglichem Neuplanen' },
  { value: '1 System', label: 'Plan, Day und Karriere', detail: 'statt verteiltem Tool-Chaos' },
];

const proofPanels = [
  {
    icon: Route,
    title: 'Trajectory macht Deadlines operational',
    copy: 'Nicht nur das Enddatum, sondern Prep-Start, Buffer und Kollision werden sichtbar. Genau dort kippt der Unterschied von Notion zu INNIS.',
  },
  {
    icon: Command,
    title: 'Today ist keine zweite To-do-Liste',
    copy: 'Morning Briefing, Focus und Command Rail ziehen den naechsten Move direkt aus dem strategischen Plan, statt ihn jeden Morgen neu zu raten.',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Career ist nicht nur Jobsuche',
    copy: 'CV-Upload, Match-Signal, Gaps und konkrete Aktionen liegen in derselben Oberflaeche. Dadurch wird aus "passt vielleicht" ein klarer Bewerbungszug.',
  },
];

export function SocialProof() {
  return (
    <section className="relative py-36 md:py-44">
      <div className="premium-divider" />

      <div className="marketing-container mt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <p className="premium-kicker">Product Proof</p>
          <h2 className="premium-heading text-[clamp(2rem,4.5vw,3.6rem)] font-semibold text-[#FAF0E6]">
            Kein Motivations-Tool. Ein System mit messbarer Klarheit.
          </h2>
          <p className="mt-5 text-base leading-[1.8] text-zinc-500 md:text-lg">
            Die staerksten Stellen von INNIS sind nicht Features fuer sich, sondern die Logik dazwischen: erst Risiko sehen, dann priorisieren, dann handeln.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-16 max-w-5xl"
        >
          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.05] md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-white/[0.015] p-7 transition-colors duration-300 hover:bg-white/[0.035] md:p-8"
              >
                <div className="text-3xl font-bold tracking-tight text-[#FAF0E6] md:text-4xl">{stat.value}</div>
                <div className="mt-2 text-sm font-medium text-zinc-300">{stat.label}</div>
                <div className="mt-1 text-[12px] leading-relaxed text-zinc-500">{stat.detail}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {proofPanels.map((panel, i) => (
            <motion.div
              key={panel.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.09] hover:bg-white/[0.03]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8B930]/10 bg-[#E8B930]/[0.04]">
                <panel.icon className="h-5 w-5 text-[#E8B930]/75" />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-[#FAF0E6]">{panel.title}</h3>
              <p className="mt-3 text-[14px] leading-[1.8] text-zinc-400">{panel.copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
