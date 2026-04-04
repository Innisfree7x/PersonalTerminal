'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, GaugeCircle } from 'lucide-react';
import type { TrajectoryPlanSummary, TrajectoryRiskStatus } from '@/components/features/onboarding/StepTrajectoryPlan';

interface RiskStatusCardProps {
  goalTitle: string;
  targetDate: string;
  summary: TrajectoryPlanSummary;
  compact?: boolean;
}

const STATUS_META: Record<
  TrajectoryRiskStatus,
  {
    label: string;
    border: string;
    panel: string;
    badge: string;
    icon: typeof CheckCircle2;
  }
> = {
  on_track: {
    label: 'On track',
    border: 'border-emerald-500/25',
    panel: 'bg-emerald-500/[0.08]',
    badge: 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10',
    icon: CheckCircle2,
  },
  tight: {
    label: 'Tight',
    border: 'border-[#E8B930]/30',
    panel: 'bg-[#E8B930]/[0.08]',
    badge: 'text-[#F5D565] border-[#E8B930]/25 bg-[#E8B930]/10',
    icon: Clock3,
  },
  at_risk: {
    label: 'At risk',
    border: 'border-[#DC3232]/35',
    panel: 'bg-[#DC3232]/[0.09]',
    badge: 'text-[#F28F8F] border-[#DC3232]/25 bg-[#DC3232]/10',
    icon: AlertTriangle,
  },
};

function formatDateLabel(dateIso: string): string {
  const parsed = new Date(`${dateIso}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return dateIso;
  return parsed.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function computeWeeksToDeadline(targetDate: string): number {
  const today = new Date();
  const due = new Date(`${targetDate}T00:00:00.000Z`);
  if (Number.isNaN(due.getTime())) return 0;
  const ms = due.getTime() - today.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24 * 7)));
}

function computeFocusSessions(hoursPerWeek: number): number {
  return Math.max(1, Math.round(hoursPerWeek / 1.5));
}

export function RiskStatusCard({ goalTitle, targetDate, summary, compact = false }: RiskStatusCardProps) {
  const meta = STATUS_META[summary.status];
  const Icon = meta.icon;
  const weeksToDeadline = computeWeeksToDeadline(targetDate);
  const recommendedSessions = computeFocusSessions(summary.effectiveCapacityHoursPerWeek);
  const cardPaddingClass = compact ? 'p-5' : 'p-6';
  const statsMarginClass = compact ? 'mt-4' : 'mt-5';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: 'easeOut' }}
      className={`rounded-[28px] border ${meta.border} ${meta.panel} ${cardPaddingClass}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#0F0E13] px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-[#A89D8F]">
            <Icon className="h-3.5 w-3.5" />
            Live Risk Status
          </div>
          <div>
            <p className="text-lg font-semibold text-[#FAF0E6]">{goalTitle}</p>
            <p className="mt-1 text-sm text-[#C5B9A8]">{summary.explanation}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${meta.badge}`}>
          <span className="h-2 w-2 rounded-full bg-current" />
          {meta.label}
        </span>
      </div>

      <div className={`${statsMarginClass} grid gap-3 grid-cols-1 sm:grid-cols-3`}>
        <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#8F8577]">
            <CalendarDays className="h-3.5 w-3.5" />
            Deadline
          </div>
          <p className="mt-3 text-2xl font-semibold text-[#FAF0E6]">{weeksToDeadline} Wochen</p>
          <p className="mt-1 text-sm text-[#B4A998]">bis {formatDateLabel(targetDate)}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#8F8577]">
            <GaugeCircle className="h-3.5 w-3.5" />
            Fokus pro Woche
          </div>
          <p className="mt-3 text-2xl font-semibold text-[#FAF0E6]">{recommendedSessions}</p>
          <p className="mt-1 text-sm text-[#B4A998]">empfohlene 90m-Sessions</p>
        </div>
        <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#8F8577]">
            <Clock3 className="h-3.5 w-3.5" />
            Prep Start
          </div>
          <p className="mt-3 text-2xl font-semibold text-[#FAF0E6]">{formatDateLabel(summary.startDate)}</p>
          <p className="mt-1 text-sm text-[#B4A998]">bei {summary.effectiveCapacityHoursPerWeek}h/Woche</p>
        </div>
      </div>
    </motion.div>
  );
}
