'use client';

import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { TrackedCtaLink } from './TrackedCtaLink';
import { trackMarketingEvent } from '@/lib/analytics/marketing';
import {
  formatTrajectoryRiskLabel,
  getDaysUntilDate,
  simulateTrajectoryGoalPreview,
} from '@/lib/trajectory/risk-model';

const signals = ['Thesis', 'GMAT', 'Praktikum', 'Master-Apps'];

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

  const statusColor =
    preview.status === 'on_track'
      ? { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400' }
      : preview.status === 'tight'
        ? { border: 'border-[#D4AF37]/30', bg: 'bg-[#D4AF37]/10', text: 'text-[#D4AF37]' }
        : { border: 'border-red-500/30', bg: 'bg-red-500/10', text: 'text-red-400' };

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
    <section className="relative overflow-hidden pt-24 pb-20 md:pt-36 md:pb-32">
      {/* Subtle gold ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[20%] h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.04] blur-[120px]" />
      </div>

      <div className="marketing-container relative z-10">
        {/* Centered hero content */}
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/[0.06] px-4 py-1.5"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#D4AF37]" />
            <span className="text-xs font-medium tracking-wide text-[#D4AF37]">
              Public Beta
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="premium-heading mt-8 text-[clamp(2.6rem,6.5vw,5.4rem)] font-semibold text-[#FAF0E6]"
          >
            Erkenne Kollisionen
            <br />
            in deinem Karriereplan,{' '}
            <span className="bg-gradient-to-r from-[#D4AF37] via-[#E0C068] to-[#D4AF37] bg-clip-text text-transparent">
              bevor sie passieren.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl"
          >
            INNIS verbindet Thesis, GMAT, Master-Apps und Praktika in einer Timeline
            und übersetzt Risiko direkt in den nächsten sinnvollen Tageszug.
          </motion.p>

          {/* Signal chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-6 flex flex-wrap justify-center gap-2"
          >
            {signals.map((s) => (
              <span key={s} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-xs text-zinc-400">
                {s}
              </span>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
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
        </div>

        {/* Interactive Trajectory Simulator */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          className="mx-auto mt-20 max-w-3xl"
        >
          <div className="premium-card rounded-2xl p-6 md:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D4AF37]">
                  Live Simulator
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Teste, ab wann dein Plan kippt.
                </p>
              </div>
              <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${statusColor.border} ${statusColor.bg} ${statusColor.text}`}>
                {formatTrajectoryRiskLabel(preview.status)}
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Controls */}
              <div className="space-y-5">
                <label className="block">
                  <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                    Kapazität
                    <span className="font-semibold text-zinc-300">{capacityHoursPerWeek}h/Woche</span>
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
                      trackSimulationOnce(v, effortHours);
                    }}
                    className="mt-2 w-full accent-[#D4AF37]"
                  />
                </label>

                <label className="block">
                  <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                    Aufwand
                    <span className="font-semibold text-zinc-300">{effortHours}h</span>
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
                      trackSimulationOnce(capacityHoursPerWeek, v);
                    }}
                    className="mt-2 w-full accent-[#D4AF37]"
                  />
                </label>
              </div>

              {/* Results */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="space-y-3">
                  {[
                    { label: 'Deadline', value: `${dueDays} Tage` },
                    { label: 'Prep Start', value: prepStartLabel },
                    { label: 'Benötigte Wochen', value: String(preview.requiredWeeks) },
                    { label: 'Buffer', value: '2 Wochen' },
                  ].map((row, i) => (
                    <div key={row.label} className={`flex items-center justify-between ${i < 3 ? 'border-b border-white/[0.06] pb-3' : ''}`}>
                      <span className="text-sm text-zinc-500">{row.label}</span>
                      <span className="text-sm font-semibold text-[#FAF0E6]">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
