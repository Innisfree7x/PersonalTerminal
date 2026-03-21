'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

/**
 * ProblemStrip — "The Collision" section.
 *
 * PRISMA-style: full viewport, large serif text, content revealed by scroll.
 * No cards, no grids, no icons. Pure typography + negative space.
 */
export function ProblemStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const opacity1 = useTransform(scrollYProgress, [0.1, 0.25, 0.4, 0.55], [0, 1, 1, 0]);
  const opacity2 = useTransform(scrollYProgress, [0.3, 0.45, 0.6, 0.75], [0, 1, 1, 0]);
  const opacity3 = useTransform(scrollYProgress, [0.5, 0.65, 0.8, 0.9], [0, 1, 1, 0.8]);
  const y1 = useTransform(scrollYProgress, [0.1, 0.25], [40, 0]);
  const y2 = useTransform(scrollYProgress, [0.3, 0.45], [40, 0]);
  const y3 = useTransform(scrollYProgress, [0.5, 0.65], [40, 0]);

  return (
    <section ref={ref} className="relative min-h-[200vh] py-32">
      <div className="sticky top-0 flex h-screen items-center justify-center">
        <div className="mx-auto max-w-4xl px-6 text-center">
          {/* Phase 1: The problem */}
          <motion.div style={{ opacity: opacity1, y: y1 }} className="absolute inset-x-6 top-1/2 -translate-y-1/2">
            <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.35em] text-zinc-600">
              Das Problem
            </p>
            <h2 className="premium-heading text-[clamp(2rem,5vw,4.5rem)] font-semibold text-white">
              Thesis in 6 Monaten.
              <br />
              GMAT in 4.
              <br />
              <span className="text-zinc-500">Bewerbungen ab sofort.</span>
            </h2>
          </motion.div>

          {/* Phase 2: What happens */}
          <motion.div style={{ opacity: opacity2, y: y2 }} className="absolute inset-x-6 top-1/2 -translate-y-1/2">
            <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.35em] text-red-400/60">
              Was passiert
            </p>
            <h2 className="premium-heading text-[clamp(2rem,5vw,4.5rem)] font-semibold text-white">
              Du merkst die Kollision
              <br />
              <span className="text-red-400/80">drei Wochen zu spät.</span>
            </h2>
            <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-zinc-500">
              Notion zeigt dir Deadlines. Nicht Konflikte. Nicht den Moment,
              an dem dein Buffer aufgebraucht ist und zwei Preps gleichzeitig starten müssten.
            </p>
          </motion.div>

          {/* Phase 3: The shift */}
          <motion.div style={{ opacity: opacity3, y: y3 }} className="absolute inset-x-6 top-1/2 -translate-y-1/2">
            <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.35em] text-[#E8B930]">
              Der Unterschied
            </p>
            <h2 className="premium-heading text-[clamp(2rem,5vw,4.5rem)] font-semibold text-white">
              INNIS zeigt den Konflikt,
              <br />
              <span className="bg-gradient-to-r from-[#E8B930] via-[#F5D565] to-[#E8B930] bg-clip-text text-transparent">
                bevor du ihn spürst.
              </span>
            </h2>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
