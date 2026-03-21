'use client';

/**
 * TodayMockup — HTML/CSS recreation of the Today dashboard.
 *
 * Shows: CommandBar with stats, Morning Briefing, NBA badge,
 * task list with checkboxes, and focus timer widget.
 */

const tasks = [
  { label: 'GMAT Kapitel 3 — Quant Review', done: true },
  { label: 'Thesis Outline finalisieren', done: true },
  { label: 'Career: Rothenstein Anschreiben', done: false },
  { label: 'Fokus-Session: 2h Deep Work', done: false },
];

export function TodayMockup() {
  return (
    <div className="p-5 md:p-7">
      {/* Command Bar */}
      <div className="mb-5 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
        <div className="flex items-center gap-5">
          <StatChip label="Tasks" value="4/7" />
          <div className="h-4 w-px bg-white/[0.06]" />
          <StatChip label="Streak" value="12" accent />
          <div className="h-4 w-px bg-white/[0.06]" />
          <StatChip label="Momentum" value="+4" accent />
        </div>
        <div className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1">
          <span className="text-[10px] font-semibold text-emerald-400">on track</span>
        </div>
      </div>

      {/* Morning Briefing */}
      <div className="mb-5 rounded-xl border border-[#E8B930]/15 bg-[#E8B930]/[0.04] px-4 py-3">
        <div className="mb-1.5 flex items-center gap-2">
          <svg className="h-3.5 w-3.5 text-[#E8B930]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#E8B930]/80">Morning Briefing</span>
        </div>
        <p className="text-[13px] leading-relaxed text-zinc-300">
          GMAT ist <span className="font-semibold text-emerald-400">on track</span> · Prep startet 09.11.2026 · Heute: Quant Review Kapitel 3
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_auto]">
        {/* Task list */}
        <div>
          {/* NBA */}
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-[#E8B930]/15">
              <svg className="h-3 w-3 text-[#E8B930]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
              </svg>
            </div>
            <span className="text-[11px] text-zinc-400">Nächster Move:</span>
            <span className="text-[11px] font-semibold text-white">GMAT Kapitel 3</span>
          </div>

          {/* Tasks */}
          <div className="space-y-1.5">
            {tasks.map((task) => (
              <div
                key={task.label}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
              >
                {/* Checkbox */}
                <div className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border ${
                  task.done
                    ? 'border-emerald-500/40 bg-emerald-500/20'
                    : 'border-white/[0.12] bg-white/[0.03]'
                }`}>
                  {task.done && (
                    <svg className="h-3 w-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span className={`text-[13px] ${task.done ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                  {task.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Focus Timer Widget */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] px-6 py-5">
          <span className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-zinc-600">Focus</span>
          <span className="text-[32px] font-bold tabular-nums tracking-tight text-white">25:00</span>
          <div className="mt-3 flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-[10px] font-medium text-emerald-400">Bereit</span>
          </div>
          <button className="mt-3 rounded-full bg-white/[0.06] px-4 py-1.5 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-white/[0.1] hover:text-white">
            Start
          </button>
        </div>
      </div>
    </div>
  );
}

function StatChip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</span>
      <span className={`text-[13px] font-semibold tabular-nums ${accent ? 'text-[#E8B930]' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}
