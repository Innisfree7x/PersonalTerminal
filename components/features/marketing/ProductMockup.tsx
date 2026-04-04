'use client';

import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, BriefcaseBusiness, Command, Route, Sparkles, Timer } from 'lucide-react';
import { BrandMark } from '@/components/shared/BrandLogo';

const navItems = ['Today', 'Trajectory', 'Career', 'Focus', 'Calendar'];
const timelineStops = ["Q3 '26", "Q4 '26", "Q1 '27", "Q2 '27"];
const todayMoves = [
  { title: 'GMAT verbal block', meta: 'Start 09.11.2026', tone: 'text-[#E8B930]' },
  { title: 'DCF Stichworte in CV', meta: 'Gap aus Career Radar', tone: 'text-emerald-300' },
  { title: 'Internship Q3 shortlist', meta: '2 realistische Treffer', tone: 'text-[#FAF0E6]' },
];

export function ProductMockup() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-10 rounded-3xl bg-gradient-to-tr from-[#DC3232]/12 via-transparent to-[#E8B930]/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 -bottom-8 mx-auto h-24 w-3/4 rounded-full bg-[#E8B930]/8 blur-2xl" />

      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        <div className="premium-card relative overflow-hidden rounded-3xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
          <div className="flex items-center gap-2 border-b border-white/10 bg-[#0A0A0A]/90 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/50" />
            </div>
            <div className="mx-3 flex h-5 flex-1 items-center rounded-md bg-white/5 px-3">
              <span className="font-mono text-[10px] text-zinc-600">innis.io/trajectory</span>
            </div>
          </div>

          <div className="flex h-[420px]">
            <div className="flex w-16 flex-shrink-0 flex-col items-center gap-4 border-r border-white/10 bg-[#0A0A0A] py-4">
              <BrandMark sizeClassName="h-8 w-8" className="mb-1 shadow-none" />
              {navItems.map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  className={`h-1.5 w-8 rounded-full ${i === 1 ? 'bg-[#E8B930]' : 'bg-white/8'}`}
                />
              ))}
            </div>

            <div className="flex-1 overflow-hidden bg-[#0F0F10] p-4">
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-[#FAF0E6]">Trajectory - Today - Career</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-600">ein durchgängiger Plan</p>
                </div>
                <div className="rounded-md border border-white/10 bg-[#1C1C1C] px-2 py-0.5">
                  <p className="font-mono text-[10px] text-zinc-500">Risk live</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                className="mb-3 rounded-2xl border border-white/10 bg-[#171717]/90 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Morning briefing</p>
                    <p className="mt-1 text-xs text-[#FAF0E6]">GMAT ist on track - Prep startet 09.11.2026</p>
                  </div>
                  <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                    +4 Momentum
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-zinc-400">Risk sichtbar</span>
                  <span className="rounded-full border border-[#E8B930]/20 bg-[#E8B930]/10 px-2 py-1 text-[10px] text-[#E8B930]">Next Move ready</span>
                  <span className="rounded-full border border-[#DC3232]/20 bg-[#DC3232]/10 px-2 py-1 text-[10px] text-[#F7A8A8]">Career live</span>
                </div>
              </motion.div>

              <div className="grid h-[330px] grid-cols-[1.2fr_0.88fr] gap-3">
                <div className="space-y-3">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="rounded-2xl border border-white/10 bg-[#171717]/90 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Route className="h-4 w-4 text-[#E8B930]" />
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Trajectory Engine</p>
                          <p className="text-xs text-[#FAF0E6]">GMAT · Thesis · Internship Q3</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                        on track
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                      {timelineStops.map((stop) => (
                        <div key={stop}>{stop}</div>
                      ))}
                    </div>
                    <div className="relative mt-3 h-16 rounded-xl border border-white/8 bg-black/20 px-3">
                      <div className="absolute left-3 right-3 top-7 h-px bg-white/10" />
                      <div className="absolute left-[20%] top-[22px] h-4 w-[34%] rounded-full bg-[#E8B930]/15 ring-1 ring-[#E8B930]/25" />
                      <div className="absolute left-[20%] top-3 text-[10px] font-medium text-[#E8B930]">Prep Block</div>
                      <div className="absolute left-[57%] top-[13px] h-7 w-px bg-emerald-400/90" />
                      <div className="absolute left-[53%] top-11 text-[10px] font-medium text-emerald-300">GMAT 01.03</div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[
                        { label: 'Buffer', value: '2 Wochen' },
                        { label: 'Capacity', value: '18h / Woche' },
                        { label: 'Window', value: 'Q3 Praktika' },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">{item.label}</p>
                          <p className="mt-1 text-[11px] font-semibold text-[#FAF0E6]">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.48 }}
                    className="rounded-2xl border border-white/10 bg-[#171717]/90 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-[#DC3232]" />
                        <p className="text-sm font-semibold text-[#FAF0E6]">Today Execution</p>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">3 priorisierte Moves</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {todayMoves.map((move) => (
                        <div key={move.title} className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-3 py-2.5">
                          <div>
                            <p className="text-[11px] font-medium text-[#FAF0E6]">{move.title}</p>
                            <p className={`mt-0.5 text-[10px] ${move.tone}`}>{move.meta}</p>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-zinc-500" />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                <div className="space-y-3">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-2xl border border-white/10 bg-[#171717]/90 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BriefcaseBusiness className="h-4 w-4 text-[#DC3232]" />
                        <p className="text-sm font-semibold text-[#FAF0E6]">Career Intelligence</p>
                      </div>
                      <span className="text-xl font-black tabular-nums text-[#FAF0E6]">8.2</span>
                    </div>
                    <p className="mt-2 text-[11px] font-medium text-[#FAF0E6]">Intern M&A Advisory · Rothenstein Partners</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300">Realistic</span>
                      <span className="rounded-full border border-[#E8B930]/20 bg-[#E8B930]/10 px-2 py-1 text-[10px] text-[#E8B930]">2 Quellen</span>
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-zinc-400">Track-fit direkt</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-white/8 bg-black/20 p-3">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">Top Reason</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-zinc-300">M&A Exposure sichtbar im CV.</p>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-black/20 p-3">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">Gap</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-zinc-300">DCF Stichworte klarer im CV.</p>
                      </div>
                    </div>
                    <div className="mt-3 rounded-xl border border-[#E8B930]/20 bg-[#E8B930]/8 p-3">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">Next Action</p>
                      <p className="mt-1 text-[11px] text-[#FAF0E6]">Gap direkt als Today-Task übernehmen und heute im CV fixen.</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.54 }}
                    className="rounded-2xl border border-white/10 bg-[#171717]/90 p-4"
                  >
                    <div className="flex items-center gap-2">
                      <Command className="h-4 w-4 text-[#E8B930]" />
                      <p className="text-sm font-semibold text-[#FAF0E6]">Command Rail</p>
                    </div>
                    <div className="mt-3 rounded-xl border border-[#DC3232]/20 bg-[#DC3232]/[0.08] px-3 py-2 font-mono text-[10px] text-[#FAF0E6]">
                      &gt; create task &quot;DCF lines in CV&quot; tomorrow
                    </div>
                    <div className="mt-3 rounded-xl border border-white/8 bg-black/20 p-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-[#DC3232]" />
                        <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">Intent preview</p>
                      </div>
                      <p className="mt-2 text-[11px] text-zinc-300">Task wird morgen angelegt und mit Career Gap verknüpft.</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-emerald-300" />
                        <span className="text-[11px] text-zinc-300">Focus Session 25m bereit</span>
                      </div>
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300">Start</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-7 left-8 right-6 h-8 rounded-full bg-black/40 blur-xl" />
      </motion.div>
    </div>
  );
}
