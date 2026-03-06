'use client';

import { motion } from 'framer-motion';

const pains = [
  { emoji: '📝', text: 'One App für Thesis-Plan' },
  { emoji: '🎯', text: 'Eine andere für GMAT' },
  { emoji: '💼', text: 'Excel für Bewerbungen' },
  { emoji: '⏱️', text: 'Extra Timer-Tool' },
  { emoji: '📅', text: 'Kalender + Tasks getrennt' },
  { emoji: '📊', text: 'Risiko nur im Kopf' },
  { emoji: '🧠', text: '…und trotzdem Chaos' },
];

const beforeItems = [
  '5 Tools parallel geöffnet',
  'Deadlines nur im Kopf',
  'Tägliches Neuplanen statt Execution',
];

const afterItems = [
  'Eine Timeline mit Risk-Status',
  'Morning-Brief verbindet Strategie mit Today',
  'Klare Next-Moves statt Kontextwechsel',
];

export function ProblemStrip() {
  return (
    <section className="relative py-16 md:py-20">
      {/* Top / Bottom borders */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Subtle red glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/6 blur-3xl" />

      <div className="marketing-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center mb-10"
        >
          <p className="text-[1.35rem] md:text-2xl font-semibold text-[#FAF0E6] leading-snug tracking-tight">
            Thesis. GMAT. Praktikum. Master-Bewerbungen.
            <br />
            <span className="text-zinc-500">
              Alles parallel — und meist auf fünf getrennten Tools verteilt.
            </span>
          </p>
        </motion.div>

        {/* Pain pills */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2.5"
        >
          {pains.map((pain, i) => (
            <motion.span
              key={pain.text}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.25 + i * 0.06 }}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm ${
                i === pains.length - 1
                  ? 'border-red-500/30 bg-red-500/10 text-red-300'
                  : 'border-white/8 bg-white/[0.03] text-zinc-500'
              }`}
            >
              <span>{pain.emoji}</span>
              <span>{pain.text}</span>
            </motion.span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.35 }}
          className="mx-auto mt-8 grid max-w-3xl gap-3 md:grid-cols-2"
        >
          <div className="rounded-xl border border-red-500/25 bg-red-500/[0.06] p-3.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-300">Before</p>
            <div className="space-y-1.5">
              {beforeItems.map((item) => (
                <p key={item} className="text-sm text-zinc-400">
                  · {item}
                </p>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300">After INNIS</p>
            <div className="space-y-1.5">
              {afterItems.map((item) => (
                <p key={item} className="text-sm text-zinc-300">
                  · {item}
                </p>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bridge to solution */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7 }}
          className="mt-12 flex flex-col items-center gap-4"
        >
          <div className="h-8 w-px bg-gradient-to-b from-white/20 to-transparent" />
          <p className="text-center text-2xl font-semibold tracking-tight text-[#FAF0E6] md:text-3xl">
            Eine Timeline.{' '}
            <span className="text-zinc-500">Ein Daily-Flow.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
