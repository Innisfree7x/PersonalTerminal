'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { TrackedCtaLink } from './TrackedCtaLink';

const trustItems = ['Keine Kreditkarte', 'Konto in 2 Minuten', 'Public Beta'];

export function CTASection() {
  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/9 blur-[130px]" />
        <div className="absolute left-1/2 top-1/2 h-[260px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-500/5 blur-[90px]" />
      </div>

      <div className="marketing-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="premium-kicker mb-5"
          >
            Jetzt starten
          </motion.p>

          <h2 className="premium-heading text-[clamp(2.4rem,5vw,4.2rem)] font-semibold text-[#FAF0E6]">
            Wenn Thesis, GMAT und Praktika parallel laufen,
            <span className="block bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              brauchst du kein weiteres Tool.
            </span>
          </h2>

          <p className="premium-subtext mx-auto mt-5 max-w-2xl text-[1rem] leading-relaxed md:text-lg">
            Du brauchst eine klare Linie vom langfristigen Plan bis in den heutigen Move.
            Genau dafuer ist INNIS gebaut.
          </p>

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
