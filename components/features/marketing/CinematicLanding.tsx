'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  motion,
  animate,
  useMotionValue,
  useTransform,
  type MotionValue,
  type AnimationPlaybackControls,
} from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { TrackedCtaLink } from './TrackedCtaLink';
import { TerminalFrame } from './TerminalFrame';
import { TrajectoryMockup } from './mockups/TrajectoryMockup';
import { TodayMockup } from './mockups/TodayMockup';
import { CareerMockup } from './mockups/CareerMockup';
import { InteractiveDemo } from './InteractiveDemo';
import { MarketingNavbar } from './MarketingNavbar';
import { GrainOverlay } from './GrainOverlay';
import { FloatingParticles } from './FloatingParticles';

/**
 * CinematicLanding — PRISMA-style scroll-hijacked landing page.
 *
 * No native scrolling. Wheel events transition between "stops."
 * All progress-driven animations use MotionValues (no React re-renders during animation).
 */

const SECTION_COUNT = 6;
const TRANSITION_DURATION = 0.7;

const STOP_LABELS = ['Hero', 'Trajectory', 'Today', 'Career', 'Demo', 'Start'];

/** Maps progress (0..1) within a range to 0..1. Clamps at edges. */
function progress01(value: number, start: number, end: number): number {
  if (value <= start) return 0;
  if (value >= end) return 1;
  return (value - start) / (end - start);
}

/** Cubic ease in-out for smoother sub-animations. */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function CinematicLanding() {
  const progressMV = useMotionValue(0);
  const [activeStop, setActiveStop] = useState(0);
  const currentStopRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const animationRef = useRef<AnimationPlaybackControls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const goToStop = useCallback(
    (targetStop: number) => {
      if (targetStop < 0 || targetStop >= SECTION_COUNT) return;
      if (targetStop === currentStopRef.current && isAnimatingRef.current) return;

      const targetProgress = targetStop;
      if (Math.abs(progressMV.get() - targetProgress) < 0.01) return;

      if (animationRef.current) {
        animationRef.current.stop();
      }

      isAnimatingRef.current = true;
      currentStopRef.current = targetStop;
      setActiveStop(targetStop);

      animationRef.current = animate(progressMV, targetProgress, {
        duration: TRANSITION_DURATION,
        ease: [0.37, 0, 0.63, 1],
        onComplete: () => {
          isAnimatingRef.current = false;
        },
      });
    },
    [progressMV]
  );

  // Wheel event hijack
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let lastWheelTime = 0;
    const DEBOUNCE = 150;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelTime < DEBOUNCE) return;
      if (isAnimatingRef.current) return;

      lastWheelTime = now;
      if (e.deltaY > 0) {
        goToStop(currentStopRef.current + 1);
      } else if (e.deltaY < 0) {
        goToStop(currentStopRef.current - 1);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [goToStop]);

  // Keyboard support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isAnimatingRef.current) return;
      switch (e.key) {
        case 'ArrowDown':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          goToStop(currentStopRef.current + 1);
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          goToStop(currentStopRef.current - 1);
          break;
        case 'Home':
          e.preventDefault();
          goToStop(0);
          break;
        case 'End':
          e.preventDefault();
          goToStop(SECTION_COUNT - 1);
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goToStop]);

  // Touch support for mobile
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) touchStartY = t.clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (isAnimatingRef.current) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const delta = touchStartY - t.clientY;
      if (Math.abs(delta) > 50) {
        if (delta > 0) goToStop(currentStopRef.current + 1);
        else goToStop(currentStopRef.current - 1);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [goToStop]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-40 h-screen overflow-hidden bg-[#0A0A0C]">
      {/* Atmospheric layers */}
      <GrainOverlay />
      <FloatingParticles />

      {/* Ambient background glow — shifts with active stop */}
      <BackgroundAmbience progress={progressMV} />

      {/* Navbar */}
      <div className="relative z-50">
        <MarketingNavbar />
      </div>

      {/* Progress dots — enhanced with labels */}
      <div className="fixed right-6 top-1/2 z-50 -translate-y-1/2 flex flex-col gap-3">
        {Array.from({ length: SECTION_COUNT }).map((_, i) => (
          <button
            key={i}
            onClick={() => goToStop(i)}
            className="group/dot flex items-center gap-3"
            aria-label={`Sektion ${i + 1}: ${STOP_LABELS[i]}`}
          >
            <span
              className={`text-[9px] font-medium uppercase tracking-wider opacity-0 transition-all duration-300 group-hover/dot:opacity-100 ${
                activeStop === i ? 'text-[#E8B930]' : 'text-zinc-500'
              }`}
            >
              {STOP_LABELS[i]}
            </span>
            <span
              className={`block transition-all duration-500 ${
                activeStop === i
                  ? 'h-8 w-2 rounded-full bg-[#E8B930] shadow-[0_0_12px_rgba(232,185,48,0.4)]'
                  : 'h-2 w-2 rounded-full bg-white/20 group-hover/dot:bg-white/40'
              }`}
            />
          </button>
        ))}
      </div>

      {/* STOP 0: Hero */}
      <HeroFrame progress={progressMV} onScrollDown={() => goToStop(1)} />

      {/* STOP 1: Trajectory */}
      <FeatureFrame
        progress={progressMV}
        stop={1}
        kicker="Trajectory"
        headline="Drei Ziele. Zwei kollidieren."
        highlight="Du siehst es sofort."
        description="Backward Planning berechnet Startfenster, Buffer und Risiko für jedes Ziel. Wenn sich zwei Prep-Blöcke überlappen, zeigt INNIS die Kollision."
        terminal={
          <TerminalFrame url="innis.io/trajectory">
            <TrajectoryMockup />
          </TerminalFrame>
        }
        layout="text-left"
      />

      {/* STOP 2: Today */}
      <FeatureFrame
        progress={progressMV}
        stop={2}
        kicker="Today"
        headline="Nicht planen."
        highlight="Ausführen."
        description="Morning Briefing zieht den Kontext aus Trajectory. Der nächste Move steht fest, bevor du den Tab öffnest."
        terminal={
          <TerminalFrame url="innis.io/today">
            <TodayMockup />
          </TerminalFrame>
        }
        layout="text-right"
      />

      {/* STOP 3: Career */}
      <FeatureFrame
        progress={progressMV}
        stop={3}
        kicker="Career Intelligence"
        headline="Dein Profil kennt"
        highlight="seine Lücken."
        description="CV-Upload, Fit-Score, Gap-Analyse. Nicht blindes Bewerben — sondern der nächste sinnvolle Schritt für jede Rolle."
        terminal={
          <TerminalFrame url="innis.io/career">
            <CareerMockup />
          </TerminalFrame>
        }
        layout="text-left"
      />

      {/* STOP 4: Interactive Demo */}
      <DemoFrame progress={progressMV} />

      {/* STOP 5: CTA */}
      <CTAFrame progress={progressMV} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Background Ambience — glow position shifts per active section
   ───────────────────────────────────────────────────────────────────── */

function BackgroundAmbience({ progress }: { progress: MotionValue<number> }) {
  const glow1X = useTransform(progress, [0, 1, 2, 3, 4, 5], ['50%', '25%', '75%', '30%', '50%', '50%']);
  const glow1Y = useTransform(progress, [0, 1, 2, 3, 4, 5], ['12%', '30%', '25%', '40%', '50%', '45%']);
  const glow1Opacity = useTransform(progress, [0, 2.5, 5], [0.06, 0.04, 0.08]);

  const glow2X = useTransform(progress, [0, 1, 2, 3, 4, 5], ['8%', '70%', '20%', '65%', '40%', '50%']);
  const glow2Y = useTransform(progress, [0, 1, 2, 3, 4, 5], ['5%', '15%', '60%', '20%', '30%', '50%']);

  return (
    <div className="pointer-events-none fixed inset-0 z-[1]">
      <motion.div
        className="absolute h-[900px] w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8B930] blur-[250px]"
        style={{ left: glow1X, top: glow1Y, opacity: glow1Opacity }}
      />
      <motion.div
        className="absolute h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#DC3232] blur-[200px] opacity-[0.04]"
        style={{ left: glow2X, top: glow2Y }}
      />
      <motion.div
        className="absolute h-[400px] w-[500px] rounded-full bg-[#FF7832] blur-[180px] opacity-[0.03]"
        style={{
          right: '5%',
          top: useTransform(progress, [0, 5], ['15%', '60%']),
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Frame Components — all driven by MotionValue, zero re-renders
   ───────────────────────────────────────────────────────────────────── */

function HeroFrame({
  progress,
  onScrollDown,
}: {
  progress: MotionValue<number>;
  onScrollDown: () => void;
}) {
  const opacity = useTransform(progress, (p) => 1 - progress01(p, 0.5, 1));
  const terminalRotateX = useTransform(progress, (p) => `rotateX(${4 - progress01(p, 0, 0.3) * 4}deg)`);
  const pointerEvents = useTransform(opacity, (o) => (o > 0.1 ? 'auto' : 'none'));
  const display = useTransform(progress, (p) => (p > 1.5 ? 'none' : 'flex'));
  const heroScale = useTransform(progress, (p) => 1 - progress01(p, 0.3, 1) * 0.05);

  return (
    <motion.div
      className="fixed inset-0 z-10 flex-col"
      style={{ opacity, pointerEvents, display }}
    >
      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-20"
        style={{ scale: heroScale }}
      >
        <div className="mx-auto max-w-4xl text-center">
          {/* Kicker badge */}
          <motion.div
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#E8B930]/20 bg-[#E8B930]/[0.08] px-4 py-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E8B930] opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E8B930]" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8B930]">
              Public Beta
            </span>
            <span className="h-1 w-1 rounded-full bg-[#E8B930]/40" />
            <span className="text-[11px] uppercase tracking-[0.15em] text-[#E8B930]/70">
              Für ambitionierte Studenten
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="premium-heading text-[clamp(2.6rem,6.5vw,5.5rem)] font-semibold leading-[1.05] text-white"
          >
            Plane Thesis, GMAT
            <br />
            und Praktikum,
            <br />
            <span className="bg-gradient-to-r from-[#E8B930] via-[#F5D565] to-[#E8B930] bg-clip-text text-transparent">
              bevor sie kollidieren.
            </span>
          </motion.h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mx-auto mt-7 max-w-2xl text-[17px] leading-[1.75] text-zinc-400"
          >
            INNIS zeigt dir, wann Karriereplan, Studium und Bewerbungen aufeinanderprallen —
            und zieht daraus direkt den nächsten sinnvollen Move für heute.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
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

          {/* Trust stats strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="mt-10 flex items-center justify-center gap-8"
          >
            {[
              { value: '3', label: 'Ebenen' },
              { value: '0€', label: 'Beta' },
              { value: '<2min', label: 'Setup' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-white">{stat.value}</span>
                <span className="text-[11px] text-zinc-600">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Terminal teaser — Trajectory dashboard, perspective tilt */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-14 w-full max-w-5xl"
          style={{ perspective: 1200 }}
        >
          {/* Glow behind terminal */}
          <div className="pointer-events-none absolute -inset-10 rounded-3xl bg-[#E8B930]/[0.04] blur-[80px]" />

          <motion.div style={{ transform: terminalRotateX, transformOrigin: 'center top' }}>
            <TerminalFrame url="innis.io/trajectory">
              <TrajectoryMockup />
            </TerminalFrame>
          </motion.div>

          {/* Bottom fade — sinks into page */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0A0A0C] to-transparent" />
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 1 }}
        onClick={onScrollDown}
        className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-600 transition-colors hover:text-zinc-400"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <ChevronDown className="h-4 w-4 animate-bounce" />
      </motion.button>
    </motion.div>
  );
}

interface FeatureFrameProps {
  progress: MotionValue<number>;
  stop: number;
  kicker: string;
  headline: string;
  highlight: string;
  description: string;
  terminal: React.ReactNode;
  layout: 'text-left' | 'text-right';
}

function FeatureFrame({
  progress,
  stop,
  kicker,
  headline,
  highlight,
  description,
  terminal,
  layout,
}: FeatureFrameProps) {
  const opacity = useTransform(progress, (p) => {
    const fadeIn = easeInOutCubic(progress01(p, stop - 0.5, stop));
    const fadeOut = 1 - easeInOutCubic(progress01(p, stop + 0.5, stop + 1));
    return Math.min(fadeIn, fadeOut);
  });
  const pointerEvents = useTransform(opacity, (o) => (o > 0.5 ? 'auto' : 'none'));
  const display = useTransform(opacity, (o) => (o < 0.01 ? 'none' : 'flex'));

  // Staggered text — text arrives first
  const kickerOpacity = useTransform(progress, (p) =>
    easeInOutCubic(progress01(p, stop - 0.45, stop - 0.25))
  );
  const kickerY = useTransform(
    progress,
    (p) => 20 * (1 - easeInOutCubic(progress01(p, stop - 0.45, stop - 0.25)))
  );
  const headlineOpacity = useTransform(progress, (p) =>
    easeInOutCubic(progress01(p, stop - 0.4, stop - 0.15))
  );
  const headlineY = useTransform(
    progress,
    (p) => 25 * (1 - easeInOutCubic(progress01(p, stop - 0.4, stop - 0.15)))
  );
  const descOpacity = useTransform(progress, (p) =>
    easeInOutCubic(progress01(p, stop - 0.3, stop - 0.05))
  );
  const descY = useTransform(
    progress,
    (p) => 20 * (1 - easeInOutCubic(progress01(p, stop - 0.3, stop - 0.05)))
  );

  // Terminal arrives after text with scale-up
  const terminalOpacity = useTransform(progress, (p) =>
    easeInOutCubic(progress01(p, stop - 0.25, stop + 0.1))
  );
  const terminalY = useTransform(
    progress,
    (p) => 50 * (1 - easeInOutCubic(progress01(p, stop - 0.25, stop + 0.1)))
  );
  const terminalScale = useTransform(
    progress,
    (p) => 0.92 + 0.08 * easeInOutCubic(progress01(p, stop - 0.25, stop + 0.1))
  );

  // Gold border glow on terminal when active
  const glowOpacity = useTransform(progress, (p) => {
    const dist = Math.abs(p - stop);
    return dist < 0.3 ? (1 - dist / 0.3) * 0.6 : 0;
  });

  const textSide = (
    <div>
      <motion.p
        className="mb-5 text-[11px] font-medium uppercase tracking-[0.35em] text-[#E8B930]"
        style={{ opacity: kickerOpacity, y: kickerY }}
      >
        {kicker}
      </motion.p>
      <motion.h2
        className="premium-heading text-[clamp(1.8rem,4vw,3.2rem)] font-semibold text-white"
        style={{ opacity: headlineOpacity, y: headlineY }}
      >
        {headline}
        <br />
        <span className="bg-gradient-to-r from-[#E8B930] via-[#F5D565] to-[#E8B930] bg-clip-text text-transparent">
          {highlight}
        </span>
      </motion.h2>
      <motion.p
        className="mt-6 max-w-md text-[15px] leading-[1.8] text-zinc-500"
        style={{ opacity: descOpacity, y: descY }}
      >
        {description}
      </motion.p>
    </div>
  );

  const terminalSide = (
    <motion.div
      className="relative"
      style={{ opacity: terminalOpacity, y: terminalY, scale: terminalScale }}
    >
      {/* Gold glow ring around terminal */}
      <motion.div
        className="pointer-events-none absolute -inset-[1px] rounded-2xl"
        style={{
          opacity: glowOpacity,
          boxShadow: '0 0 30px rgba(232,185,48,0.15), inset 0 0 30px rgba(232,185,48,0.05)',
        }}
      />
      {terminal}
    </motion.div>
  );

  return (
    <motion.div
      className="fixed inset-0 z-10 items-center"
      style={{ opacity, pointerEvents, display }}
    >
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          {layout === 'text-left' ? (
            <>
              {textSide}
              {terminalSide}
            </>
          ) : (
            <>
              {terminalSide}
              {textSide}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DemoFrame({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, (p) => {
    const fadeIn = easeInOutCubic(progress01(p, 3.5, 4));
    const fadeOut = 1 - easeInOutCubic(progress01(p, 4.5, 5));
    return Math.min(fadeIn, fadeOut);
  });
  const pointerEvents = useTransform(opacity, (o) => (o > 0.5 ? 'auto' : 'none'));
  const display = useTransform(opacity, (o) => (o < 0.01 ? 'none' : 'flex'));
  const contentY = useTransform(progress, (p) => 40 * (1 - easeInOutCubic(progress01(p, 3.5, 4.1))));
  const contentScale = useTransform(
    progress,
    (p) => 0.95 + 0.05 * easeInOutCubic(progress01(p, 3.5, 4.1))
  );

  return (
    <motion.div
      className="fixed inset-0 z-10 items-center justify-center"
      style={{ opacity, pointerEvents, display }}
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8B930]/[0.04] blur-[200px]" />
      <motion.div
        className="relative z-10 mx-auto w-full max-w-3xl px-6"
        style={{ y: contentY, scale: contentScale }}
      >
        <p className="mb-4 text-center text-[11px] font-medium uppercase tracking-[0.35em] text-[#E8B930]">
          Live Beweis
        </p>
        <h2 className="premium-heading mb-12 text-center text-[clamp(1.8rem,4vw,3rem)] font-semibold text-white">
          Verschieb eine Variable.
          <br />
          <span className="text-zinc-500">Sieh, wann dein Plan kippt.</span>
        </h2>
        <InteractiveDemo />
      </motion.div>
    </motion.div>
  );
}

function CTAFrame({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, (p) => easeInOutCubic(progress01(p, 4.5, 5)));
  const display = useTransform(opacity, (o) => (o < 0.01 ? 'none' : 'flex'));
  const headlineY = useTransform(progress, (p) => 30 * (1 - easeInOutCubic(progress01(p, 4.5, 5.1))));
  const ctaScale = useTransform(
    progress,
    (p) => 0.9 + 0.1 * easeInOutCubic(progress01(p, 4.6, 5))
  );

  return (
    <motion.div
      className="fixed inset-0 z-10 items-center justify-center"
      style={{ opacity, display }}
    >
      {/* Dramatic gold glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8B930]/[0.07] blur-[220px]" />
      {/* Secondary warm glow */}
      <div className="pointer-events-none absolute left-1/2 top-[60%] h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF7832]/[0.04] blur-[160px]" />

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <motion.h2
          className="premium-heading text-[clamp(2.4rem,6vw,5rem)] font-semibold text-white"
          style={{ y: headlineY }}
        >
          Ein System.
          <br />
          Eine Linie.
          <br />
          <span className="bg-gradient-to-r from-[#E8B930] via-[#F5D565] to-[#E8B930] bg-clip-text text-transparent">
            Dein nächster Move.
          </span>
        </motion.h2>
        <motion.p
          className="mx-auto mt-8 max-w-lg text-[17px] leading-[1.7] text-zinc-500"
          style={{ y: headlineY }}
        >
          Trajectory, Today und Career in einem System. Für Studenten mit parallelen
          High-Stakes-Zielen.
        </motion.p>
        <motion.div
          className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          style={{ scale: ctaScale }}
        >
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
        </motion.div>
        <motion.p className="mt-8 text-[12px] text-zinc-600" style={{ y: headlineY }}>
          Keine Kreditkarte · Public Beta · Konto in 2 Minuten
        </motion.p>
      </div>
    </motion.div>
  );
}
