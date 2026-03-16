'use client';

import { motion } from 'framer-motion';

const stats = [
  { value: '< 50ms', label: 'UI Response Time' },
  { value: '100%', label: 'Type-safe Codebase' },
  { value: '3', label: 'Integrated Systems' },
  { value: '0', label: 'External Dependencies' },
];

const testimonials = [
  {
    quote: 'Ich hatte Thesis, GMAT und drei Bewerbungen parallel — ohne INNIS haette ich den GMAT verschoben.',
    role: 'WiWi-Student, Mannheim',
  },
  {
    quote: 'Endlich sehe ich morgens sofort, was heute wirklich zaehlt. Kein Sortieren, kein Raten.',
    role: 'BWL-Studentin, Frankfurt',
  },
];

export function SocialProof() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent" />

      <div className="marketing-container relative z-10">
        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-16 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center"
            >
              <div className="text-2xl font-bold text-[#FAF0E6] md:text-3xl">{stat.value}</div>
              <div className="mt-1 text-xs text-zinc-500">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.role}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="premium-card-soft rounded-2xl p-6"
            >
              <p className="text-sm leading-relaxed text-zinc-300 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <p className="mt-4 text-xs font-medium text-zinc-500">{t.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
