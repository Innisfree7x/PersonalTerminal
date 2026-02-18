'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { TrackedCtaLink } from './TrackedCtaLink';

export function CTASection() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl border border-white/8 bg-[#111111] p-10 md:p-16 text-center overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-red-500/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-yellow-500/6 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6 max-w-xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#FAF0E6] tracking-tight leading-[1.1]">
              Bereit für mehr{' '}
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Struktur
              </span>
              ?
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              Erstelle dein Konto in unter 2 Minuten und starte mit dem Onboarding-Wizard.
              Kostenlos, ohne Kreditkarte.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <TrackedCtaLink
                href="/auth/signup"
                eventName="landing_cta_primary_clicked"
                eventPayload={{ source: 'footer_cta', variant: 'primary' }}
                className="inline-flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-all hover:shadow-xl hover:shadow-red-500/20 active:scale-[0.97] text-sm"
              >
                Kostenlos starten
                <ArrowRight className="w-4 h-4" />
              </TrackedCtaLink>
              <TrackedCtaLink
                href="/auth/login"
                eventName="landing_cta_secondary_clicked"
                eventPayload={{ source: 'footer_cta', variant: 'login' }}
                className="inline-flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-[#FAF0E6] font-medium px-8 py-3.5 rounded-xl transition-all text-sm"
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
