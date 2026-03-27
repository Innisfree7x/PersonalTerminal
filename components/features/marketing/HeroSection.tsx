'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { TrackedCtaLink } from './TrackedCtaLink';
import { TerminalFrame } from './TerminalFrame';
import { TrajectoryMockup } from './mockups/TrajectoryMockup';

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden pb-0 pt-28 md:pt-36">
      {/* Atmospheric glows */}
      <div className="pointer-events-none absolute left-1/2 top-[15%] h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-[#E8B930]/[0.07] blur-[180px]" />
      <div className="pointer-events-none absolute left-[10%] top-[5%] h-[400px] w-[400px] rounded-full bg-[#DC3232]/[0.06] blur-[150px]" />
      <div className="pointer-events-none absolute right-[5%] top-[20%] h-[350px] w-[400px] rounded-full bg-[#FF7832]/[0.04] blur-[130px]" />

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(900px 600px at 50% 20%, #000 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(900px 600px at 50% 20%, #000 20%, transparent 80%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10">
        {/* Text content — centered */}
        <div className="mx-auto max-w-4xl text-center">
          {/* Kicker */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mb-7 text-[11px] font-medium uppercase tracking-[0.35em] text-zinc-500"
          >
            Career Intelligence System
          </motion.p>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="premium-heading text-[clamp(2.6rem,6.5vw,5.5rem)] font-semibold text-white"
          >
            Sieh den Konflikt,
            <br />
            <span className="bg-gradient-to-r from-[#E8B930] via-[#F5D565] to-[#E8B930] bg-clip-text text-transparent">
              bevor er dich trifft.
            </span>
          </motion.h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mx-auto mt-6 max-w-2xl text-[17px] leading-[1.7] text-zinc-500"
          >
            INNIS zeigt dir, wann Thesis, GMAT und Bewerbungen kollidieren — und gibt dir
            den nächsten Move, nicht das nächste Dashboard.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
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
              Login
            </TrackedCtaLink>
          </motion.div>
        </div>

        {/* Terminal teaser — Trajectory dashboard, perspective tilt, fades out at bottom */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-16 max-w-5xl"
          style={{ perspective: 1200 }}
        >
          {/* Gold glow behind terminal */}
          <div className="pointer-events-none absolute -inset-8 rounded-3xl bg-[#E8B930]/[0.04] blur-[60px]" />

          <div style={{ transform: 'rotateX(4deg)', transformOrigin: 'center top' }}>
            <TerminalFrame url="innis.io/trajectory">
              <TrajectoryMockup />
            </TerminalFrame>
          </div>

          {/* Bottom fade — creates "sinking into page" effect */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0c0d14] to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
