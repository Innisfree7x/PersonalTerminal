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
    const el = containerRef.current;
    if (!el) return;
    let lastWheelTime = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelTime < 150 || isAnimatingRef.current) return;
      lastWheelTime = now;
      goToStop(currentStopRef.current + (e.deltaY > 0 ? 1 : -1));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [goToStop]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isAnimatingRef.current) return;
      if (['ArrowDown', ' ', 'PageDown'].includes(e.key)) { e.preventDefault(); goToStop(currentStopRef.current + 1); }
      else if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); goToStop(currentStopRef.current - 1); }
      else if (e.key === 'Home') { e.preventDefault(); goToStop(0); }
      else if (e.key === 'End') { e.preventDefault(); goToStop(SECTION_COUNT - 1); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goToStop]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => { const t = e.touches[0]; if (t) touchStartY = t.clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      if (isAnimatingRef.current) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const delta = touchStartY - t.clientY;
      if (Math.abs(delta) > 50) goToStop(currentStopRef.current + (delta > 0 ? 1 : -1));
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => { el.removeEventListener('touchstart', onTouchStart); el.removeEventListener('touchend', onTouchEnd); };
  }, [goToStop]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-40 h-screen overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 50% 10%, rgba(232,185,48,0.07) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 20% 80%, rgba(180,40,40,0.06) 0%, transparent 55%),
          radial-gradient(ellipse 50% 35% at 80% 60%, rgba(180,40,40,0.04) 0%, transparent 55%),
          #0c0c10
        `,
      }}
    >
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
            className="group/dot flex items-center gap-3"
            aria-label={`${STOP_LABELS[i]}`}
          >
            <span className={`text-[9px] font-medium uppercase tracking-wider opacity-0 transition-all duration-300 group-hover/dot:opacity-100 ${activeStop === i ? 'text-[#E8B930]' : 'text-zinc-500'}`}>
              {STOP_LABELS[i]}
            </span>
            <span className={`block transition-all duration-500 ${activeStop === i ? 'h-8 w-2 rounded-full bg-[#E8B930]' : 'h-2 w-2 rounded-full bg-white/20 group-hover/dot:bg-white/40'}`} />
          </button>
        ))}
      </div>

      <HeroFrame progress={progressMV} onScrollDown={() => goToStop(1)} />

      <FeatureFrame progress={progressMV} stop={1} kicker="Trajectory"
        headline="Drei Ziele. Zwei kollidieren." highlight="Du siehst es sofort."
        description="Backward Planning berechnet Startfenster, Buffer und Risiko für jedes Ziel. Wenn sich zwei Prep-Blöcke überlappen, zeigt INNIS die Kollision."
        terminal={<TerminalFrame url="innis.io/trajectory"><TrajectoryMockup /></TerminalFrame>}
        layout="text-left" />

      <FeatureFrame progress={progressMV} stop={2} kicker="Today"
        headline="Nicht planen." highlight="Ausführen."
        description="Morning Briefing zieht den Kontext aus Trajectory. Der nächste Move steht fest, bevor du den Tab öffnest."
        terminal={<TerminalFrame url="innis.io/today"><TodayMockup /></TerminalFrame>}
        layout="text-right" />

      <FeatureFrame progress={progressMV} stop={3} kicker="Career Intelligence"
        headline="Dein Profil kennt" highlight="seine Lücken."
        description="CV-Upload, Fit-Score, Gap-Analyse. Nicht blindes Bewerben — sondern der nächste sinnvolle Schritt für jede Rolle."
        terminal={<TerminalFrame url="innis.io/career"><CareerMockup /></TerminalFrame>}
        layout="text-left" />

      <DemoFrame progress={progressMV} />
      <CTAFrame progress={progressMV} />
    </div>
  );
}

/* ─── Frames — only opacity + transform, nothing else ─── */

function HeroFrame({ progress, onScrollDown }: { progress: MotionValue<number>; onScrollDown: () => void }) {
  const opacity = useTransform(progress, (p) => 1 - progress01(p, 0.5, 1));
  const pointerEvents = useTransform(opacity, (o) => (o > 0.1 ? 'auto' : 'none'));
  const display = useTransform(progress, (p) => (p > 1.5 ? 'none' : 'flex'));

  return (
    <motion.div className="fixed inset-0 z-10 flex-col" style={{ opacity, pointerEvents, display }}>
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#E8B930]/20 bg-[#E8B930]/[0.08] px-4 py-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E8B930] opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E8B930]" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8B930]">Public Beta</span>
            <span className="h-1 w-1 rounded-full bg-[#E8B930]/40" />
            <span className="text-[11px] uppercase tracking-[0.15em] text-[#E8B930]/70">Für ambitionierte Studenten</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="premium-heading text-[clamp(2.6rem,6.5vw,5.5rem)] font-semibold leading-[1.05] text-white"
          >
            Plane Thesis, GMAT<br />und Praktikum,<br />
            <span className="bg-gradient-to-r from-[#E8B930] via-[#F5D565] to-[#E8B930] bg-clip-text text-transparent">bevor sie kollidieren.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mx-auto mt-7 max-w-2xl text-[17px] leading-[1.75] text-zinc-400"
          >
            INNIS zeigt dir, wann Karriereplan, Studium und Bewerbungen aufeinanderprallen —
            und zieht daraus direkt den nächsten sinnvollen Move für heute.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <TrackedCtaLink href="/auth/signup" eventName="landing_cta_primary_clicked" eventPayload={{ source: 'hero', variant: 'primary' }} className="premium-cta-primary">
              Kostenlos starten <ArrowRight className="h-4 w-4" />
            </TrackedCtaLink>
            <TrackedCtaLink href="/auth/login" eventName="landing_cta_secondary_clicked" eventPayload={{ source: 'hero', variant: 'login' }} className="premium-cta-secondary">
              Login
            </TrackedCtaLink>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="mt-10 flex items-center justify-center gap-8"
          >
            {[{ value: '3', label: 'Ebenen' }, { value: '0€', label: 'Beta' }, { value: '<2min', label: 'Setup' }].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-white">{stat.value}</span>
                <span className="text-[11px] text-zinc-600">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-14 w-full max-w-5xl"
        >
          <TerminalFrame url="innis.io/trajectory">
            <TrajectoryMockup />
          </TerminalFrame>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0c0c10] to-transparent" />
        </motion.div>
      </div>

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

function FeatureFrame({ progress, stop, kicker, headline, highlight, description, terminal, layout }: FeatureFrameProps) {
  const opacity = useTransform(progress, (p) => {
    const fadeIn = easeInOutCubic(progress01(p, stop - 0.5, stop));
    const fadeOut = 1 - easeInOutCubic(progress01(p, stop + 0.5, stop + 1));
    return Math.min(fadeIn, fadeOut);
  });
  const pointerEvents = useTransform(opacity, (o) => (o > 0.5 ? 'auto' : 'none'));
  const display = useTransform(opacity, (o) => (o < 0.01 ? 'none' : 'flex'));

  // Text: only opacity + y
  const textOpacity = useTransform(progress, (p) => easeInOutCubic(progress01(p, stop - 0.4, stop - 0.1)));
  const textY = useTransform(progress, (p) => 25 * (1 - easeInOutCubic(progress01(p, stop - 0.4, stop - 0.1))));

  // Terminal: slightly later, only opacity + y
  const terminalOpacity = useTransform(progress, (p) => easeInOutCubic(progress01(p, stop - 0.25, stop + 0.1)));
  const terminalY = useTransform(progress, (p) => 40 * (1 - easeInOutCubic(progress01(p, stop - 0.25, stop + 0.1))));

  const textSide = (
    <motion.div style={{ opacity: textOpacity, y: textY }}>
      <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.35em] text-[#E8B930]">{kicker}</p>
      <h2 className="premium-heading text-[clamp(1.8rem,4vw,3.2rem)] font-semibold text-white">
        {headline}<br />
        <span className="bg-gradient-to-r from-[#E8B930] via-[#F5D565] to-[#E8B930] bg-clip-text text-transparent">{highlight}</span>
      </h2>
      <p className="mt-6 max-w-md text-[15px] leading-[1.8] text-zinc-500">{description}</p>
    </motion.div>
  );

  const terminalSide = (
    <motion.div style={{ opacity: terminalOpacity, y: terminalY }}>{terminal}</motion.div>
  );

  return (
    <motion.div className="fixed inset-0 z-10 items-center" style={{ opacity, pointerEvents, display }}>
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
  const display = useTransform(opacity, (o) => (o < 0.01 ? 'none' : 'flex'));
  const contentY = useTransform(progress, (p) => 30 * (1 - easeInOutCubic(progress01(p, 3.5, 4.1))));

  return (
    <motion.div className="fixed inset-0 z-10 items-center justify-center" style={{ opacity, pointerEvents, display }}>
      <motion.div className="relative z-10 mx-auto w-full max-w-3xl px-6" style={{ y: contentY }}>
        <p className="mb-4 text-center text-[11px] font-medium uppercase tracking-[0.35em] text-[#E8B930]">Live Beweis</p>
        <h2 className="premium-heading mb-12 text-center text-[clamp(1.8rem,4vw,3rem)] font-semibold text-white">
          Verschieb eine Variable.<br /><span className="text-zinc-500">Sieh, wann dein Plan kippt.</span>
        </h2>
        <InteractiveDemo />
      </motion.div>
    </motion.div>
  );
}

function CTAFrame({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, (p) => easeInOutCubic(progress01(p, 4.5, 5)));
  const display = useTransform(opacity, (o) => (o < 0.01 ? 'none' : 'flex'));
  const headlineY = useTransform(progress, (p) => 25 * (1 - easeInOutCubic(progress01(p, 4.5, 5.1))));

  return (
    <motion.div className="fixed inset-0 z-10 items-center justify-center" style={{ opacity, display }}>
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <motion.h2 className="premium-heading text-[clamp(2.4rem,6vw,5rem)] font-semibold text-white" style={{ y: headlineY }}>
          Ein System.<br />Eine Linie.<br />
          <span className="bg-gradient-to-r from-[#E8B930] via-[#F5D565] to-[#E8B930] bg-clip-text text-transparent">Dein nächster Move.</span>
        </motion.h2>
        <motion.p className="mx-auto mt-8 max-w-lg text-[17px] leading-[1.7] text-zinc-500" style={{ y: headlineY }}>
          Trajectory, Today und Career in einem System. Für Studenten mit parallelen High-Stakes-Zielen.
        </motion.p>
        <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <TrackedCtaLink href="/auth/signup" eventName="landing_cta_primary_clicked" eventPayload={{ source: 'footer_cta', variant: 'primary' }} className="premium-cta-primary">
            Kostenlos starten <ArrowRight className="h-4 w-4" />
          </TrackedCtaLink>
          <TrackedCtaLink href="/auth/login" eventName="landing_cta_secondary_clicked" eventPayload={{ source: 'footer_cta', variant: 'login' }} className="premium-cta-secondary">
            Login
          </TrackedCtaLink>
        </div>
        <p className="mt-8 text-[12px] text-zinc-600">Keine Kreditkarte · Public Beta · Konto in 2 Minuten</p>
      </div>
    </motion.div>
  );
}
