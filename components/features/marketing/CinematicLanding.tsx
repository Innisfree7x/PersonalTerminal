'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, animate, type AnimationPlaybackControls } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { TrackedCtaLink } from './TrackedCtaLink';
import { TerminalFrame } from './TerminalFrame';
import { TrajectoryMockup } from './mockups/TrajectoryMockup';
import { TodayMockup } from './mockups/TodayMockup';
import { CareerMockup } from './mockups/CareerMockup';
import { InteractiveDemo } from './InteractiveDemo';
import { MarketingNavbar } from './MarketingNavbar';

/**
 * CinematicLanding — PRISMA-style scroll-hijacked landing page.
 *
 * No native scrolling. Wheel events transition between "stops."
 * Each stop is a full-viewport frame with progress-driven animations.
 *
 * Uses Framer Motion `animate()` instead of GSAP for tweening.
 */

const SECTION_COUNT = 6;
const TRANSITION_DURATION = 0.7; // seconds per transition

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
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const currentStopRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const animationRef = useRef<AnimationPlaybackControls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const goToStop = useCallback((targetStop: number) => {
    if (targetStop < 0 || targetStop >= SECTION_COUNT) return;
    if (targetStop === currentStopRef.current && isAnimatingRef.current) return;

    const targetProgress = targetStop;
    if (Math.abs(progressRef.current - targetProgress) < 0.01) return;

    // Kill any running animation
    if (animationRef.current) {
      animationRef.current.stop();
    }

    isAnimatingRef.current = true;
    currentStopRef.current = targetStop;

    const obj = { value: progressRef.current };
    animationRef.current = animate(obj.value, targetProgress, {
      duration: TRANSITION_DURATION,
      ease: [0.37, 0, 0.63, 1], // sine-ish ease
      onUpdate: (v) => {
        progressRef.current = v;
        setProgress(v);
      },
      onComplete: () => {
        isAnimatingRef.current = false;
      },
    });
  }, []);

  // Wheel event hijack
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let lastWheelTime = 0;
    const DEBOUNCE = 150; // ms between wheel transitions

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

  const p = progress; // shorthand

  return (
    <div ref={containerRef} className="fixed inset-0 z-40 h-screen overflow-hidden bg-[#0A0A0C]">
      {/* Navbar */}
      <div className="relative z-50">
        <MarketingNavbar />
      </div>

      {/* Progress dots */}
      <div className="fixed right-6 top-1/2 z-50 -translate-y-1/2 flex flex-col gap-3">
        {Array.from({ length: SECTION_COUNT }).map((_, i) => (
          <button
            key={i}
            onClick={() => goToStop(i)}
            className={`h-2 w-2 rounded-full transition-all duration-500 ${
              Math.round(p) === i
                ? 'scale-125 bg-[#E8B930]'
                : 'bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Sektion ${i + 1}`}
          />
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          STOP 0: Hero
          ═══════════════════════════════════════════════════════════════════ */}
      <HeroFrame progress={p} onScrollDown={() => goToStop(1)} />

      {/* ═══════════════════════════════════════════════════════════════════
          STOP 1: Trajectory
          ═══════════════════════════════════════════════════════════════════ */}
      <FeatureFrame
        progress={p}
        stop={1}
        kicker="Trajectory"
        headline="Drei Ziele. Zwei kollidieren."
        highlight="Du siehst es sofort."
        description="Backward Planning berechnet Startfenster, Buffer und Risiko für jedes Ziel. Wenn sich zwei Prep-Blöcke überlappen, zeigt INNIS die Kollision."
        terminal={<TerminalFrame url="innis.io/trajectory"><TrajectoryMockup /></TerminalFrame>}
        layout="text-left"
      />

      {/* ═══════════════════════════════════════════════════════════════════
          STOP 2: Today
          ═══════════════════════════════════════════════════════════════════ */}
      <FeatureFrame
        progress={p}
        stop={2}
        kicker="Today"
        headline="Nicht planen."
        highlight="Ausführen."
        description="Morning Briefing zieht den Kontext aus Trajectory. Der nächste Move steht fest, bevor du den Tab öffnest."
        terminal={<TerminalFrame url="innis.io/today"><TodayMockup /></TerminalFrame>}
        layout="text-right"
      />

      {/* ═══════════════════════════════════════════════════════════════════
          STOP 3: Career
          ═══════════════════════════════════════════════════════════════════ */}
      <FeatureFrame
        progress={p}
        stop={3}
        kicker="Career Intelligence"
        headline="Dein Profil kennt"
        highlight="seine Lücken."
        description="CV-Upload, Fit-Score, Gap-Analyse. Nicht blindes Bewerben — sondern der nächste sinnvolle Schritt für jede Rolle."
        terminal={<TerminalFrame url="innis.io/career"><CareerMockup /></TerminalFrame>}
        layout="text-left"
      />

      {/* ═══════════════════════════════════════════════════════════════════
          STOP 4: Interactive Demo + Metrics
          ═══════════════════════════════════════════════════════════════════ */}
      <DemoFrame progress={p} />

      {/* ═══════════════════════════════════════════════════════════════════
          STOP 5: CTA
          ═══════════════════════════════════════════════════════════════════ */}
      <CTAFrame progress={p} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Frame Components
   ───────────────────────────────────────────────────────────────────── */

function HeroFrame({ progress, onScrollDown }: { progress: number; onScrollDown: () => void }) {
  const fadeOut = 1 - progress01(progress, 0.5, 1);
  const terminalY = progress01(progress, 0, 0.3);

  if (progress > 1.5) return null;

  return (
    <div className="fixed inset-0 z-10 flex flex-col" style={{ opacity: fadeOut }}>
      {/* Atmospheric glows */}
      <div className="pointer-events-none absolute left-1/2 top-[15%] h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-[#E8B930]/[0.07] blur-[180px]" />
      <div className="pointer-events-none absolute left-[10%] top-[5%] h-[400px] w-[400px] rounded-full bg-[#DC3232]/[0.06] blur-[150px]" />
      <div className="pointer-events-none absolute right-[5%] top-[20%] h-[350px] w-[400px] rounded-full bg-[#FF7832]/[0.04] blur-[130px]" />

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(900px 600px at 50% 20%, #000 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(900px 600px at 50% 20%, #000 20%, transparent 80%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mb-7 text-[11px] font-medium uppercase tracking-[0.35em] text-zinc-500"
          >
            Career Intelligence System
          </motion.p>

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

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mx-auto mt-6 max-w-2xl text-[17px] leading-[1.7] text-zinc-500"
          >
            INNIS zeigt dir, wann Thesis, GMAT und Bewerbungen kollidieren — und gibt dir
            den nächsten Move, nicht das nächste Dashboard.
          </motion.p>

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

        {/* Terminal teaser — slides up as user scrolls */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-14 w-full max-w-5xl"
          style={{ perspective: 1200 }}
        >
          <div
            className="pointer-events-none absolute -inset-8 rounded-3xl bg-[#E8B930]/[0.04] blur-[60px]"
          />
          <div
            style={{
              transform: `rotateX(${4 - terminalY * 4}deg)`,
              transformOrigin: 'center top',
            }}
          >
            <TerminalFrame url="innis.io/trajectory">
              <TrajectoryMockup />
            </TerminalFrame>
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0A0A0C] to-transparent" />
        </motion.div>
      </div>

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
    </div>
  );
}

interface FeatureFrameProps {
  progress: number;
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
  const fadeIn = easeInOutCubic(progress01(progress, stop - 0.5, stop));
  const fadeOut = 1 - easeInOutCubic(progress01(progress, stop + 0.5, stop + 1));
  const opacity = Math.min(fadeIn, fadeOut);

  // Staggered entrances
  const textP = progress01(progress, stop - 0.4, stop);
  const kickerO = easeInOutCubic(progress01(progress, stop - 0.4, stop - 0.2));
  const headlineO = easeInOutCubic(progress01(progress, stop - 0.35, stop - 0.1));
  const descO = easeInOutCubic(progress01(progress, stop - 0.25, stop));
  const terminalO = easeInOutCubic(progress01(progress, stop - 0.3, stop + 0.1));
  const terminalSlide = 40 * (1 - easeInOutCubic(progress01(progress, stop - 0.3, stop + 0.1)));

  if (opacity < 0.01) return null;

  const textSide = (
    <div style={{ opacity: textP > 0 ? 1 : 0 }}>
      <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.35em] text-[#E8B930]" style={{ opacity: kickerO }}>
        {kicker}
      </p>
      <h2 className="premium-heading text-[clamp(1.8rem,4vw,3.2rem)] font-semibold text-white" style={{ opacity: headlineO }}>
        {headline}
        <br />
        <span className="bg-gradient-to-r from-[#E8B930] via-[#F5D565] to-[#E8B930] bg-clip-text text-transparent">
          {highlight}
        </span>
      </h2>
      <p className="mt-6 max-w-md text-[15px] leading-[1.8] text-zinc-500" style={{ opacity: descO }}>
        {description}
      </p>
    </div>
  );

  const terminalSide = (
    <div style={{ opacity: terminalO, transform: `translateY(${terminalSlide}px)` }}>
      {terminal}
    </div>
  );

  return (
    <div className="fixed inset-0 z-10 flex items-center" style={{ opacity, pointerEvents: opacity > 0.5 ? 'auto' : 'none' }}>
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
    </div>
  );
}

function DemoFrame({ progress }: { progress: number }) {
  const fadeIn = easeInOutCubic(progress01(progress, 3.5, 4));
  const fadeOut = 1 - easeInOutCubic(progress01(progress, 4.5, 5));
  const opacity = Math.min(fadeIn, fadeOut);

  if (opacity < 0.01) return null;

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center" style={{ opacity, pointerEvents: opacity > 0.5 ? 'auto' : 'none' }}>
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8B930]/[0.03] blur-[180px]" />
      <div className="relative z-10 mx-auto w-full max-w-3xl px-6">
        <p className="mb-4 text-center text-[11px] font-medium uppercase tracking-[0.35em] text-[#E8B930]">
          Live Beweis
        </p>
        <h2 className="premium-heading mb-12 text-center text-[clamp(1.8rem,4vw,3rem)] font-semibold text-white">
          Verschieb eine Variable.
          <br />
          <span className="text-zinc-500">Sieh, wann dein Plan kippt.</span>
        </h2>
        <InteractiveDemo />
      </div>
    </div>
  );
}

function CTAFrame({ progress }: { progress: number }) {
  const fadeIn = easeInOutCubic(progress01(progress, 4.5, 5));
  const opacity = fadeIn;

  if (opacity < 0.01) return null;

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center" style={{ opacity }}>
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8B930]/[0.06] blur-[200px]" />
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <h2 className="premium-heading text-[clamp(2.4rem,6vw,5rem)] font-semibold text-white">
          Ein System.
          <br />
          Eine Linie.
          <br />
          <span className="bg-gradient-to-r from-[#E8B930] via-[#F5D565] to-[#E8B930] bg-clip-text text-transparent">
            Dein nächster Move.
          </span>
        </h2>
        <p className="mx-auto mt-8 max-w-lg text-[17px] leading-[1.7] text-zinc-500">
          Trajectory, Today und Career in einem System.
          Für Studenten mit parallelen High-Stakes-Zielen.
        </p>
        <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
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
        </div>
        <p className="mt-8 text-[12px] text-zinc-600">
          Keine Kreditkarte · Public Beta · Konto in 2 Minuten
        </p>
      </div>
    </div>
  );
}
