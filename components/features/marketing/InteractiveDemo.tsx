'use client';

import { useMemo, useRef, useState } from 'react';
import {
  formatTrajectoryRiskLabel,
  getDaysUntilDate,
  simulateTrajectoryGoalPreview,
} from '@/lib/trajectory/risk-model';
import { trackMarketingEvent } from '@/lib/analytics/marketing';
import { TerminalFrame } from './TerminalFrame';
import {
  buildTrajectoryProofInsight,
  formatTrajectoryProofDateLabel,
  getTrajectoryProofStatusTone,
} from './trajectoryProof';

export function InteractiveDemo() {
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
  const prepStartLabel = useMemo(() => formatTrajectoryProofDateLabel(preview.startDate), [preview.startDate]);
  const insight = useMemo(
    () => buildTrajectoryProofInsight(preview.status, capacityHoursPerWeek, prepStartLabel),
    [capacityHoursPerWeek, prepStartLabel, preview.status]
  );
  const statusColor = getTrajectoryProofStatusTone(preview.status);

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
    <TerminalFrame url="innis.io/trajectory/simulate">
      <div className="p-6 md:p-8" data-landing-interactive="true">
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
              className="mt-4 w-full accent-primary"
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
              className="mt-4 w-full accent-primary"
            />
          </label>
        </div>

        <div className="my-8 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

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

        <p className="mt-6 text-center text-sm leading-6 text-zinc-400">{insight}</p>
      </div>
    </TerminalFrame>
  );
}
