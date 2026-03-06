'use client';

import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ProductMockup } from './ProductMockup';
import { TrackedCtaLink } from './TrackedCtaLink';
import { trackMarketingEvent } from '@/lib/analytics/marketing';
import {
  formatTrajectoryRiskLabel,
  getDaysUntilDate,
  simulateTrajectoryGoalPreview,
} from '@/lib/trajectory/risk-model';

export function HeroSection() {
  const [capacityHoursPerWeek, setCapacityHoursPerWeek] = useState(18);
  const [effortHours, setEffortHours] = useState(520);
  const trackedSimulationRef = useRef(false);
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

  const statusClasses =
    preview.status === 'on_track'
      ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
      : preview.status === 'tight'
        ? 'border-amber-500/35 bg-amber-500/10 text-amber-300'
        : 'border-red-500/35 bg-red-500/10 text-red-300';

  const trackSimulationOnce = (nextCapacity: number, nextEffort: number) => {
    if (trackedSimulationRef.current) return;
    trackedSimulationRef.current = true;
    const nextPreview = simulateTrajectoryGoalPreview({
      dueDate,
      effortHours: nextEffort,
      bufferWeeks: 2,
      capacityHoursPerWeek: nextCapacity,
    });
    void trackMarketingEvent('hero_simulated', {
      source: 'hero_proof',
      hours_per_week: nextCapacity,
      effort_hours: nextEffort,
      status: nextPreview.status,
    });
  };

  return (
    <section className="relative overflow-hidden pb-0 pt-10 md:pt-14">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[15%] h-[420px] w-[420px] rounded-full bg-red-500/8 blur-[120px]" />
        <div className="absolute right-[-8%] top-[8%] h-[360px] w-[360px] rounded-full bg-yellow-500/6 blur-[120px]" />
      </div>

      <div className="marketing-container relative z-10 w-full">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.1fr] xl:gap-14">

          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-3.5 md:space-y-4"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-yellow-500/25 bg-yellow-500/10 px-3.5 py-1.5"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
              <span className="text-xs font-semibold tracking-wide text-yellow-300">Public Beta · Für ambitionierte Studenten</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="font-sans text-[clamp(2.2rem,4.5vw,3.8rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[#FAF0E6]"
            >
              Plane Bachelor,
              <br />
              GMAT und Praktikum{' '}
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                in einer Timeline.
              </span>
            </motion.h1>

            {/* Subline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="premium-subtext max-w-md text-[1rem] leading-relaxed"
            >
              INNIS zeigt dir sofort, ob dein Karriere-Plan realistisch ist:
              Thesis, GMAT, Master-Apps und Praktika in einem strategischen Zeitplan.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34 }}
              className="text-lg font-semibold tracking-tight text-[#FAF0E6] md:text-xl"
            >
              Eine Timeline.{' '}
              <span className="text-zinc-500">Ein Daily-Flow.</span>
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
                Zur Waitlist
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
              <span className="premium-chip">Trajectory Planner</span>
              <span className="premium-chip">2-Min Activation</span>
              <span className="premium-chip">Waitlist geöffnet</span>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="premium-card-soft grid grid-cols-3 gap-4 rounded-2xl p-4"
            >
              {[
                { value: 'Bis zu -47%', label: '30-Tage Deadline-Risiko' },
                { value: '+7 h/Woche', label: 'Fokuszeit pro Woche' },
                { value: '86% Konsistenz', label: 'Weekly Next-Move Clarity' },
              ].map((stat, i) => (
                <div key={i} className="relative">
                  {i > 0 && <div className="absolute -left-2 top-1 h-8 w-px bg-white/10" />}
                  <div>
                    <p className="text-lg font-bold leading-none text-[#FAF0E6]">{stat.value}</p>
                    <p className="mt-1 text-[11px] leading-snug text-zinc-500">{stat.label}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.58 }}
              className="premium-card-soft rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Interactive Proof
                </p>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClasses}`}>
                  {formatTrajectoryRiskLabel(preview.status)}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="flex items-center justify-between text-[11px] text-zinc-500">
                    Kapazität
                    <span className="font-semibold text-zinc-300">{capacityHoursPerWeek}h/Woche</span>
                  </span>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={1}
                    value={capacityHoursPerWeek}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value);
                      setCapacityHoursPerWeek(nextValue);
                      trackSimulationOnce(nextValue, effortHours);
                    }}
                    className="mt-1.5 w-full accent-[rgb(239,68,68)]"
                  />
                </label>

                <label className="block">
                  <span className="flex items-center justify-between text-[11px] text-zinc-500">
                    Aufwand
                    <span className="font-semibold text-zinc-300">{effortHours}h</span>
                  </span>
                  <input
                    type="range"
                    min={120}
                    max={900}
                    step={10}
                    value={effortHours}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value);
                      setEffortHours(nextValue);
                      trackSimulationOnce(capacityHoursPerWeek, nextValue);
                    }}
                    className="mt-1.5 w-full accent-[rgb(234,179,8)]"
                  />
                </label>
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-xs">
                <p className="text-zinc-300">
                  GMAT Deadline: <span className="font-semibold text-[#FAF0E6]">{dueDays} Tage</span>
                  {' · '}Prep Start: <span className="font-semibold text-[#FAF0E6]">{prepStartLabel}</span>
                </p>
                <p className="mt-1 text-zinc-500">
                  Benötigt: {preview.requiredWeeks} Wochen · Buffer: 2 Wochen
                </p>
              </div>
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
