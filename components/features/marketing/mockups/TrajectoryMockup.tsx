'use client';

/**
 * TrajectoryMockup — HTML/CSS recreation of the Trajectory dashboard.
 *
 * Shows: Timeline with 3 goals, prep blocks, risk badges, collision zone,
 * buffer indicator, and stats row.
 */

const quarters = ['Q3 \'26', 'Q4 \'26', 'Q1 \'27', 'Q2 \'27'];

interface GoalRow {
  name: string;
  status: 'on_track' | 'tight' | 'at_risk';
  prepStart: number; // 0-100 position on timeline
  prepEnd: number;
  deadline: number;
  deadlineLabel: string;
}

const goals: GoalRow[] = [
  { name: 'GMAT', status: 'on_track', prepStart: 15, prepEnd: 52, deadline: 55, deadlineLabel: 'GMAT 01.03' },
  { name: 'Thesis', status: 'tight', prepStart: 30, prepEnd: 78, deadline: 82, deadlineLabel: 'Abgabe 15.06' },
  { name: 'Praktikum', status: 'at_risk', prepStart: 40, prepEnd: 65, deadline: 68, deadlineLabel: 'Start 01.04' },
];

const statusConfig = {
  on_track: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/25', bar: 'bg-emerald-500', label: 'on track' },
  tight: { bg: 'bg-[#E8B930]/15', text: 'text-[#E8B930]', border: 'border-[#E8B930]/25', bar: 'bg-[#E8B930]', label: 'tight' },
  at_risk: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/25', bar: 'bg-red-500', label: 'at risk' },
};

export function TrajectoryMockup() {
  // Collision zone: where Thesis and Praktikum prep blocks overlap
  const collisionStart = 40; // Praktikum start
  const collisionEnd = 65; // Praktikum end (overlaps with Thesis 30-78)

  return (
    <div className="p-5 md:p-7">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8B930]/10">
            <svg className="h-4 w-4 text-[#E8B930]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h4l3-9 4 18 3-9h4" />
            </svg>
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-white">Trajectory Engine</h3>
            <p className="text-[10px] text-zinc-500">GMAT · Thesis · Praktikum</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {goals.map((goal) => {
            const cfg = statusConfig[goal.status];
            return (
              <span key={goal.name} className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                {cfg.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Timeline header */}
      <div className="mb-1 flex justify-between px-[120px]">
        {quarters.map((q) => (
          <span key={q} className="text-[9px] font-medium uppercase tracking-wider text-zinc-600">{q}</span>
        ))}
      </div>

      {/* Timeline grid lines */}
      <div className="relative mb-2 h-px bg-white/[0.06]">
        {[25, 50, 75].map((pos) => (
          <div key={pos} className="absolute top-0 h-full w-px bg-white/[0.04]" style={{ left: `${pos}%` }} />
        ))}
      </div>

      {/* Goal rows */}
      <div className="space-y-3">
        {goals.map((goal) => {
          const cfg = statusConfig[goal.status];
          return (
            <div key={goal.name} className="flex items-center gap-4">
              {/* Goal label */}
              <div className="w-[100px] shrink-0">
                <span className="text-[12px] font-medium text-zinc-300">{goal.name}</span>
              </div>

              {/* Timeline bar */}
              <div className="relative h-8 flex-1 rounded-md bg-white/[0.02]">
                {/* Prep block */}
                <div
                  className={`absolute top-1 bottom-1 rounded ${cfg.bar}/25 border ${cfg.border}`}
                  style={{ left: `${goal.prepStart}%`, width: `${goal.prepEnd - goal.prepStart}%` }}
                >
                  <div className="flex h-full items-center justify-center">
                    <span className="text-[9px] font-medium text-zinc-400">Prep Block</span>
                  </div>
                </div>

                {/* Deadline marker */}
                <div
                  className="absolute top-0 bottom-0 flex flex-col items-center justify-end"
                  style={{ left: `${goal.deadline}%` }}
                >
                  <div className={`h-full w-[2px] ${cfg.bar}`} />
                  <span className={`mt-0.5 whitespace-nowrap text-[8px] font-semibold ${cfg.text}`}>
                    {goal.deadlineLabel}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Collision zone indicator */}
      <div className="relative mt-4 flex items-center gap-4">
        <div className="w-[100px] shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400/70">Kollision</span>
        </div>
        <div className="relative h-6 flex-1 rounded-md">
          <div
            className="absolute top-0 bottom-0 rounded border border-red-500/30 bg-red-500/8"
            style={{ left: `${collisionStart}%`, width: `${collisionEnd - collisionStart}%` }}
          >
            <div className="flex h-full items-center justify-center gap-1">
              <svg className="h-3 w-3 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="text-[9px] font-semibold text-red-400">Thesis + Praktikum überlappen</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          { label: 'Buffer', value: '2 Wochen' },
          { label: 'Capacity', value: '18h / Woche' },
          { label: 'Window', value: 'Q3 Praktika' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 text-center">
            <span className="block text-[9px] font-semibold uppercase tracking-wider text-zinc-600">{stat.label}</span>
            <span className="mt-1 block text-[13px] font-semibold text-white">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
