'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { TrackedCtaLink } from './TrackedCtaLink';

export function HeroSection() {
  return (
    <section className="relative flex h-screen min-h-[700px] flex-col items-center justify-center overflow-hidden">
      {/* Subtle gold glow — very restrained */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8B930]/[0.04] blur-[200px]" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        {/* Kicker — minimal, no badge */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mb-8 text-[11px] font-medium uppercase tracking-[0.35em] text-zinc-500"
        >
          Career Intelligence System
        </motion.p>

        {/* Main headline — large serif, PRISMA-level */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="premium-heading text-[clamp(2.8rem,7vw,6.5rem)] font-semibold text-white"
        >
          Sieh den Konflikt,
          <br />
          <span className="bg-gradient-to-r from-[#E8B930] via-[#F5D565] to-[#E8B930] bg-clip-text text-transparent">
            bevor er dich trifft.
          </span>
        </motion.h1>

        {/* Subline — one sentence, understated */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mx-auto mt-8 max-w-2xl text-[18px] leading-[1.7] text-zinc-500"
        >
          INNIS zeigt dir, wann Thesis, GMAT und Bewerbungen kollidieren — und gibt dir
          den nächsten Move, nicht das nächste Dashboard.
        </motion.p>

        {/* CTA — single, centered */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <TrackedCtaLink
            href="/auth/signup"
            eventName="landing_cta_primary_clicked"
            eventPayload={{ source: 'hero', variant: 'primary' }}
            className="premium-cta-primary"
          >
            Kostenlos starten
            <ArrowRight className="h-4 w-4" />
          </TrackedCtaLink>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-3"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-600">Scroll</span>
          <div className="h-8 w-[1px] bg-gradient-to-b from-zinc-600 to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  );
}
