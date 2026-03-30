'use client';

import { useMemo, useRef, useState } from 'react';
import {
  formatTrajectoryRiskLabel,
  simulateTrajectoryGoalPreview,
  type TrajectoryRiskStatus,
} from '@/lib/trajectory/risk-model';
import { trackMarketingEvent } from '@/lib/analytics/marketing';
import { cn } from '@/lib/utils';
import {
  buildTrajectoryProofInsight,
  formatTrajectoryProofDateLabel,
} from './trajectoryProof';

const DUE_DATE = '2027-03-01';
const BUFFER_WEEKS = 2;
const CAPACITY_OPTIONS = [12, 18, 24] as const;
const EFFORT_OPTIONS = [320, 520, 720] as const;

function getStatusTone(status: TrajectoryRiskStatus) {
  if (status === 'on_track') {
    return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
  }

  if (status === 'tight') {
    return 'border-primary/20 bg-primary/10 text-primary';
  }

  return 'border-red-400/20 bg-red-400/10 text-red-300';
}

export function HeroProofTeaser({ source = 'hero_mini_proof' }: { source?: string }) {
  const [capacityHoursPerWeek, setCapacityHoursPerWeek] = useState<number>(18);
  const [effortHours, setEffortHours] = useState<number>(520);
  const trackedRef = useRef(false);

  const preview = useMemo(
    () =>
      simulateTrajectoryGoalPreview({
        dueDate: DUE_DATE,
        effortHours,
        bufferWeeks: BUFFER_WEEKS,
        capacityHoursPerWeek,
      }),
    [capacityHoursPerWeek, effortHours]
  );

  const prepStartLabel = useMemo(() => formatTrajectoryProofDateLabel(preview.startDate), [preview.startDate]);
  const insight = useMemo(
    () => buildTrajectoryProofInsight(preview.status, capacityHoursPerWeek, prepStartLabel),
    [capacityHoursPerWeek, prepStartLabel, preview.status]
  );

  const trackOnce = (nextCapacityHoursPerWeek: number, nextEffortHours: number) => {
    if (trackedRef.current) return;
    trackedRef.current = true;

    const nextPreview = simulateTrajectoryGoalPreview({
      dueDate: DUE_DATE,
      effortHours: nextEffortHours,
      bufferWeeks: BUFFER_WEEKS,
      capacityHoursPerWeek: nextCapacityHoursPerWeek,
    });

    void trackMarketingEvent('hero_simulated', {
      source,
      hours_per_week: nextCapacityHoursPerWeek,
      effort_hours: nextEffortHours,
      status: nextPreview.status,
    });
  };

  return (
    <div
      data-landing-interactive="true"
      className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-4 text-left shadow-[0_18px_80px_rgba(0,0,0,0.28)] sm:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-primary/80">Live proof</p>
          <h3 className="mt-2 text-[1.05rem] font-semibold tracking-[-0.02em] text-white sm:text-[1.15rem]">
            Gleiche Deadline. Andere Kapazitaet. Anderer Plan.
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Teste direkt im Hero, wann dein Startfenster eng wird und ab wann der Plan kippt.
          </p>
        </div>

        <div
          className={cn(
            'inline-flex w-fit items-center rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.25em]',
            getStatusTone(preview.status)
          )}
        >
          {formatTrajectoryRiskLabel(preview.status)}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">Kapazitaet</p>
            <div className="flex flex-wrap gap-2">
              {CAPACITY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setCapacityHoursPerWeek(option);
                    trackOnce(option, effortHours);
                  }}
                  className={cn(
                    'rounded-full border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors',
                    capacityHoursPerWeek === option
                      ? 'border-primary/40 bg-primary/15 text-white'
                      : 'border-white/[0.07] bg-white/[0.03] text-zinc-400 hover:border-white/[0.12] hover:text-white'
                  )}
                >
                  {option}h/Woche
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">Scope</p>
            <div className="flex flex-wrap gap-2">
              {EFFORT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setEffortHours(option);
                    trackOnce(capacityHoursPerWeek, option);
                  }}
                  className={cn(
                    'rounded-full border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors',
                    effortHours === option
                      ? 'border-primary/40 bg-primary/15 text-white'
                      : 'border-white/[0.07] bg-white/[0.03] text-zinc-400 hover:border-white/[0.12] hover:text-white'
                  )}
                >
                  {option}h Aufwand
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">Prep start</p>
              <p className="mt-1 text-sm font-semibold text-white">{prepStartLabel}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">Wochen</p>
              <p className="mt-1 text-sm font-semibold text-white">{preview.requiredWeeks}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-3 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">Interpretation</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{insight}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
