'use client';

import { motion } from 'framer-motion';

const contrasts = [
  {
    label: 'Planung',
    before: 'Deadline irgendwo im Kopf, Aufwand irgendwo in Notion.',
    after: 'Eine Timeline mit Startfenster, Buffer und klarer Risikologik.',
  },
  {
    label: 'Daily',
    before: 'Jeder Morgen beginnt mit Neu-Sortieren und Kontextwechsel.',
    after: 'Today übernimmt den nächsten Move direkt aus Trajectory.',
  },
  {
    label: 'Signal',
    before: 'Du merkst zu spät, dass Thesis, GMAT und Bewerbungen kollidieren.',
    after: 'INNIS zeigt die Kollision früh genug, damit du reagieren kannst.',
  },
];

export function ProblemStrip() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/15 to-transparent" />

      <div className="marketing-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <p className="premium-kicker">Das eigentliche Problem</p>
          <h2 className="premium-heading text-[clamp(2rem,4.5vw,3.6rem)] font-semibold text-[#FAF0E6]">
            Die meisten Tools verwalten Aufgaben.
            <br />
            <span className="text-zinc-600">INNIS verwaltet Konflikte.</span>
          </h2>
        </motion.div>

        <div className="mx-auto max-w-4xl space-y-4">
          {contrasts.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="grid gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5 md:grid-cols-[100px_1fr_1fr]"
            >
              <div className="flex items-start">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                  {row.label}
                </span>
              </div>
              <div className="rounded-xl border border-red-500/15 bg-red-500/[0.04] p-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-red-400/80">
                  Vorher
                </p>
                <p className="text-sm leading-relaxed text-zinc-500">{row.before}</p>
              </div>
              <div className="rounded-xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] p-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D4AF37]/80">
                  Mit INNIS
                </p>
                <p className="text-sm leading-relaxed text-zinc-300">{row.after}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
