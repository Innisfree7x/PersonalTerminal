'use client';

import { motion } from 'framer-motion';

/**
 * TodayMockup — Redesigned for marketing impact.
 *
 * Story: Your day is planned before you open the tab.
 * Morning Briefing → NBA + Focus Timer → 2 Tasks → Semester overview.
 * All elements animate in with staggered timing.
 */

const modules = [
  { name: 'Statistik II', done: 6, total: 10 },
  { name: 'Corporate Finance', done: 10, total: 10 },
  { name: 'Ökonometrie', done: 5, total: 10 },
];

export function TodayMockup() {
  return (
    <div className="px-5 py-6 md:px-7 md:py-8">
      {/* Morning Briefing */}
      <motion.div
        className="relative mb-6 overflow-hidden rounded-xl border border-[#E8B930]/15 bg-[#E8B930]/[0.04] px-4 py-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="absolute inset-y-0 left-0 w-1 rounded-r-full bg-[#E8B930]/60" />
        <div className="flex items-center gap-2">
          <svg className="h-3.5 w-3.5 text-[#E8B930]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#E8B930]/70">Morning Briefing</span>
        </div>
        <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-400">
          GMAT <span className="font-semibold text-emerald-400">on track</span> · Thesis <span className="font-semibold text-[#E8B930]">tight</span> · Heute: 4.2h eingeplant · 2 Ziele aktiv
        </p>
      </motion.div>

      {/* NBA + Focus Timer row */}
      <div className="mb-5 grid grid-cols-[1fr_auto] gap-3">
        {/* NBA */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="mb-1.5 flex items-center gap-2">
            <div className="flex h-4 w-4 items-center justify-center rounded bg-[#E8B930]/15">
              <svg className="h-2.5 w-2.5 text-[#E8B930]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
              </svg>
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">Nächster Move</span>
          </div>
          <div className="rounded-xl border border-[#E8B930]/12 bg-white/[0.02] px-4 py-3">
            <p className="text-[13px] font-semibold text-white">GMAT Kapitel 3 — Quant Review</p>
            <p className="mt-1 text-[11px] text-zinc-500">
              aus Trajectory · 90 min · <span className="text-emerald-400">on track</span>
            </p>
          </div>
        </motion.div>

        {/* Focus Timer */}
        <motion.div
          className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3"
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <span className="text-[28px] font-bold tabular-nums tracking-tight text-white">25:00</span>
          <div className="mt-1.5 flex items-center gap-1.5">
            <motion.div
              className="h-2 w-2 rounded-full bg-emerald-500"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="text-[9px] font-medium text-emerald-400">Bereit</span>
          </div>
          <button className="mt-2 rounded-full bg-white/[0.06] px-3.5 py-1 text-[10px] font-medium text-zinc-400 transition-colors hover:bg-white/[0.1] hover:text-white">
            Start
          </button>
        </motion.div>
      </div>

      {/* Compact tasks */}
      <motion.div
        className="mb-6 space-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <TaskRow label="Thesis Outline finalisieren" done />
        <TaskRow label="Rothenstein Anschreiben" done={false} />
      </motion.div>

      {/* Divider */}
      <div className="mb-5 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Semester overview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="h-3.5 w-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
            <span className="text-[11px] font-semibold text-zinc-400">Semester WS 25/26</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-600">Momentum</span>
            <span className="text-[14px] font-bold text-[#E8B930]">73</span>
            <span className="text-[10px] font-semibold text-emerald-400">+4</span>
          </div>
        </div>

        <div className="space-y-3">
          {modules.map((mod, i) => {
            const pct = (mod.done / mod.total) * 100;
            const complete = mod.done === mod.total;
            return (
              <motion.div
                key={mod.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.8 + i * 0.1 }}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className={`text-[12px] ${complete ? 'text-zinc-500' : 'text-zinc-300'}`}>{mod.name}</span>
                  <span className={`text-[11px] font-medium ${complete ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {complete ? 'Fertig' : `${mod.done}/${mod.total} Übungen`}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                  <motion.div
                    className={`h-full rounded-full ${
                      complete
                        ? 'bg-emerald-500/50'
                        : pct >= 50
                          ? 'bg-[#E8B930]/50'
                          : 'bg-zinc-500/40'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, delay: 0.9 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function TaskRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2">
      <div
        className={`flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded border ${
          done ? 'border-emerald-500/40 bg-emerald-500/20' : 'border-white/[0.12] bg-white/[0.03]'
        }`}
      >
        {done && (
          <svg className="h-2.5 w-2.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span className={`text-[12px] ${done ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>{label}</span>
    </div>
  );
}
