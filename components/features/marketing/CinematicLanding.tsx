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
 * No native scrolling. Wheel events transition between "stops."
 * All progress-driven animations use MotionValues (no React re-renders during animation).
 */

const SECTION_COUNT = 6;
const TRANSITION_DURATION = 0.7;
const HERO_PROOFS = [
  {
    value: '36M',
    label: 'Strategischer Horizont',
    detail: 'Thesis, GMAT und Praktika laufen in einem echten Zeitplan zusammen.',
  },
  {
    value: '<3 Min',
    label: 'Bis zum ersten Risiko',
    detail: 'Die erste Kollision ist sichtbar, bevor du irgendetwas manuell planst.',
  },
  {
    value: '1 Move',
    label: 'Jeden Morgen klar',
    detail: 'Trajectory, Today und Career ziehen denselben nächsten Schritt.',
  },
] as const;

const TRAJECTORY_PROOFS = [
  { value: 'Startfenster', label: 'Prep beginnt nicht implizit, sondern an einem sichtbaren Datum.' },
  { value: 'Buffer', label: 'Puffer ist Teil des Plans statt stille Hoffnung.' },
  { value: 'Kollision', label: 'Overlaps werden erkannt, bevor Deadlines kippen.' },
] as const;

const TODAY_PROOFS = [
  { value: 'Morning Brief', label: 'Strategie wird vor dem ersten Klick in Tagesklarheit übersetzt.' },
  { value: 'Next Move', label: 'Keine tote Task-Liste, sondern ein priorisierter erster Zug.' },
  { value: 'Focus ready', label: 'Vom Brief direkt in Fokus und Ausführung.' },
] as const;

const CAREER_PROOFS = [
  { value: 'Fit', label: 'Radar zeigt nicht nur Treffer, sondern relevante Chancen.' },
  { value: 'Gap', label: 'Die schwächste Stelle im Profil ist sofort sichtbar.' },
  { value: 'Action', label: 'Jede Lücke wird in einen konkreten nächsten Schritt übersetzt.' },
] as const;

const CTA_PROOFS = [
  'Trajectory erkennt Kollisionen, bevor sie teuer werden.',
  'Today macht aus Strategie einen täglichen klaren Move.',
  'Career Intelligence verwandelt Rollen in konkrete Prep-Schritte.',
] as const;

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
              activeStop === i ? 'scale-125 bg-[#E8B930]' : 'bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Sektion ${i + 1}`}
          />
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
        proofs={TRAJECTORY_PROOFS}
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
        proofs={TODAY_PROOFS}
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
        proofs={CAREER_PROOFS}
      />

      {/* STOP 4: Interactive Demo */}
      <DemoFrame progress={progressMV} />

      {/* STOP 5: CTA */}
      <CTAFrame progress={progressMV} />
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

  return (
    <motion.div
      className="fixed inset-0 z-10 flex-col"
      style={{ opacity, pointerEvents, display }}
    >
      {/* Atmospheric glows */}
      <div className="pointer-events-none absolute left-1/2 top-[15%] h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-[#E8B930]/[0.07] blur-[180px]" />
      <div className="pointer-events-none absolute left-[10%] top-[5%] h-[400px] w-[400px] rounded-full bg-[#DC3232]/[0.06] blur-[150px]" />
      <div className="pointer-events-none absolute right-[5%] top-[20%] h-[350px] w-[400px] rounded-full bg-[#FF7832]/[0.04] blur-[130px]" />

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(900px 600px at 50% 20%, #000 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(900px 600px at 50% 20%, #000 20%, transparent 80%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-1 items-center px-6 pt-24">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <div className="max-w-2xl text-left">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E8B930]/20 bg-[#E8B930]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#E8B930]"
            >
              Public Beta
              <span className="h-1 w-1 rounded-full bg-[#E8B930]/70" />
              Für ambitionierte Studenten
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="premium-heading text-[clamp(2.8rem,7vw,6rem)] font-semibold text-white"
            >
              Plane Thesis,
              <br />
              GMAT und Praktikum,
              <br />
              <span className="bg-gradient-to-r from-[#E8B930] via-[#F5D565] to-[#E8B930] bg-clip-text text-transparent">
                bevor sie kollidieren.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.85 }}
              className="mt-6 max-w-xl text-[17px] leading-[1.8] text-zinc-400"
            >
              INNIS zeigt dir, wann Karriereplan, Studium und Bewerbungen aufeinanderprallen —
              und zieht daraus direkt den nächsten sinnvollen Move für heute.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.05 }}
              className="mt-10 flex flex-col items-start gap-4 sm:flex-row"
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.25 }}
              className="mt-10 grid gap-3 sm:grid-cols-3"
            >
              {HERO_PROOFS.map((proof, index) => (
                <div
                  key={proof.label}
                  className={`rounded-2xl border px-4 py-4 backdrop-blur-xl ${
                    index === 0
                      ? 'border-[#E8B930]/18 bg-[#E8B930]/[0.06]'
                      : 'border-white/[0.08] bg-white/[0.03]'
                  }`}
                >
                  <p className="text-[1.55rem] font-semibold tracking-[-0.03em] text-white">{proof.value}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {proof.label}
                  </p>
                  <p className="mt-2 text-[12px] leading-relaxed text-zinc-400">{proof.detail}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full"
            style={{ perspective: 1200 }}
          >
            <div className="pointer-events-none absolute -left-10 top-10 h-40 w-40 rounded-full bg-[#DC3232]/10 blur-[90px]" />
            <div className="pointer-events-none absolute -right-10 top-0 h-56 w-56 rounded-full bg-[#E8B930]/10 blur-[120px]" />
            <div className="pointer-events-none absolute bottom-6 left-1/3 h-32 w-48 rounded-full bg-sky-500/8 blur-[90px]" />

            <div className="relative mx-auto max-w-[860px]">
              <motion.div style={{ transform: terminalRotateX, transformOrigin: 'center top' }}>
                <TerminalFrame url="innis.io/trajectory" className="rounded-[28px]">
                  <TrajectoryMockup />
                </TerminalFrame>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.55, duration: 0.7 }}
                className="absolute -left-5 top-8 hidden max-w-[220px] rounded-2xl border border-emerald-400/18 bg-[#0D1712]/80 p-4 backdrop-blur-2xl md:block"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">Morning Brief</p>
                <p className="mt-2 text-sm font-semibold text-[#FAF0E6]">GMAT ist on track.</p>
                <p className="mt-1 text-[12px] leading-relaxed text-zinc-400">Prep startet 09.11.2026. Heute zählt ein klarer Move.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.75, duration: 0.7 }}
                className="absolute -right-6 bottom-10 hidden max-w-[240px] rounded-2xl border border-sky-400/18 bg-[#0C1118]/82 p-4 backdrop-blur-2xl lg:block"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300">Career Signal</p>
                <p className="mt-2 text-sm font-semibold text-[#FAF0E6]">M&amp;A Advisory ist realistisch.</p>
                <p className="mt-1 text-[12px] leading-relaxed text-zinc-400">Radar erkennt Fit, Gap und den nächsten sinnvollen Prep-Schritt.</p>
              </motion.div>

              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/70 to-transparent" />
            </div>
          </motion.div>
        </div>
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
  proofs: readonly { value: string; label: string }[];
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
  proofs,
}: FeatureFrameProps) {
  const opacity = useTransform(progress, (p) => {
    const fadeIn = easeInOutCubic(progress01(p, stop - 0.5, stop));
    const fadeOut = 1 - easeInOutCubic(progress01(p, stop + 0.5, stop + 1));
    return Math.min(fadeIn, fadeOut);
  });
  const pointerEvents = useTransform(opacity, (o) => (o > 0.5 ? 'auto' : 'none'));
  const display = useTransform(opacity, (o) => (o < 0.01 ? 'none' : 'flex'));

  const kickerOpacity = useTransform(progress, (p) =>
    easeInOutCubic(progress01(p, stop - 0.4, stop - 0.2))
  );
  const headlineOpacity = useTransform(progress, (p) =>
    easeInOutCubic(progress01(p, stop - 0.35, stop - 0.1))
  );
  const descOpacity = useTransform(progress, (p) =>
    easeInOutCubic(progress01(p, stop - 0.25, stop))
  );
  const terminalOpacity = useTransform(progress, (p) =>
    easeInOutCubic(progress01(p, stop - 0.3, stop + 0.1))
  );
  const terminalY = useTransform(
    progress,
    (p) => 40 * (1 - easeInOutCubic(progress01(p, stop - 0.3, stop + 0.1)))
  );

  const textSide = (
    <div>
      <motion.p
        className="mb-5 text-[11px] font-medium uppercase tracking-[0.35em] text-[#E8B930]"
        style={{ opacity: kickerOpacity }}
      >
        {kicker}
      </motion.p>
      <motion.h2
        className="premium-heading text-[clamp(1.8rem,4vw,3.2rem)] font-semibold text-white"
        style={{ opacity: headlineOpacity }}
      >
        {headline}
        <br />
        <span className="bg-gradient-to-r from-[#E8B930] via-[#F5D565] to-[#E8B930] bg-clip-text text-transparent">
          {highlight}
        </span>
      </motion.h2>
      <motion.p
        className="mt-6 max-w-md text-[15px] leading-[1.8] text-zinc-500"
        style={{ opacity: descOpacity }}
      >
        {description}
      </motion.p>
      <motion.div className="mt-8 grid gap-3 sm:grid-cols-3" style={{ opacity: descOpacity }}>
        {proofs.map((proof, index) => (
          <div
            key={proof.value}
            className={`rounded-2xl border px-4 py-4 ${
              index === 0
                ? 'border-[#E8B930]/18 bg-[#E8B930]/[0.05]'
                : 'border-white/[0.08] bg-white/[0.025]'
            }`}
          >
            <p className="text-[13px] font-semibold text-[#FAF0E6]">{proof.value}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">{proof.label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );

  const terminalSide = (
    <motion.div style={{ opacity: terminalOpacity, y: terminalY }}>{terminal}</motion.div>
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

  return (
    <motion.div
      className="fixed inset-0 z-10 items-center justify-center"
      style={{ opacity, pointerEvents, display }}
    >
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
    </motion.div>
  );
}

function CTAFrame({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, (p) => easeInOutCubic(progress01(p, 4.5, 5)));
  const display = useTransform(opacity, (o) => (o < 0.01 ? 'none' : 'flex'));

  return (
    <motion.div
      className="fixed inset-0 z-10 items-center justify-center"
      style={{ opacity, display }}
    >
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
          Trajectory, Today und Career in einem System. Für Studenten mit parallelen
          High-Stakes-Zielen.
        </p>
        <div className="mt-10 grid gap-3 text-left sm:grid-cols-3">
          {CTA_PROOFS.map((proof, index) => (
            <div
              key={proof}
              className={`rounded-2xl border px-4 py-4 ${
                index === 1 ? 'border-[#E8B930]/18 bg-[#E8B930]/[0.06]' : 'border-white/[0.08] bg-white/[0.03]'
              }`}
            >
              <p className="text-[12px] leading-relaxed text-zinc-300">{proof}</p>
            </div>
          ))}
        </div>
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
    </motion.div>
  );
}
