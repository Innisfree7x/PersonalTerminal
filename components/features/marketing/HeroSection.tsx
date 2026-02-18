'use client';

import { useCallback } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ProductMockup } from './ProductMockup';
import { TrackedCtaLink } from './TrackedCtaLink';
import { CompanionCard } from './CompanionCard';

export function HeroSection() {
  const mouseX = useMotionValue(420);
  const mouseY = useMotionValue(180);
  const smoothX = useSpring(mouseX, { stiffness: 220, damping: 35, mass: 0.4 });
  const smoothY = useSpring(mouseY, { stiffness: 220, damping: 35, mass: 0.4 });
  const spotlight = useMotionTemplate`radial-gradient(640px circle at ${smoothX}px ${smoothY}px, rgba(239,68,68,0.14), rgba(234,179,8,0.09) 35%, transparent 72%)`;

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - bounds.left);
    mouseY.set(event.clientY - bounds.top);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(420);
    mouseY.set(180);
  }, [mouseX, mouseY]);

  return (
    <section
      className="relative overflow-hidden pb-12 pt-14 md:pb-20 md:pt-20"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[15%] h-[580px] w-[580px] rounded-full bg-red-500/10 blur-[130px]" />
        <div className="absolute right-[-8%] top-[8%] h-[480px] w-[480px] rounded-full bg-yellow-500/10 blur-[130px]" />
        <div className="absolute left-1/2 top-0 h-20 w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-yellow-200/10 to-transparent blur-2xl" />
      </div>
      <motion.div
        className="pointer-events-none absolute inset-0 z-[1] opacity-90"
        style={{ background: spotlight }}
      />

      <div className="marketing-container relative z-10 w-full">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] xl:gap-20">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-9"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-yellow-500/25 bg-yellow-500/10 px-3.5 py-1.5 shadow-[0_8px_28px_rgba(234,179,8,0.15)]"
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
              <h1 className="font-sans text-[clamp(2.8rem,7.2vw,6.6rem)] font-semibold leading-[0.9] tracking-[-0.04em] text-[#FAF0E6]">
                Dein persönliches
                <br />
                Dashboard fürs{' '}
                <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  Studium.
                </span>
              </h1>
            </motion.div>

            {/* Subline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="premium-subtext max-w-xl text-[1.08rem]"
            >
              Kurse, Aufgaben, Ziele und Karriere — alles in einem System.
              Weniger App-Wechsel, mehr Fokus auf das, was zählt.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col gap-3 sm:flex-row"
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

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-2"
            >
              <span className="premium-chip">No credit card</span>
              <span className="premium-chip">2 min Setup</span>
              <span className="premium-chip">Built for students</span>
            </motion.div>

            {/* Lucian Companion — mobile only (desktop shows as overlay on mockup) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.62, duration: 0.5 }}
              className="lg:hidden"
            >
              <CompanionCard className="max-w-[280px]" />
            </motion.div>

            {/* Quick stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="premium-card-soft grid max-w-xl grid-cols-3 gap-4 rounded-2xl p-4"
            >
              {[
                { value: '6+', label: 'Module' },
                { value: '∞', label: 'Aufgaben & Kurse' },
                { value: '1', label: 'Ort für alles' },
              ].map((stat, i) => (
                <div key={i} className="relative">
                  {i > 0 && <div className="absolute -left-2 top-1 h-8 w-px bg-white/10" />}
                  <div>
                    <p className="text-2xl font-bold leading-none text-[#FAF0E6]">{stat.value}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-zinc-500">{stat.label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Product Mockup + Lucian Companion overlay */}
          <div className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="relative"
            >
              <ProductMockup />
            </motion.div>

            {/* Lucian Companion — below mockup on desktop */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.78, duration: 0.5, ease: 'easeOut' }}
              className="mt-4 w-[292px]"
            >
              <CompanionCard />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
