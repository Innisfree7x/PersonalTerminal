'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { TrackedCtaLink } from './TrackedCtaLink';

export function CTASection() {
  return (
    <section className="py-16 md:py-24">
      <div className="marketing-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="premium-card relative overflow-hidden rounded-3xl p-10 text-center md:p-16"
        >
          {/* Background glow */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/12 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-yellow-500/8 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          <div className="relative z-10 space-y-6 max-w-xl mx-auto">
            <h2 className="premium-heading text-3xl font-semibold text-[#FAF0E6] md:text-4xl lg:text-5xl">
              Starte heute.{' '}
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Deine Klausur
              </span>{' '}
              wartet nicht.
            </h2>
            <p className="premium-subtext">
              Konto in unter 2 Minuten. Kurse, Deadlines und Aufgaben sofort angelegt.
              Kein Chaos mehr — kostenlos, ohne Kreditkarte.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <TrackedCtaLink
                href="/auth/signup"
                eventName="landing_cta_primary_clicked"
                eventPayload={{ source: 'footer_cta', variant: 'primary' }}
                className="premium-cta-primary"
              >
                Kostenlos starten
                <ArrowRight className="w-4 h-4" />
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
          </div>
        </motion.div>
      </div>
    </section>
  );
}
