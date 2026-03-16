'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { TrackedCtaLink } from './TrackedCtaLink';

const trustItems = ['Keine Kreditkarte', 'Konto in 2 Minuten', 'Public Beta'];

export function CTASection() {
  return (
    <section className="relative overflow-hidden py-32 md:py-44">
      <div className="premium-divider" />

      {/* Central glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4AF37]/[0.04] blur-[150px]" />

      <div className="marketing-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="premium-kicker">Jetzt starten</p>

          <h2 className="premium-heading text-[clamp(2.4rem,5.5vw,4.5rem)] font-semibold text-[#FAF0E6]">
            Wenn Thesis, GMAT
            <br />
            und Praktika parallel laufen,{' '}
            <span className="bg-gradient-to-r from-[#C9A227] via-[#E8D48B] to-[#C9A227] bg-clip-text italic text-transparent">
              brauchst du kein weiteres Tool.
            </span>
          </h2>

          <p className="mx-auto mt-8 max-w-xl text-[17px] leading-[1.7] text-zinc-500">
            Du brauchst eine klare Linie vom langfristigen Plan bis in den heutigen Move.
            Genau dafür ist INNIS gebaut.
          </p>

          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
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

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2"
          >
            {trustItems.map((item) => (
              <span key={item} className="flex items-center gap-2 text-[13px] text-zinc-600">
                <Check className="h-3.5 w-3.5 text-[#D4AF37]/50" />
                {item}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
