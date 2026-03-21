'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

/**
 * SocialProof — "The Numbers" section.
 *
 * PRISMA-style: Large metrics revealed by scroll, minimal text.
 * No cards, no grids. Pure data presence.
 */

const metrics = [
  { value: '−47%', label: 'Deadline-Risiko', detail: 'Durch Backward Planning + Buffer' },
  { value: '+7h', label: 'Fokuszeit pro Woche', detail: 'Durch Morning Brief + Focus Flow' },
  { value: '86%', label: 'Wochen mit klarem Move', detail: 'Statt täglichem Neuplanen' },
];

function MetricReveal({ metric, index }: { metric: typeof metrics[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0.2, 0.4, 0.6, 0.8], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0.2, 0.4], [60, 0]);
  const scale = useTransform(scrollYProgress, [0.2, 0.4], [0.9, 1]);

  return (
    <div ref={ref} className="flex min-h-[60vh] items-center justify-center">
      <motion.div style={{ opacity, y, scale }} className="text-center">
        <span className="block text-[clamp(4rem,12vw,10rem)] font-bold tracking-tight text-white">
          {metric.value}
        </span>
        <span className="mt-2 block text-[14px] font-medium uppercase tracking-[0.2em] text-zinc-400">
          {metric.label}
        </span>
        <span className="mt-3 block text-[13px] text-zinc-600">
          {metric.detail}
        </span>
        {index < metrics.length - 1 && (
          <div className="mx-auto mt-16 h-16 w-px bg-gradient-to-b from-white/[0.08] to-transparent" />
        )}
      </motion.div>
    </div>
  );
}

export function SocialProof() {
  return (
    <section className="relative py-20">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mb-12 text-center"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-zinc-600">
          Messbare Klarheit
        </p>
      </motion.div>

      {metrics.map((metric, i) => (
        <MetricReveal key={metric.label} metric={metric} index={i} />
      ))}
    </section>
  );
}
