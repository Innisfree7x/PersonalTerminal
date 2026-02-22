'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ProductMockup } from './ProductMockup';
import { TrackedCtaLink } from './TrackedCtaLink';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-10 pt-10 md:pb-16 md:pt-14">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[15%] h-[420px] w-[420px] rounded-full bg-red-500/8 blur-[120px]" />
        <div className="absolute right-[-8%] top-[8%] h-[360px] w-[360px] rounded-full bg-yellow-500/8 blur-[120px]" />
      </div>

      <div className="marketing-container relative z-10 w-full">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr] xl:gap-16">
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
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-xs font-semibold tracking-wide text-yellow-300">Kostenlos für Studenten</span>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
            >
              <h1 className="font-sans text-[clamp(2rem,4.2vw,3.6rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[#FAF0E6]">
                Deine Kommilitonen
                <br />
                jonglieren 7 Apps.{' '}
                <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  Du nicht.
                </span>
              </h1>
            </motion.div>

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
              className="flex flex-col gap-3 sm:flex-row pt-1"
            >
              <TrackedCtaLink
                href="/auth/signup"
                eventName="landing_cta_primary_clicked"
                eventPayload={{ source: 'hero', variant: 'primary' }}
                className="premium-cta-primary"
              >
                Kostenlos starten
                <ArrowRight className="w-4 h-4" />
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

            {/* Chips + stats in one compact row */}
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

            {/* Quick stats */}
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
          <div className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="relative"
            >
              <ProductMockup />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
