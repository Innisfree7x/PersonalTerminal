'use client';

import { motion } from 'framer-motion';

/**
 * TrajectoryMockup — Redesigned for marketing impact.
 *
 * One dramatic moment: the collision zone.
 * 3 goal bars animate in + collision callout pulses with glow.
 */

interface GoalRow {
  name: string;
  status: 'on_track' | 'tight' | 'at_risk';
  prepStart: number;
  prepEnd: number;
  deadline: number;
  deadlineLabel: string;
}

const goals: GoalRow[] = [
  { name: 'GMAT', status: 'on_track', prepStart: 12, prepEnd: 50, deadline: 53, deadlineLabel: '01.03' },
  { name: 'Thesis', status: 'tight', prepStart: 28, prepEnd: 78, deadline: 82, deadlineLabel: '15.06' },
  { name: 'Praktikum', status: 'at_risk', prepStart: 38, prepEnd: 63, deadline: 66, deadlineLabel: '01.04' },
];

const statusStyle = {
  on_track: {
    bar: 'bg-gradient-to-r from-emerald-500/30 to-emerald-500/15',
    border: 'border-emerald-500/30',
    line: 'bg-emerald-500',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  tight: {
    bar: 'bg-gradient-to-r from-primary/30 to-primary/15',
    border: 'border-primary/30',
    line: 'bg-primary',
    text: 'text-primary',
    dot: 'bg-primary',
  },
  at_risk: {
    bar: 'bg-gradient-to-r from-red-500/30 to-red-500/15',
    border: 'border-red-500/30',
    line: 'bg-red-500',
    text: 'text-red-400',
    dot: 'bg-red-400',
  },
};

export function TrajectoryMockup() {
  const collisionLeft = 38;
  const collisionWidth = 63 - 38;

  return (
    <div className="px-5 py-6 md:px-7 md:py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h4l3-9 4 18 3-9h4" />
            </svg>
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-white">Trajectory Engine</h3>
            <p className="text-[10px] text-zinc-600">3 Ziele · WS 25/26</p>
          </div>
        </div>
        <span className="text-[10px] tracking-wider text-zinc-600">Q3 &apos;26 → Q2 &apos;27</span>
      </div>

      {/* Goal bars — staggered animation */}
      <div className="space-y-5">
        {goals.map((goal, i) => {
          const s = statusStyle[goal.status];
          return (
            <motion.div
              key={goal.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Label row */}
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                  <span className="text-[12px] font-semibold text-zinc-300">{goal.name}</span>
                </div>
                <span className={`text-[10px] font-medium ${s.text}`}>{goal.deadlineLabel}</span>
              </div>

              {/* Bar */}
              <div className="relative h-7 rounded-md bg-white/[0.02]">
                {/* Prep gradient — animated width */}
                <motion.div
                  className={`absolute inset-y-0 rounded-md border ${s.bar} ${s.border}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${goal.prepEnd - goal.prepStart}%` }}
                  transition={{ duration: 0.8, delay: 0.4 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  style={{ left: `${goal.prepStart}%` }}
                />

                {/* Deadline tick */}
                <motion.div
                  className={`absolute top-0 h-full w-[2px] rounded-full ${s.line} shadow-[0_0_6px_rgba(255,255,255,0.15)]`}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ duration: 0.3, delay: 0.8 + i * 0.15 }}
                  style={{ left: `${goal.deadline}%` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Collision callout */}
      <motion.div
        className="relative mt-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Connector lines to the overlap zone */}
        <div className="relative h-10">
          <div
            className="absolute top-0 h-full border-l border-r border-dashed border-red-500/25"
            style={{ left: `${collisionLeft}%`, width: `${collisionWidth}%` }}
          />
          <div
            className="absolute bottom-0 left-1/2 h-px w-12 -translate-x-1/2 bg-red-500/20"
          />
        </div>

        {/* Collision card */}
        <div className="relative mx-auto max-w-xs overflow-hidden rounded-xl border border-red-500/20 bg-red-500/[0.06]">
          {/* Pulse glow */}
          <motion.div
            className="absolute inset-0 rounded-xl bg-red-500/[0.08]"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Outer glow ring */}
          <motion.div
            className="pointer-events-none absolute -inset-[1px] rounded-xl"
            animate={{
              boxShadow: [
                '0 0 15px rgba(239,68,68,0)',
                '0 0 25px rgba(239,68,68,0.15)',
                '0 0 15px rgba(239,68,68,0)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative flex items-center gap-3 px-4 py-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
              <svg className="h-3.5 w-3.5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-red-400">Thesis + Praktikum kollidieren</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">8 Wochen Overlap · 23h/Woche nötig</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Status legend — minimal */}
      <div className="mt-6 flex items-center justify-center gap-6">
        {(['on_track', 'tight', 'at_risk'] as const).map((status) => {
          const s = statusStyle[status];
          const labels = { on_track: 'on track', tight: 'tight', at_risk: 'at risk' };
          return (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
              <span className={`text-[10px] font-medium ${s.text}`}>{labels[status]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
