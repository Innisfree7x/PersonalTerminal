'use client';

import { motion } from 'framer-motion';

/**
 * SocialProof — Compact metrics strip between features and CTA.
 *
 * Three large numbers in a single row — scroll-revealed, minimal.
 */

const metrics = [
  { value: '−47%', label: 'Deadline-Risiko', detail: 'Backward Planning + Buffer' },
  { value: '+7h', label: 'Fokuszeit / Woche', detail: 'Morning Brief + Focus Flow' },
  { value: '86%', label: 'Wochen mit klarem Move', detail: 'Statt täglichem Neuplanen' },
];

export function SocialProof() {
  return (
    <section className="relative py-32 md:py-40">
      <div className="mx-auto max-w-5xl px-6 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
        >
          <p className="mb-12 text-center text-[11px] font-medium uppercase tracking-[0.35em] text-zinc-600">
            Messbare Klarheit
          </p>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.06] md:grid-cols-3">
            {metrics.map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-white/[0.015] p-8 text-center transition-colors duration-300 hover:bg-white/[0.03] md:p-10"
              >
                <span className="block text-[clamp(2.5rem,6vw,4rem)] font-bold tracking-tight text-white">
                  {metric.value}
                </span>
                <span className="mt-2 block text-[13px] font-medium text-zinc-400">
                  {metric.label}
                </span>
                <span className="mt-1 block text-[11px] text-zinc-600">
                  {metric.detail}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
