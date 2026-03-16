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
      ? { border: 'border-emerald-500/25', bg: 'bg-emerald-500/8', text: 'text-emerald-400' }
      : preview.status === 'tight'
        ? { border: 'border-[#E8B930]/25', bg: 'bg-[#E8B930]/8', text: 'text-[#E8B930]' }
        : { border: 'border-red-500/25', bg: 'bg-red-500/8', text: 'text-red-400' };

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
    <>
      {/* Hero — full viewport */}
      <section className="relative flex min-h-[calc(100dvh-64px)] flex-col items-center justify-center overflow-hidden px-6">
        {/* Ambient glows — gold center, red accent left */}
        <div className="pointer-events-none absolute left-1/2 top-[25%] h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8B930]/[0.08] blur-[150px]" />
        <div className="pointer-events-none absolute left-[15%] top-[20%] h-[400px] w-[400px] rounded-full bg-[#DC3232]/[0.08] blur-[130px]" />
        <div className="pointer-events-none absolute right-[10%] top-[30%] h-[300px] w-[350px] rounded-full bg-[#FF7832]/[0.05] blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          {/* Shimmer badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10 inline-flex"
          >
            <span className="shimmer-badge inline-flex items-center gap-2.5 rounded-full border border-[#E8B930]/15 bg-[#E8B930]/[0.05] px-4 py-2">
              <span className="h-[6px] w-[6px] animate-pulse rounded-full bg-[#E8B930]" />
              <span className="text-[12px] font-medium tracking-[0.08em] text-[#E8B930]/90">
                Public Beta
              </span>
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.7 }}
            className="premium-heading text-[clamp(3rem,7.5vw,6.5rem)] font-semibold text-[#FAF0E6]"
          >
            Erkenne Kollisionen
            <br />
            in deinem Karriereplan,{' '}
            <span className="bg-gradient-to-r from-[#E8B930] via-[#F5D565] to-[#E8B930] bg-clip-text italic text-transparent">
              bevor sie passieren.
            </span>
          </motion.h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mx-auto mt-8 max-w-xl text-[17px] leading-[1.7] text-zinc-400"
          >
            INNIS verbindet Thesis, GMAT, Master-Apps und Praktika in einer Timeline
            und übersetzt Risiko direkt in den nächsten sinnvollen Tageszug.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
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
              Bereits angemeldet? Login
            </TrackedCtaLink>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-20"
          >
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="mx-auto h-10 w-[1px] bg-gradient-to-b from-[#E8B930]/50 to-transparent"
            />
          </motion.div>
        </div>
      </section>

      {/* Interactive Simulator — separate section below fold */}
      <section className="relative py-24 md:py-32">
        <div className="premium-divider" />

        <div className="mx-auto mt-16 max-w-3xl px-6 sm:px-10">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-10 text-center">
              <p className="premium-kicker">Interaktiver Beweis</p>
              <h2 className="premium-heading text-[clamp(1.8rem,4vw,3rem)] font-semibold text-[#FAF0E6]">
                Teste, ab wann dein Plan kippt.
              </h2>
            </div>

            <div className="premium-card rounded-2xl p-6 md:p-8">
              <div className="mb-6 flex items-center justify-end">
                <span className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-semibold ${statusColor.border} ${statusColor.bg} ${statusColor.text}`}>
                  {formatTrajectoryRiskLabel(preview.status)}
                </span>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                {/* Controls */}
                <div className="space-y-6">
                  <label className="block">
                    <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                      Kapazität
                      <span className="font-semibold text-zinc-400">{capacityHoursPerWeek}h / Woche</span>
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
                      className="mt-3 w-full accent-[#E8B930]"
                    />
                  </label>

                  <label className="block">
                    <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                      Gesamtaufwand
                      <span className="font-semibold text-zinc-400">{effortHours}h</span>
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
                      className="mt-3 w-full accent-[#E8B930]"
                    />
                  </label>
                </div>

                {/* Results */}
                <div className="space-y-0 rounded-xl border border-white/[0.05] bg-white/[0.015]">
                  {[
                    { label: 'Deadline', value: `${dueDays} Tage` },
                    { label: 'Prep Start', value: prepStartLabel },
                    { label: 'Benötigte Wochen', value: String(preview.requiredWeeks) },
                    { label: 'Buffer', value: '2 Wochen' },
                  ].map((row, i) => (
                    <div
                      key={row.label}
                      className={`flex items-center justify-between px-5 py-3.5 ${i < 3 ? 'border-b border-white/[0.04]' : ''}`}
                    >
                      <span className="text-[13px] text-zinc-500">{row.label}</span>
                      <span className="text-[13px] font-medium text-[#FAF0E6]">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
