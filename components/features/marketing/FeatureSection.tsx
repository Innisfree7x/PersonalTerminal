'use client';

import { motion } from 'framer-motion';
import { Route, CalendarDays, Command, Timer, Sparkles, ShieldCheck, Zap } from 'lucide-react';

const features = [
  {
    id: 'trajectory',
    icon: Route,
    title: 'Trajectory Planner',
    description:
      'Plane Thesis, GMAT, Master-Bewerbungen und Praktika rückwärts von echten Deadlines. Mit klarer Risiko-Logik statt Bauchgefühl.',
    accent: 'text-red-300',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    glow: 'group-hover:shadow-red-500/20',
    layout: 'lg:col-span-2 lg:row-span-2',
  },
  {
    id: 'today',
    icon: CalendarDays,
    title: 'Today Command Center',
    description:
      'Tasks, Kalender und Focus in einem Daily-Flow. Strategischer Morning-Briefing-Banner verbindet Langfrist-Plan mit deinem heutigen Move.',
    accent: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'group-hover:shadow-emerald-500/20',
    layout: 'lg:col-span-1',
  },
  {
    id: 'command',
    icon: Command,
    title: 'Command Rail',
    description:
      'Tippen statt klicken: Tasks, Goals und Navigation per Intent-Parser. Mit deterministischer Preview bevor etwas ausgeführt wird.',
    accent: 'text-violet-300',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    glow: 'group-hover:shadow-violet-500/20',
    layout: 'lg:col-span-1',
  },
  {
    id: 'focus',
    icon: Timer,
    title: 'Focus Mode + Sound',
    description:
      'Vollbild-Fokus mit Themes, Overlays und Custom Session-Längen. Notification-Kit inklusive Teams-Style Tone für klares Feedback.',
    accent: 'text-orange-300',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    glow: 'group-hover:shadow-orange-500/20',
    layout: 'lg:col-span-1',
  },
  {
    id: 'lucian',
    icon: Sparkles,
    title: 'Lucian Companion',
    description:
      'Kontextbasierte Impulse, Speech-Bubbles und Spell-VFX. Lucian bleibt optional, aber macht Fokus-Sessions messbar lebendiger.',
    accent: 'text-yellow-300',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    glow: 'group-hover:shadow-yellow-500/20',
    layout: 'lg:col-span-1',
  },
  {
    id: 'reliability',
    icon: ShieldCheck,
    title: 'Reliability Layer',
    description:
      'SLO-Metriken, Cron Health und blocker E2E-Gates sichern Releases ab. Damit Features nicht nur gut aussehen, sondern stabil laufen.',
    accent: 'text-sky-300',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    glow: 'group-hover:shadow-sky-500/20',
    layout: 'lg:col-span-1',
  },
];

export function FeatureSection() {
  return (
    <section className="relative py-24 md:py-32">
      {/* Top divider */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="marketing-container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <p className="premium-kicker">Alle Module</p>
          <h2 className="premium-heading mb-4 text-3xl font-semibold text-[#FAF0E6] md:text-5xl">
            Sechs Engine-Blöcke.
            <br />
            Eine klare Student Journey.
          </h2>
          <p className="premium-subtext mx-auto max-w-xl">
            Von strategischer Timeline bis täglicher Execution:
            alles ist verbunden, nichts ist isoliert.
          </p>
        </motion.div>

        <div className="grid auto-rows-[minmax(168px,auto)] gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className={`group premium-card-soft relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01] hover:border-white/20 hover:bg-[#171717] ${feature.glow} ${feature.layout}`}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="pointer-events-none absolute -right-16 -top-16 h-28 w-28 rounded-full bg-white/5 blur-2xl opacity-0 transition duration-300 group-hover:opacity-100" />
              <div
                className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl border ${feature.border} ${feature.bg}`}
              >
                <feature.icon className={`w-5 h-5 ${feature.accent}`} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[#FAF0E6]">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{feature.description}</p>

              {feature.id === 'trajectory' ? (
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">Milestones</p>
                    {[
                      { label: 'GMAT', date: '01.03.2027', state: 'on track', color: 'text-emerald-300' },
                      { label: 'Master Apps', date: '15.11.2026', state: 'tight', color: 'text-amber-300' },
                      { label: 'Praktikum Q3', date: '01.09.2026', state: 'window', color: 'text-blue-300' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-zinc-200">{item.label}</span>
                          <span className={`text-[10px] ${item.color}`}>{item.state}</span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-zinc-500">{item.date}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">Risk console</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        ['ON', '3', 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'],
                        ['TIGHT', '1', 'text-amber-300 border-amber-500/30 bg-amber-500/10'],
                        ['RISK', '0', 'text-red-300 border-red-500/30 bg-red-500/10'],
                      ].map(([label, value, styles]) => (
                        <div key={label} className={`rounded-md border px-2 py-1.5 ${styles}`}>
                          <p className="text-[9px] leading-none">{label}</p>
                          <p className="mt-1 text-sm font-semibold leading-none">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <p className="text-[10px] text-zinc-600">Simulation</p>
                      <div className="mt-2 h-1 rounded-full bg-white/10">
                        <motion.div
                          className="h-1 rounded-full bg-red-500/80"
                          initial={{ width: 0 }}
                          whileInView={{ width: '62%' }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.2 }}
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] text-zinc-400">18h/week → Prep start 09.11.2026</p>
                    </div>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-600">Timeline snapshot</p>
                    <div className="rounded-xl bg-gradient-to-b from-white/[0.03] to-white/[0.015] p-2.5">
                      <div className="relative h-12 overflow-hidden rounded-lg border border-white/10 bg-black/25 px-2">
                        <div className="pointer-events-none absolute left-1/2 top-1/2 h-8 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300/10 blur-xl" />
                        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                        {[
                          { label: "Q3 '26", left: '8%' },
                          { label: "Q4 '26", left: '30%' },
                          { label: "Q1 '27", left: '52%' },
                          { label: "Q2 '27", left: '74%' },
                          { label: "Q3 '27", left: '92%' },
                        ].map((tick) => (
                          <div key={tick.label} className="absolute top-0 h-full" style={{ left: tick.left }}>
                            <div className="h-full w-px bg-white/10" />
                            <span className="absolute top-1 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] tracking-[0.08em] text-zinc-500/90">
                              {tick.label}
                            </span>
                          </div>
                        ))}
                        <motion.div
                          className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border border-emerald-300/70 bg-emerald-300/35 shadow-[0_0_16px_rgba(110,231,183,0.42)]"
                          initial={{ left: '0%' }}
                          whileInView={{ left: '48%' }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.1, delay: 0.15 }}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex h-7 items-center rounded-full border border-emerald-500/30 bg-emerald-500/[0.12] px-2.5 text-[10px] font-medium text-emerald-300">
                          Start 09.11.2026
                        </span>
                        <span className="inline-flex h-7 items-center rounded-full border border-amber-500/30 bg-amber-500/[0.12] px-2.5 text-[10px] font-medium text-amber-300">
                          6 Prep Blocks
                        </span>
                        <span className="inline-flex h-7 items-center rounded-full border border-blue-500/30 bg-blue-500/[0.12] px-2.5 text-[10px] font-medium text-blue-300">
                          1 Opportunity Window
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {feature.id === 'today' ? (
                <div className="mt-5 space-y-2.5">
                  <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] text-emerald-200">
                    Morning briefing: GMAT · 287d left · on track
                  </div>
                  {[
                    { label: 'VWL 2 - Blatt 4', meta: 'Exam in 9d' },
                    { label: 'OR 1/2 - Blatt 2', meta: 'Exam in 15d' },
                  ].map((task) => (
                    <div key={task.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-2">
                      <span className="text-[11px] text-zinc-300">{task.label}</span>
                      <span className="text-[10px] text-zinc-500">{task.meta}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {feature.id === 'command' ? (
                <div className="mt-5 space-y-2.5">
                  <div className="rounded-md border border-violet-500/30 bg-violet-500/10 px-3 py-2">
                    <p className="font-mono text-[11px] text-violet-200">&gt; create task &quot;GMAT Verbal&quot; tomorrow</p>
                  </div>
                  <div className="rounded-lg border border-violet-500/20 bg-violet-500/[0.07] px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-violet-300">Intent preview</p>
                    <p className="mt-1 text-[11px] text-zinc-300">Task „GMAT Verbal“ · due morgen</p>
                    <div className="mt-2 inline-flex rounded-md border border-violet-500/40 bg-violet-500/20 px-2 py-0.5 text-[10px] text-violet-200">
                      Enter to confirm
                    </div>
                  </div>
                </div>
              ) : null}

              {feature.id === 'focus' ? (
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-600">Themes</p>
                    <div className="mt-2 flex gap-1.5">
                      {['bg-slate-300/80', 'bg-sky-400/80', 'bg-yellow-400/80', 'bg-red-400/80'].map((dot) => (
                        <span key={dot} className={`h-3 w-3 rounded-full ${dot}`} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-600">Tone</p>
                    <p className="mt-2 text-[11px] text-zinc-300">Teams default · click · swoosh</p>
                  </div>
                  <div className="col-span-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
                    <p className="font-mono text-lg font-semibold tracking-widest text-[#FAF0E6]">25:00</p>
                    <p className="mt-0.5 text-[10px] text-zinc-500">Custom duration + fullscreen focus</p>
                  </div>
                </div>
              ) : null}

              {feature.id === 'lucian' ? (
                <div className="mt-5 rounded-xl border border-yellow-500/25 bg-yellow-500/10 p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full border border-yellow-500/40 bg-black/50" />
                    <div className="flex-1">
                      <p className="text-[11px] font-medium text-yellow-200">Lucian · speech bubble</p>
                      <p className="text-[10px] text-zinc-400">„Buffer sinkt. Starte jetzt 25 Minuten Fokus.“</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {feature.id === 'reliability' ? (
                <div className="mt-5 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-2">
                      <p className="text-[9px] uppercase tracking-wide text-emerald-300">Google Sync</p>
                      <p className="mt-1 text-[11px] text-zinc-200">Connected · healthy</p>
                    </div>
                    <div className="rounded-md border border-sky-500/25 bg-sky-500/10 px-2.5 py-2">
                      <p className="text-[9px] uppercase tracking-wide text-sky-300">Cron health</p>
                      <p className="mt-1 text-[11px] text-zinc-200">ops-reliability every 5m</p>
                    </div>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/[0.02] px-2.5 py-2">
                    <p className="text-[10px] text-zinc-400">Release gates: type-check · lint · blocker e2e</p>
                  </div>
                </div>
              ) : null}
            </motion.div>
          ))}
        </div>

        {/* Stack Callout */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="premium-card-soft flex items-start gap-5 rounded-2xl p-6 sm:items-center sm:flex-row flex-col"
        >
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-yellow-500/25 bg-yellow-500/10">
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-[#FAF0E6]">Strategy-to-Execution Stack</span>
              <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-400">
                Neu in V2
              </span>
            </div>
            <p className="text-sm leading-relaxed text-zinc-400">
              Onboarding erzeugt direkt einen realen Trajectory-Status. Danach führen Today, Command Rail und
              Focus Screen diesen Plan täglich aus — abgesichert durch Release-Gates und Ops-Tracking.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
