'use client';

import { motion } from 'framer-motion';

const contrasts = [
  {
    label: 'Planung',
    problem: 'Deadline irgendwo im Kopf, Aufwand irgendwo in Notion.',
    solution: 'Eine Timeline mit Startfenster, Buffer und Risikologik.',
  },
  {
    label: 'Daily',
    problem: 'Jeder Morgen beginnt mit Sortieren und Kontextwechsel.',
    solution: 'Today übernimmt den nächsten Move aus Trajectory.',
  },
  {
    label: 'Signal',
    problem: 'Du merkst zu spät, dass Thesis, GMAT und Bewerbungen kollidieren.',
    solution: 'INNIS zeigt die Kollision früh genug, damit du reagieren kannst.',
  },
];

export function ProblemStrip() {
  return (
    <section className="relative py-28 md:py-36">
      <div className="premium-divider" />

      <div className="marketing-container relative z-10 mt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-20 max-w-3xl text-center"
        >
          <p className="premium-kicker">Das eigentliche Problem</p>
          <h2 className="premium-heading text-[clamp(2.2rem,5vw,4rem)] font-semibold text-[#FAF0E6]">
            Die meisten Tools
            <br />
            verwalten Aufgaben.
          </h2>
          <p className="mt-6 text-lg text-zinc-500">INNIS verwaltet Konflikte.</p>
        </motion.div>

        <div className="mx-auto max-w-4xl space-y-px overflow-hidden rounded-2xl border border-white/[0.05]">
          {contrasts.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="grid gap-px bg-white/[0.03] md:grid-cols-[120px_1fr_1fr]"
            >
              <div className="flex items-center bg-[#0A0A0C] px-6 py-5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {row.label}
                </span>
              </div>
              <div className="bg-[#0A0A0C] px-6 py-5">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-red-400/60">
                  Vorher
                </p>
                <p className="text-[14px] leading-relaxed text-zinc-500">{row.problem}</p>
              </div>
              <div className="bg-[#0A0A0C] px-6 py-5">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#E8B930]/60">
                  Mit INNIS
                </p>
                <p className="text-[14px] leading-relaxed text-zinc-300">{row.solution}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
