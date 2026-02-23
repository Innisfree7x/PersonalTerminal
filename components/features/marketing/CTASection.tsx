'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { TrackedCtaLink } from './TrackedCtaLink';

const trustItems = [
  'Keine Kreditkarte',
  'Konto in 2 Minuten',
  '100% kostenlos',
];

export function CTASection() {
  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      {/* Full-bleed background treatment */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        {/* Center radial glow — large and dramatic */}
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/10 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-500/6 blur-[80px]" />
        {/* Edge glows */}
        <div className="absolute -left-32 bottom-0 h-64 w-64 rounded-full bg-red-500/8 blur-3xl" />
        <div className="absolute -right-32 top-0 h-64 w-64 rounded-full bg-yellow-500/6 blur-3xl" />
      </div>

      <div className="marketing-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          {/* Kicker */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="premium-kicker mb-5"
          >
            Jetzt starten
          </motion.p>

          {/* Big headline */}
          <h2 className="font-sans text-[clamp(2.2rem,5vw,3.8rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[#FAF0E6]">
            Deine Klausur
            <br />
            <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              wartet nicht.
            </span>
          </h2>

          <p className="premium-subtext mx-auto mt-5 max-w-md text-[1rem] leading-relaxed">
            Starte heute. Kurse, Deadlines und Ziele sofort angelegt —
            kein Chaos mehr, kein Tab-Switching, kein Vergessen.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
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
              Bereits angemeldet? Login
            </TrackedCtaLink>
          </div>

          {/* Trust chips */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2"
          >
            {trustItems.map((item) => (
              <span key={item} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Check className="h-3 w-3 text-emerald-500" />
                {item}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
