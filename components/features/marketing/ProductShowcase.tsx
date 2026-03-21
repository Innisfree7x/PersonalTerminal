'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useMemo, useState } from 'react';
import {
  formatTrajectoryRiskLabel,
  getDaysUntilDate,
  simulateTrajectoryGoalPreview,
} from '@/lib/trajectory/risk-model';
import { trackMarketingEvent } from '@/lib/analytics/marketing';
import { TerminalFrame } from './TerminalFrame';
import { TodayMockup } from './mockups/TodayMockup';
import { CareerMockup } from './mockups/CareerMockup';

/**
 * ProductShowcase — Today + Career terminals + interactive trajectory demo.
 *
 * Each feature gets its own scroll section with text + terminal mockup.
 */

/* ── Today Section ─────────────────────────────────────────────────── */

function TodaySection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const textOpacity = useTransform(scrollYProgress, [0.1, 0.25, 0.7, 0.85], [0, 1, 1, 0]);
  const textY = useTransform(scrollYProgress, [0.1, 0.25], [50, 0]);
  const terminalOpacity = useTransform(scrollYProgress, [0.15, 0.35, 0.7, 0.85], [0, 1, 1, 0]);
  const terminalY = useTransform(scrollYProgress, [0.15, 0.35], [80, 0]);
  const terminalRotateY = useTransform(scrollYProgress, [0.15, 0.4], [-8, 0]);

  return (
    <section ref={ref} className="relative min-h-[150vh] py-32">
      <div className="sticky top-0 flex min-h-screen items-center">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            {/* Terminal (left this time) */}
            <TerminalFrame
              url="innis.io/today"
              style={{
                opacity: terminalOpacity,
                y: terminalY,
                rotateY: terminalRotateY,
                perspective: 1200,
              }}
            >
              <TodayMockup />
            </TerminalFrame>

            {/* Text side (right) */}
            <motion.div style={{ opacity: textOpacity, y: textY }}>
              <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.35em] text-[#E8B930]">
                Today
              </p>
              <h2 className="premium-heading text-[clamp(1.8rem,4vw,3.2rem)] font-semibold text-white">
                Nicht planen.
                <br />
                <span className="bg-gradient-to-r from-[#E8B930] via-[#F5D565] to-[#E8B930] bg-clip-text text-transparent">
                  Ausführen.
                </span>
              </h2>
              <p className="mt-6 max-w-md text-[15px] leading-[1.8] text-zinc-500">
                Morning Briefing zieht den Kontext aus Trajectory.
                Der nächste Move steht fest, bevor du den Tab öffnest.
                Keine To-do-Liste — ein Ausführungssystem.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Career Section ────────────────────────────────────────────────── */

function CareerSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const textOpacity = useTransform(scrollYProgress, [0.1, 0.25, 0.7, 0.85], [0, 1, 1, 0]);
  const textY = useTransform(scrollYProgress, [0.1, 0.25], [50, 0]);
  const terminalOpacity = useTransform(scrollYProgress, [0.15, 0.35, 0.7, 0.85], [0, 1, 1, 0]);
  const terminalY = useTransform(scrollYProgress, [0.15, 0.35], [80, 0]);
  const terminalRotateY = useTransform(scrollYProgress, [0.15, 0.4], [8, 0]);

  return (
    <section ref={ref} className="relative min-h-[150vh] py-32">
      <div className="sticky top-0 flex min-h-screen items-center">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            {/* Text side (left) */}
            <motion.div style={{ opacity: textOpacity, y: textY }}>
              <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.35em] text-[#E8B930]">
                Career Intelligence
              </p>
              <h2 className="premium-heading text-[clamp(1.8rem,4vw,3.2rem)] font-semibold text-white">
                Dein Profil kennt
                <br />
                <span className="bg-gradient-to-r from-[#E8B930] via-[#F5D565] to-[#E8B930] bg-clip-text text-transparent">
                  seine Lücken.
                </span>
              </h2>
              <p className="mt-6 max-w-md text-[15px] leading-[1.8] text-zinc-500">
                CV-Upload, Fit-Score, Gap-Analyse. Nicht blindes Bewerben —
                sondern der nächste sinnvolle Schritt für jede Rolle.
                Du siehst Passung, Lücken und konkreten Handlungsbedarf.
              </p>
            </motion.div>

            {/* Terminal (right) */}
            <TerminalFrame
              url="innis.io/career"
              style={{
                opacity: terminalOpacity,
                y: terminalY,
                rotateY: terminalRotateY,
                perspective: 1200,
              }}
            >
              <CareerMockup />
            </TerminalFrame>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Interactive Trajectory Demo ───────────────────────────────────── */

function TrajectoryDemo() {
  const [capacityHoursPerWeek, setCapacityHoursPerWeek] = useState(18);
  const [effortHours, setEffortHours] = useState(520);
  const trackedRef = useRef(false);
  const dueDate = '2027-03-01';

  const preview = useMemo(
    () =>
      simulateTrajectoryGoalPreview({
        dueDate,
        effortHours,
        bufferWeeks: 2,
        capacityHoursPerWeek,
      }),
    [capacityHoursPerWeek, effortHours]
  );

  const dueDays = useMemo(() => getDaysUntilDate(dueDate), [dueDate]);
  const prepStartLabel = useMemo(() => {
    const parsed = new Date(`${preview.startDate}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) return preview.startDate;
    return parsed.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }, [preview.startDate]);

  const statusColor =
    preview.status === 'on_track'
      ? 'text-emerald-400'
      : preview.status === 'tight'
        ? 'text-[#E8B930]'
        : 'text-red-400';

  const trackOnce = (cap: number, eff: number) => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    const p = simulateTrajectoryGoalPreview({
      dueDate,
      effortHours: eff,
      bufferWeeks: 2,
      capacityHoursPerWeek: cap,
    });
    void trackMarketingEvent('hero_simulated', {
      source: 'showcase_demo',
      hours_per_week: cap,
      effort_hours: eff,
      status: p.status,
    });
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8B930]/[0.03] blur-[180px]" />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
        >
          <p className="mb-4 text-center text-[11px] font-medium uppercase tracking-[0.35em] text-[#E8B930]">
            Live Beweis
          </p>
          <h2 className="premium-heading mb-16 text-center text-[clamp(1.8rem,4vw,3rem)] font-semibold text-white">
            Verschieb eine Variable.
            <br />
            <span className="text-zinc-500">Sieh, wann dein Plan kippt.</span>
          </h2>

          <TerminalFrame url="innis.io/trajectory/simulate">
            <div className="p-6 md:p-8">
              {/* Sliders */}
              <div className="space-y-8">
                <label className="block">
                  <span className="flex items-center justify-between text-[12px] uppercase tracking-[0.14em] text-zinc-500">
                    Kapazität
                    <span className="text-[20px] font-semibold tracking-tight text-white">{capacityHoursPerWeek}h / Woche</span>
                  </span>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={1}
                    value={capacityHoursPerWeek}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setCapacityHoursPerWeek(v);
                      trackOnce(v, effortHours);
                    }}
                    className="mt-4 w-full accent-[#E8B930]"
                  />
                </label>

                <label className="block">
                  <span className="flex items-center justify-between text-[12px] uppercase tracking-[0.14em] text-zinc-500">
                    Gesamtaufwand
                    <span className="text-[20px] font-semibold tracking-tight text-white">{effortHours}h</span>
                  </span>
                  <input
                    type="range"
                    min={120}
                    max={900}
                    step={10}
                    value={effortHours}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setEffortHours(v);
                      trackOnce(capacityHoursPerWeek, v);
                    }}
                    className="mt-4 w-full accent-[#E8B930]"
                  />
                </label>
              </div>

              {/* Divider */}
              <div className="my-8 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

              {/* Results */}
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
                {[
                  { label: 'Status', value: formatTrajectoryRiskLabel(preview.status), className: statusColor },
                  { label: 'Prep Start', value: prepStartLabel, className: 'text-white' },
                  { label: 'Deadline', value: `${dueDays}d`, className: 'text-white' },
                  { label: 'Wochen', value: String(preview.requiredWeeks), className: 'text-white' },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                      {item.label}
                    </span>
                    <span className={`mt-2 block text-[18px] font-semibold tracking-tight ${item.className}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TerminalFrame>
        </motion.div>
      </div>
    </section>
  );
}

/* ── Export ─────────────────────────────────────────────────────────── */

export function ProductShowcase() {
  return (
    <>
      <TodaySection />
      <CareerSection />
      <TrajectoryDemo />
    </>
  );
}
