'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useMemo, useState } from 'react';
import {
  formatTrajectoryRiskLabel,
  getDaysUntilDate,
  simulateTrajectoryGoalPreview,
} from '@/lib/trajectory/risk-model';
import { trackMarketingEvent } from '@/lib/analytics/marketing';

/**
 * ProductShowcase — Three cinematic feature reveals + interactive trajectory demo.
 *
 * PRISMA-style: Each feature gets a full viewport with scroll-driven entrance.
 * The trajectory demo section is interactive (sliders) — the "proof" moment.
 */

interface FeatureSection {
  kicker: string;
  headline: string;
  highlightedWord: string;
  description: string;
  metric: string;
  metricLabel: string;
}

const features: FeatureSection[] = [
  {
    kicker: 'Trajectory',
    headline: 'Startfenster, Buffer, Risiko.',
    highlightedWord: 'Eine Wahrheit.',
    description:
      'Backward Planning berechnet, wann deine Vorbereitung wirklich beginnen muss. Nicht "bald". Ein Datum. Mit Buffer und Risikologik.',
    metric: 'Tag 1',
    metricLabel: 'Exakter Prep-Start',
  },
  {
    kicker: 'Today',
    headline: 'Nicht planen.',
    highlightedWord: 'Ausführen.',
    description:
      'Morning Briefing, nächster Move, Focus Session. Alles kommt aus dem strategischen Plan — nicht aus einer neuen To-do-Liste.',
    metric: '1 Move',
    metricLabel: 'Pro Morgen. Kein Rauschen.',
  },
  {
    kicker: 'Career Intelligence',
    headline: 'Dein Profil kennt seine',
    highlightedWord: 'Lücken.',
    description:
      'CV-Upload, Fit-Score, Gap-Analyse. Nicht blindes Bewerben, sondern der nächste sinnvolle Schritt für jede Rolle.',
    metric: 'Fit + Gap',
    metricLabel: 'Statt Bauchgefühl',
  },
];

function FeatureBlock({ feature, index }: { feature: FeatureSection; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0.15, 0.35, 0.65, 0.85], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0.15, 0.35], [60, 0]);
  const metricScale = useTransform(scrollYProgress, [0.25, 0.4], [0.8, 1]);
  const metricOpacity = useTransform(scrollYProgress, [0.25, 0.4], [0, 1]);

  const isEven = index % 2 === 0;

  return (
    <div ref={ref} className="relative min-h-screen py-20">
      <div className="sticky top-0 flex min-h-screen items-center">
        <div className="mx-auto w-full max-w-6xl px-6">
          <motion.div
            style={{ opacity, y }}
            className={`grid items-center gap-16 lg:grid-cols-2 ${isEven ? '' : 'lg:[direction:rtl]'}`}
          >
            {/* Text side */}
            <div className={isEven ? '' : 'lg:[direction:ltr]'}>
              <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.35em] text-[#E8B930]">
                {feature.kicker}
              </p>
              <h2 className="premium-heading text-[clamp(2rem,4vw,3.5rem)] font-semibold text-white">
                {feature.headline}
                <br />
                <span className="bg-gradient-to-r from-[#E8B930] via-[#F5D565] to-[#E8B930] bg-clip-text text-transparent">
                  {feature.highlightedWord}
                </span>
              </h2>
              <p className="mt-6 max-w-lg text-[16px] leading-[1.8] text-zinc-500">
                {feature.description}
              </p>
            </div>

            {/* Metric side — bold, cinematic number */}
            <motion.div
              style={{ scale: metricScale, opacity: metricOpacity }}
              className={`flex flex-col items-center justify-center ${isEven ? '' : 'lg:[direction:ltr]'}`}
            >
              <div className="text-center">
                <span className="block text-[clamp(3rem,8vw,7rem)] font-bold tracking-tight text-white">
                  {feature.metric}
                </span>
                <span className="mt-2 block text-[13px] uppercase tracking-[0.2em] text-zinc-500">
                  {feature.metricLabel}
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/**
 * Interactive trajectory demo — the "live proof" moment.
 * User slides variables, sees risk change in real time.
 */
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
      {/* Subtle glow */}
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

          {/* Interactive demo */}
          <div className="space-y-10">
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
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

            {/* Results — large, cinematic */}
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
        </motion.div>
      </div>
    </section>
  );
}

export function ProductShowcase() {
  return (
    <>
      {features.map((feature, i) => (
        <FeatureBlock key={feature.kicker} feature={feature} index={i} />
      ))}
      <TrajectoryDemo />
    </>
  );
}
