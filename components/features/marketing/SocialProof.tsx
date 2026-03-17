'use client';

import { motion } from 'framer-motion';

const stats = [
  { value: '< 50ms', label: 'UI Response Time' },
  { value: '100%', label: 'Type-safe Codebase' },
  { value: '3', label: 'Integrierte Systeme' },
  { value: '0', label: 'Externe Abhängigkeiten' },
];

const testimonials = [
  {
    quote: 'Ich hatte Thesis, GMAT und drei Bewerbungen parallel — ohne INNIS hätte ich den GMAT verschoben.',
    role: 'WiWi-Student, Mannheim',
  },
  {
    quote: 'Endlich sehe ich morgens sofort, was heute wirklich zählt. Kein Sortieren, kein Raten.',
    role: 'BWL-Studentin, Frankfurt',
  },
];

export function SocialProof() {
  return (
    <section className="relative py-28 md:py-36">
      <div className="premium-divider" />

      <div className="marketing-container mt-16">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-20 max-w-4xl"
        >
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.05] md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-white/[0.015] p-8 text-center"
              >
                <div className="text-3xl font-bold tracking-tight text-[#FAF0E6] md:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-[12px] tracking-wide text-zinc-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials */}
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.role}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-8"
            >
              <p className="text-[15px] leading-[1.7] text-zinc-400 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.04]" />
                <p className="text-[12px] font-medium tracking-wide text-zinc-500">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
