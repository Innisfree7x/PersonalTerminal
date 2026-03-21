'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { TrackedCtaLink } from './TrackedCtaLink';

/**
 * CTASection — Final "destination" section.
 *
 * PRISMA-style: Full viewport, centered text, gold glow climax.
 * The line arrives here. Confident. Clear.
 */
export function CTASection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Gold glow — climax moment */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8B930]/[0.06] blur-[200px]" />

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="premium-heading text-[clamp(2.4rem,6vw,5rem)] font-semibold text-white">
            Ein System.
            <br />
            Eine Linie.
            <br />
            <span className="bg-gradient-to-r from-[#E8B930] via-[#F5D565] to-[#E8B930] bg-clip-text text-transparent">
              Dein nächster Move.
            </span>
          </h2>

          <p className="mx-auto mt-8 max-w-lg text-[17px] leading-[1.7] text-zinc-500">
            Trajectory, Today und Career in einem System.
            Für Studenten, die mehrere High-Stakes-Ziele parallel verfolgen.
          </p>

          <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <TrackedCtaLink
              href="/auth/signup"
              eventName="landing_cta_primary_clicked"
              eventPayload={{ source: 'footer_cta', variant: 'primary' }}
              className="premium-cta-primary"
            >
              Kostenlos starten
              <ArrowRight className="h-4 w-4" />
            </TrackedCtaLink>
            <TrackedCtaLink
              href="/auth/login"
              eventName="landing_cta_secondary_clicked"
              eventPayload={{ source: 'footer_cta', variant: 'login' }}
              className="premium-cta-secondary"
            >
              Login
            </TrackedCtaLink>
          </div>

          <p className="mt-8 text-[12px] text-zinc-600">
            Keine Kreditkarte · Public Beta · Konto in 2 Minuten
          </p>
        </motion.div>
      </div>
    </section>
  );
}
