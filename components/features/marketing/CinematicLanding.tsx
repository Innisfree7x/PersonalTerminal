'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  motion,
  animate,
  useReducedMotion,
  useMotionValue,
  useTransform,
  type MotionValue,
  type AnimationPlaybackControls,
} from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { TrackedCtaLink } from './TrackedCtaLink';
import { TerminalFrame } from './TerminalFrame';
import { TrajectoryMockup } from './mockups/TrajectoryMockup';
import { LucianSpriteAnimator } from '@/components/features/lucian/LucianSpriteAnimator';
import { TodayMockup } from './mockups/TodayMockup';
import { CareerMockup } from './mockups/CareerMockup';
import { InteractiveDemo } from './InteractiveDemo';
import { MarketingNavbar } from './MarketingNavbar';
import { HeroProofTeaser } from './HeroProofTeaser';
import { CinematicLandingStacked } from './CinematicLandingStacked';
import { landingThemeStyle } from './landingTheme';

/**
 * CinematicLanding — PRISMA-style scroll-hijacked landing page.
 *
 * Performance-first: ZERO CSS blur, ZERO canvas, ZERO SVG filters.
 * Only opacity + transform animations (GPU-composited, zero repaints).
 */

const SECTION_COUNT = 6;
const TRANSITION_DURATION = 0.7;
const STOP_LABELS = ['Hero', 'Trajectory', 'Today', 'Career', 'Demo', 'Start'];

function progress01(value: number, start: number, end: number): number {
  if (value <= start) return 0;
  if (value >= end) return 1;
  return (value - start) / (end - start);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && target.closest('[data-landing-interactive="true"]') !== null;
}

export function CinematicLanding() {
  const progressMV = useMotionValue(0);
  const shouldReduceMotion = useReducedMotion();
  const [activeStop, setActiveStop] = useState(0);
  const [isCompactExperience, setIsCompactExperience] = useState(shouldReduceMotion);
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
      if (animationRef.current) animationRef.current.stop();
      isAnimatingRef.current = true;
      currentStopRef.current = targetStop;
      setActiveStop(targetStop);
      animationRef.current = animate(progressMV, targetProgress, {
        duration: TRANSITION_DURATION,
        ease: [0.37, 0, 0.63, 1],
        onComplete: () => { isAnimatingRef.current = false; },
      });
    },
    [progressMV]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const updateExperience = () => {
      setIsCompactExperience(mediaQuery.matches || shouldReduceMotion);
    };

    updateExperience();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateExperience);
      return () => mediaQuery.removeEventListener('change', updateExperience);
    }

    mediaQuery.addListener(updateExperience);
    return () => mediaQuery.removeListener(updateExperience);
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (isCompactExperience) return;

    const el = containerRef.current;
    if (!el) return;
    let lastWheelTime = 0;
    const onWheel = (e: WheelEvent) => {
      if (isInteractiveTarget(e.target)) return;

      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelTime < 150 || isAnimatingRef.current) return;
      lastWheelTime = now;
      goToStop(currentStopRef.current + (e.deltaY > 0 ? 1 : -1));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [goToStop, isCompactExperience]);

  useEffect(() => {
    if (isCompactExperience) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isInteractiveTarget(document.activeElement)) return;
      if (isAnimatingRef.current) return;
      if (['ArrowDown', ' ', 'PageDown'].includes(e.key)) { e.preventDefault(); goToStop(currentStopRef.current + 1); }
      else if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); goToStop(currentStopRef.current - 1); }
      else if (e.key === 'Home') { e.preventDefault(); goToStop(0); }
      else if (e.key === 'End') { e.preventDefault(); goToStop(SECTION_COUNT - 1); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goToStop, isCompactExperience]);

  useEffect(() => {
    if (isCompactExperience) return;

    const el = containerRef.current;
    if (!el) return;
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => { const t = e.touches[0]; if (t) touchStartY = t.clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      if (isInteractiveTarget(e.target)) return;
      if (isAnimatingRef.current) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const delta = touchStartY - t.clientY;
      if (Math.abs(delta) > 50) goToStop(currentStopRef.current + (delta > 0 ? 1 : -1));
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => { el.removeEventListener('touchstart', onTouchStart); el.removeEventListener('touchend', onTouchEnd); };
  }, [goToStop, isCompactExperience]);

  if (isCompactExperience) {
    return <CinematicLandingStacked />;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-40 h-screen overflow-hidden"
      style={{ ...landingThemeStyle, background: '#020204' }}
    >
      {/* Obsidian Grid + Flow background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px),
            radial-gradient(ellipse 72% 52% at 50% -10%, rgba(232,185,48,0.13) 0%, transparent 70%),
            radial-gradient(ellipse 52% 42% at 10% 80%, rgba(220,56,56,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 42% 36% at 90% 40%, rgba(245,158,11,0.07) 0%, transparent 60%)
          `,
          backgroundSize: '80px 80px, 80px 80px, 100% 100%, 100% 100%, 100% 100%',
        }}
      />

      {/* Navbar */}
      <div className="relative z-50">
        <MarketingNavbar activeStop={activeStop} />
      </div>

      {/* Progress dots */}
      <div className="fixed right-3 top-1/2 z-50 flex w-12 -translate-y-1/2 flex-col items-center gap-3 sm:right-6 sm:w-16">
        {Array.from({ length: SECTION_COUNT }).map((_, i) => (
          <button
            key={i}
            onClick={() => goToStop(i)}
            className="group/dot relative flex h-8 w-8 items-center justify-center md:w-12"
            aria-label={`${STOP_LABELS[i]}`}
          >
            <span className={`pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap font-mono text-[9px] uppercase tracking-wider transition-all duration-300 md:block ${activeStop === i ? 'translate-x-0 opacity-100 text-primary' : 'translate-x-1 opacity-0 text-zinc-500 group-hover/dot:translate-x-0 group-hover/dot:opacity-100 group-hover/dot:text-white/70'}`}>
              {STOP_LABELS[i]}
            </span>
            <span className={`block transition-all duration-500 ${activeStop === i ? 'h-8 w-1 rounded-full bg-primary shadow-[0_0_12px_rgba(232,185,48,0.42)]' : 'h-1.5 w-1.5 rounded-full bg-white/10 group-hover/dot:bg-white/30'}`} />
          </button>
        ))}
      </div>

      <HeroFrame progress={progressMV} onScrollDown={() => goToStop(1)} />

      <FeatureFrame progress={progressMV} stop={1} kicker="Trajectory"
        headline="Ziele kollidieren." highlight="INNIS klärt."
        description="Backward Planning berechnet Startfenster, Buffer und Risiko. Wenn Thesis, GMAT und Praktikum aufeinandertreffen, siehst du die Lösung, nicht das Problem."
        terminal={<TerminalFrame url="innis.io/trajectory"><TrajectoryMockup /></TerminalFrame>}
        layout="text-left" />

      <FeatureFrame progress={progressMV} stop={2} kicker="Daily Core"
        headline="Execution" highlight="ohne Reibung."
        description="Kein Planungs-Overhead mehr. Today Morning Briefing zieht den Kontext aus deinen Langzeitzielen und liefert den nächsten Move."
        terminal={<TerminalFrame url="innis.io/today"><TodayMockup /></TerminalFrame>}
        layout="text-right" />

      <FeatureFrame progress={progressMV} stop={3} kicker="Intelligence"
        headline="Dein Profil," highlight="automatisiert."
        description="Gap-Analyse und Opportunity Radar. INNIS identifiziert Lücken in deinem CV und zeigt dir den direkten Pfad zu deinem nächsten Ziel."
        terminal={<TerminalFrame url="innis.io/career"><CareerMockup /></TerminalFrame>}
        layout="text-left" />

      <DemoFrame progress={progressMV} />
      <CTAFrame progress={progressMV} />
    </div>
  );
}

/* ─── Frames ─── */

function HeroFrame({ progress, onScrollDown }: { progress: MotionValue<number>; onScrollDown: () => void }) {
  const opacity = useTransform(progress, (p) => 1 - progress01(p, 0.5, 1));
  const pointerEvents = useTransform(opacity, (o) => (o > 0.1 ? 'auto' : 'none'));

  return (
    <motion.div className="fixed inset-0 z-10 flex flex-col" style={{ opacity, pointerEvents }}>
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">System stable</span>
            <span className="h-3 w-px bg-primary/20" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary/70">Public Beta v4.4</span>
          </div>

          <h1 className="premium-heading text-[clamp(2.6rem,6.5vw,5.5rem)] font-semibold text-white">
            Sieh den Konflikt,<br />
            <span className="bg-gradient-to-r from-[#FAF0E6] via-[#E8B930] to-[#DC3232] bg-clip-text text-transparent">bevor er dich trifft.</span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-[17px] leading-[1.75] text-zinc-500">
            Thesis, GMAT und Praktikum laufen parallel — und keiner weiß vom anderen.<br className="hidden md:block" />
            INNIS zeigt dir die Kollision, bevor sie passiert.
          </p>

          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <TrackedCtaLink href="/auth/signup" eventName="landing_cta_primary_clicked" eventPayload={{ source: 'hero', variant: 'primary' }} className="premium-cta-primary bg-primary text-black hover:shadow-[0_0_30px_rgba(232,185,48,0.28)]">
              System starten <ArrowRight className="h-4 w-4" />
            </TrackedCtaLink>
            <TrackedCtaLink href="/auth/login" eventName="landing_cta_secondary_clicked" eventPayload={{ source: 'hero', variant: 'login' }} className="premium-cta-secondary border-white/5 bg-white/[0.02]">
              Login
            </TrackedCtaLink>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            {[
              { value: '847', label: 'Studenten' },
              { value: 'Ø 23 min', label: 'täglich' },
              { value: 'seit WS 24/25', label: '' },
            ].map((chip) => (
              <div key={chip.value} className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1">
                <span className="font-mono text-[11px] font-medium text-white/70">{chip.value}</span>
                {chip.label && <span className="font-mono text-[11px] text-zinc-600">{chip.label}</span>}
              </div>
            ))}</div>

          <div className="mx-auto mt-10 w-full max-w-3xl">
            <HeroProofTeaser />
          </div>
        </div>

        <div className="relative mx-auto mt-16 w-full max-w-5xl">
          <TerminalFrame url="innis.io/trajectory">
            <TrajectoryMockup />
          </TerminalFrame>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#020204] to-transparent" />
          {/* Lucian ambient */}
          <div className="pointer-events-none absolute bottom-8 right-6 opacity-60">
            <LucianSpriteAnimator animation="idle" size={56} />
          </div>
        </div>
      </div>

      <button
        onClick={onScrollDown}
        className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-600 transition-colors hover:text-zinc-400"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.4em]">Initialize</span>
        <ChevronDown className="h-4 w-4 animate-bounce" />
      </button>
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

function FeatureFrame({ progress, stop, kicker, headline, highlight, description, terminal, layout }: FeatureFrameProps) {
  const opacity = useTransform(progress, (p) => {
    const fadeIn = easeInOutCubic(progress01(p, stop - 0.5, stop));
    const fadeOut = 1 - easeInOutCubic(progress01(p, stop + 0.5, stop + 1));
    return Math.min(fadeIn, fadeOut);
  });
  const pointerEvents = useTransform(opacity, (o) => (o > 0.5 ? 'auto' : 'none'));

  const textOpacity = useTransform(progress, (p) => easeInOutCubic(progress01(p, stop - 0.4, stop - 0.1)));
  const textY = useTransform(progress, (p) => 25 * (1 - easeInOutCubic(progress01(p, stop - 0.4, stop - 0.1))));

  const terminalOpacity = useTransform(progress, (p) => easeInOutCubic(progress01(p, stop - 0.25, stop + 0.1)));
  const terminalY = useTransform(progress, (p) => 40 * (1 - easeInOutCubic(progress01(p, stop - 0.25, stop + 0.1))));

  const textSide = (
    <motion.div style={{ opacity: textOpacity, y: textY }}>
      <p className="mb-5 font-mono text-[11px] font-medium uppercase tracking-[0.4em] text-primary">{kicker}</p>
      <h2 className="premium-heading text-[clamp(1.8rem,4vw,3.2rem)] font-semibold text-white">
        {headline}<br />
        <span className="bg-gradient-to-r from-[#FAF0E6] via-[#E8B930] to-[#DC3232] bg-clip-text text-transparent">{highlight}</span>
      </h2>
      <p className="mt-8 max-w-md text-[16px] leading-[1.8] text-zinc-500">{description}</p>
    </motion.div>
  );

  const terminalSide = (
    <motion.div style={{ opacity: terminalOpacity, y: terminalY }}>{terminal}</motion.div>
  );

  return (
    <motion.div className="fixed inset-0 z-10 flex items-center" style={{ opacity, pointerEvents }}>
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          {layout === 'text-left' ? <>{textSide}{terminalSide}</> : <>{terminalSide}{textSide}</>}
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
  const contentY = useTransform(progress, (p) => 30 * (1 - easeInOutCubic(progress01(p, 3.5, 4.1))));

  return (
    <motion.div className="fixed inset-0 z-10 flex items-center justify-center" style={{ opacity, pointerEvents }}>
      <motion.div className="relative z-10 mx-auto w-full max-w-3xl px-6" style={{ y: contentY }}>
        <p className="mb-4 text-center font-mono text-[11px] font-medium uppercase tracking-[0.4em] text-primary">Live Engine</p>
        <h2 className="premium-heading mb-12 text-center text-[clamp(1.8rem,4vw,3rem)] font-semibold text-white">
          Verschieb eine Variable.<br /><span className="text-zinc-500">Sieh, wie der Plan atmet.</span>
        </h2>
        <InteractiveDemo />
      </motion.div>
    </motion.div>
  );
}

function CTAFrame({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, (p) => easeInOutCubic(progress01(p, 4.5, 5)));
  const pointerEvents = useTransform(opacity, (o) => (o > 0.5 ? 'auto' : 'none'));
  const headlineY = useTransform(progress, (p) => 25 * (1 - easeInOutCubic(progress01(p, 4.5, 5.1))));

  return (
    <motion.div className="fixed inset-0 z-10 flex items-center justify-center" style={{ opacity, pointerEvents }}>
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <motion.h2 className="premium-heading text-[clamp(2.4rem,6vw,5rem)] font-semibold text-white" style={{ y: headlineY }}>
          Wann kollidieren<br />
              <span className="bg-gradient-to-r from-[#FAF0E6] via-[#E8B930] to-[#DC3232] bg-clip-text text-transparent">deine nächsten Ziele?</span>
        </motion.h2>
        <motion.p className="mx-auto mt-10 max-w-lg text-[17px] leading-[1.7] text-zinc-500" style={{ y: headlineY }}>
          Trajectory, Today und Career Intelligence vereint. Die Antwort bekommst du in unter 2 Minuten.
        </motion.p>
        <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <TrackedCtaLink href="/auth/signup" eventName="landing_cta_primary_clicked" eventPayload={{ source: 'footer_cta', variant: 'primary' }} className="premium-cta-primary bg-primary text-black hover:shadow-[0_0_40px_rgba(232,185,48,0.34)]">
            System starten <ArrowRight className="h-4 w-4" />
          </TrackedCtaLink>
          <TrackedCtaLink href="/auth/login" eventName="landing_cta_secondary_clicked" eventPayload={{ source: 'footer_cta', variant: 'login' }} className="premium-cta-secondary border-white/5 bg-white/[0.02]">
            Login
          </TrackedCtaLink>
        </div>
        <p className="mt-12 font-mono text-[10px] uppercase tracking-widest text-zinc-600">Secure · Public Beta · Setup &lt; 2 min</p>
      </div>
    </motion.div>
  );
}
