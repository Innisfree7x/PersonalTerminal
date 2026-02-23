'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ProductMockup } from './ProductMockup';
import { TrackedCtaLink } from './TrackedCtaLink';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-0 pt-14 md:pt-20">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[15%] h-[420px] w-[420px] rounded-full bg-red-500/8 blur-[120px]" />
        <div className="absolute right-[-8%] top-[8%] h-[360px] w-[360px] rounded-full bg-yellow-500/6 blur-[120px]" />
      </div>

      <div className="marketing-container relative z-10 w-full">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] xl:gap-16">

          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-5"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-yellow-500/25 bg-yellow-500/10 px-3.5 py-1.5"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
              <span className="text-xs font-semibold tracking-wide text-yellow-300">Kostenlos für Studenten</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="font-sans text-[clamp(2.2rem,4.5vw,3.8rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[#FAF0E6]"
            >
              Studieren ohne
              <br />
              zu{' '}
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                jonglieren.
              </span>
            </motion.h1>

            {/* Subline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="premium-subtext max-w-md text-[1rem] leading-relaxed"
            >
              Kurse, Prüfungen, Bewerbungen und Ziele — ein einziges System,
              das mitdenkt. Kein Tab-Switching, kein Vergessen, kein Stress.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col gap-3 pt-1 sm:flex-row"
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
              <TrackedCtaLink
                href="/auth/login"
                eventName="landing_cta_secondary_clicked"
                eventPayload={{ source: 'hero', variant: 'login' }}
                className="premium-cta-secondary"
              >
                Bereits angemeldet? Login
              </TrackedCtaLink>
            </motion.div>

            {/* Chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-2"
            >
              <span className="premium-chip">Keine Kreditkarte</span>
              <span className="premium-chip">2 Min Setup</span>
              <span className="premium-chip">Für Studenten gebaut</span>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="premium-card-soft grid grid-cols-3 gap-4 rounded-2xl p-4"
            >
              {[
                { value: 'Ø 4h', label: 'Fokus am Tag' },
                { value: '7 Apps', label: 'ersetzt durch eine' },
                { value: '100%', label: 'kostenlos' },
              ].map((stat, i) => (
                <div key={i} className="relative">
                  {i > 0 && <div className="absolute -left-2 top-1 h-8 w-px bg-white/10" />}
                  <div>
                    <p className="text-xl font-bold leading-none text-[#FAF0E6]">{stat.value}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-zinc-500">{stat.label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Product Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.25 }}
            className="relative hidden lg:block"
          >
            <ProductMockup />
            {/* Gradient fade bottom */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0d0d12] to-transparent" />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
