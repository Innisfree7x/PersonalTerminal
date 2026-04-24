'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, CalendarClock, Target } from 'lucide-react';
import { useMemo } from 'react';
import type { TrajectoryMorningSnapshotPayload } from '@/lib/trajectory/morningSnapshot';
import { buildTrajectoryMorningBriefing } from '@/lib/dashboard/trajectoryBriefing';
import { getRiskStatusTone } from '@/lib/design-system/statusTone';
import { useAnimationSuspended } from '@/lib/hooks/usePageVisibility';

export interface TrajectoryCollisionHeroProps {
  snapshot: TrajectoryMorningSnapshotPayload | null | undefined;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function parseUtcDate(value: string): Date {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? new Date(value) : parsed;
}

export default function TrajectoryCollisionHero({ snapshot }: TrajectoryCollisionHeroProps) {
  const animationsSuspended = useAnimationSuspended();
  const briefing = useMemo(
    () => buildTrajectoryMorningBriefing(snapshot?.overview),
    [snapshot?.overview]
  );

  if (!briefing) {
    return (
      <div
        className="card-surface relative overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.1),transparent_45%)] px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]"
        data-testid="trajectory-hero-empty"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl border border-sky-400/25 bg-sky-500/12 p-2">
              <Target className="h-5 w-5 text-sky-300" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-text-tertiary">
                Trajectory
              </p>
              <h2 className="mt-1 text-lg font-semibold text-text-primary">
                Kein aktives Trajectory-Ziel
              </h2>
              <p className="mt-1 max-w-xl text-sm text-text-secondary">
                Leg ein Ziel mit Deadline an — INNIS berechnet Prep-Blocks und warnt dich, bevor etwas kollidiert.
              </p>
            </div>
          </div>
          <Link
            href="/trajectory"
            className="inline-flex items-center gap-2 self-start rounded-xl border border-sky-400/30 bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-100 transition-all hover:-translate-y-px hover:bg-sky-500/25 hover:shadow-[0_12px_30px_rgba(56,189,248,0.2)]"
          >
            Einrichten
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const tone = getRiskStatusTone(briefing.status);
  const today = startOfDay(new Date());
  const deadline = startOfDay(parseUtcDate(briefing.dueDate));
  const totalDays = Math.max(1, Math.round((deadline.getTime() - today.getTime()) / DAY_MS));
  const prepBlocks = (snapshot?.overview?.computed?.generatedBlocks ?? []).filter(
    (block) => block.goalId === briefing.goalId
  );

  const dayRatio = (d: Date) => {
    const diff = (startOfDay(d).getTime() - today.getTime()) / DAY_MS;
    return Math.max(0, Math.min(1, diff / totalDays));
  };

  const severeTone = briefing.status === 'at_risk';
  const statusTextLabel =
    briefing.status === 'on_track' ? 'On Track' : briefing.status === 'tight' ? 'Knapp' : 'Kollisionsgefahr';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="card-surface relative overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(248,113,113,0.08),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.08),transparent_50%)] px-6 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]"
      data-testid="trajectory-hero"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${tone.badge}`}
        >
          {severeTone && <AlertTriangle className="h-3 w-3" />}
          {statusTextLabel}
        </span>
        <span className="text-[11px] uppercase tracking-[0.24em] text-text-tertiary">
          Nächste Kollision
        </span>
      </div>

      <h2 className="mt-2.5 text-2xl font-semibold leading-tight text-text-primary">
        In <span className="tabular-nums text-white">{briefing.daysUntil}</span>{' '}
        {briefing.daysUntil === 1 ? 'Tag' : 'Tagen'}:{' '}
        <span className="text-text-primary">{briefing.title}</span>
      </h2>

      <div className="mt-5">
        <div className="flex items-center justify-between text-[10.5px] uppercase tracking-[0.2em] text-text-tertiary">
          <span>Heute</span>
          <span>Deadline · {deadline.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</span>
        </div>
        <svg viewBox="0 0 1000 60" className="mt-2 h-16 w-full" aria-hidden="true">
          <defs>
            <linearGradient id="traj-base" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
            </linearGradient>
          </defs>
          <rect x="0" y="26" width="1000" height="8" rx="4" fill="url(#traj-base)" />
          <motion.rect
            x="0"
            y="26"
            height="8"
            rx="4"
            fill={
              briefing.status === 'at_risk'
                ? '#f87171'
                : briefing.status === 'tight'
                  ? '#fbbf24'
                  : '#34d399'
            }
            initial={{ width: 0 }}
            animate={{ width: 1000 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            opacity={0.18}
          />
          {prepBlocks.map((block, idx) => {
            const cx = dayRatio(parseUtcDate(block.startDate)) * 1000;
            const fill =
              block.status === 'at_risk' ? '#f87171' : block.status === 'tight' ? '#fbbf24' : '#34d399';
            return (
              <motion.circle
                key={`${block.goalId}-${block.startDate}-${idx}`}
                cx={cx}
                cy={30}
                r={6}
                fill={fill}
                stroke="rgba(10,12,18,0.9)"
                strokeWidth={2}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.15 + idx * 0.05 }}
              />
            );
          })}
          <motion.circle
            cx={0}
            cy={30}
            r={9}
            fill="#fff"
            initial={{ opacity: 0 }}
            animate={animationsSuspended ? { opacity: 0.8 } : { opacity: [0.8, 0.35, 0.8] }}
            transition={animationsSuspended ? { duration: 0 } : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <circle cx={0} cy={30} r={4} fill="#0a0c12" />
          <circle cx={0} cy={30} r={2.5} fill="#f5f7fb" />
          <circle cx={1000} cy={30} r={6} fill="rgba(255,255,255,0.9)" />
          <line x1={1000} x2={1000} y1={18} y2={42} stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} />
        </svg>
        <div className="mt-1 flex items-center justify-between text-[10px] text-text-tertiary">
          <span>Noch {totalDays} {totalDays === 1 ? 'Tag' : 'Tage'}</span>
          <span className="tabular-nums">
            {prepBlocks.length} {prepBlocks.length === 1 ? 'Prep-Block' : 'Prep-Blocks'}
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href={`/trajectory?goalId=${encodeURIComponent(briefing.goalId)}&source=today_hero`}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-[#0a0c12] transition-all hover:-translate-y-px hover:brightness-110 hover:shadow-[0_12px_30px_rgba(255,255,255,0.14)]"
        >
          Öffne Trajectory
          <ArrowRight className="h-4 w-4" />
        </Link>
        {briefing.status !== 'on_track' && (
          <Link
            href="/focus?source=today_hero"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:border-white/20 hover:bg-white/10 hover:text-text-primary"
          >
            <CalendarClock className="h-4 w-4" />
            Heute Fokus-Block setzen
          </Link>
        )}
      </div>
    </motion.div>
  );
}
