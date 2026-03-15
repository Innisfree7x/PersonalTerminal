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

const storySignals = ['Thesis', 'GMAT', 'Praktikum', 'Master-Apps'];

const principleCards = [
  {
    label: 'Strategie',
    title: 'Rueckwaerts von echten Deadlines.',
    detail: 'INNIS berechnet Startpunkte, Buffer und Kollisionen deterministisch statt nach Bauchgefuehl.',
  },
  {
    label: 'Execution',
    title: 'Heute klarer als gestern.',
    detail: 'Trajectory wird morgens in einen konkreten Move uebersetzt, nicht in neue Dashboard-Unruhe.',
  },
];

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
    <section className="relative overflow-hidden pb-8 pt-10 md:pb-14 md:pt-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[10%] h-[360px] w-[360px] rounded-full bg-red-500/9 blur-[110px]" />
        <div className="absolute right-[-4%] top-[0%] h-[280px] w-[280px] rounded-full bg-yellow-500/8 blur-[100px]" />
      </div>

      <div className="marketing-container relative z-10 w-full">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] xl:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/8 px-3.5 py-1.5"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
              <span className="text-xs font-semibold tracking-[0.12em] text-yellow-300">
                Public Beta · Trajectory-first fuer ambitionierte Studenten
              </span>
            </motion.div>

            <div className="space-y-5">
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="premium-heading max-w-4xl text-[clamp(2.8rem,7vw,5.8rem)] font-semibold text-[#FAF0E6]"
              >
                Erkenne Kollisionen in deinem Karriereplan,
                <span className="block bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  bevor sie passieren.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28 }}
                className="premium-subtext max-w-2xl text-[1.02rem] md:text-lg"
              >
                INNIS verbindet Thesis, GMAT, Master-Apps und Praktika in einer einzigen Timeline
                und uebersetzt Risiko direkt in den naechsten sinnvollen Tageszug.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.34 }}
                className="flex flex-wrap items-center gap-2.5 text-sm text-zinc-400"
              >
                {storySignals.map((signal) => (
                  <span key={signal} className="premium-chip">
                    {signal}
                  </span>
                ))}
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }}
                className="text-lg font-semibold tracking-tight text-[#FAF0E6] md:text-xl"
              >
                Eine Timeline. <span className="text-zinc-500">Ein Daily-Flow.</span>
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.44 }}
              className="flex flex-col gap-3 sm:flex-row"
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="grid gap-4 md:grid-cols-2"
            >
              {principleCards.map((item) => (
                <div key={item.label} className="premium-card-soft rounded-2xl p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {item.label}
                  </p>
                  <p className="mt-3 text-lg font-semibold tracking-tight text-[#FAF0E6]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {item.detail}
                  </p>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.56 }}
              className="premium-card rounded-[1.75rem] p-5 md:p-6"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Interactive Proof
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Teste direkt im Hero, ab wann dein Plan kippt.
                  </p>
                </div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses}`}>
                  {formatTrajectoryRiskLabel(preview.status)}
                </span>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <label className="block">
                    <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                      Kapazitaet
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
                      className="mt-2 w-full accent-[rgb(239,68,68)]"
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
                      onChange={(event) => {
                        const nextValue = Number(event.target.value);
                        setEffortHours(nextValue);
                        trackSimulationOnce(capacityHoursPerWeek, nextValue);
                      }}
                      className="mt-2 w-full accent-[rgb(234,179,8)]"
                    />
                  </label>
                </div>

                <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Ergebnis
                  </p>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/8 pb-3">
                      <span className="text-sm text-zinc-400">Deadline</span>
                      <span className="text-sm font-semibold text-[#FAF0E6]">{dueDays} Tage</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/8 pb-3">
                      <span className="text-sm text-zinc-400">Prep Start</span>
                      <span className="text-sm font-semibold text-[#FAF0E6]">{prepStartLabel}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/8 pb-3">
                      <span className="text-sm text-zinc-400">Benoetigte Wochen</span>
                      <span className="text-sm font-semibold text-[#FAF0E6]">{preview.requiredWeeks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">Buffer</span>
                      <span className="text-sm font-semibold text-[#FAF0E6]">2 Wochen</span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-red-500/15 bg-red-500/[0.06] px-3 py-2.5">
                    <p className="text-xs leading-relaxed text-zinc-300">
                      INNIS simuliert nicht, um dich zu beeindrucken.
                      <span className="text-zinc-500"> Es zeigt dir, wann ein ambitionierter Plan realistisch wird.</span>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.22 }}
            className="relative hidden lg:block"
          >
            <div className="premium-card relative overflow-hidden rounded-[2rem] p-4 xl:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Product Surface
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Strategie oben. Ausfuehrung darunter.
                  </p>
                </div>
                <div className="flex gap-2 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  <span className="rounded-full border border-white/10 px-2 py-1">Trajectory</span>
                  <span className="rounded-full border border-white/10 px-2 py-1">Today</span>
                  <span className="rounded-full border border-white/10 px-2 py-1">Career</span>
                </div>
              </div>

              <ProductMockup />

              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Erst der Plan
                  </p>
                  <p className="mt-2 text-base font-semibold tracking-tight text-[#FAF0E6]">
                    Trajectory zeigt Startfenster, Risiko und Buffer.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Dann der Tag
                  </p>
                  <p className="mt-2 text-base font-semibold tracking-tight text-[#FAF0E6]">
                    Today macht daraus einen konkreten Move statt neuen Overhead.
                  </p>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#090909] via-[#090909]/65 to-transparent" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
