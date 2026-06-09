'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import { GraduationCap, ShieldCheck, Dumbbell, Brain, ArrowRight, Activity } from 'lucide-react';
import { useDayBriefing, useCheckin, todayKey } from '@/lib/hooks/useBriefing';
import {
  computeRiskLights,
  computeControlScore,
  pickNextStep,
  type RiskDomain,
  type RiskLevel,
  type TrajectoryRisk,
} from '@/lib/dashboard/riskTraffic';

export interface LifeVitalsProps {
  trajectoryStatus?: TrajectoryRisk | null | undefined;
  daysUntilExam?: number | null | undefined;
}

const DOMAIN_META: Record<RiskDomain, { icon: typeof GraduationCap; label: string }> = {
  study: { icon: GraduationCap, label: 'Studium' },
  finance: { icon: ShieldCheck, label: 'Finanzen' },
  body: { icon: Dumbbell, label: 'Körper' },
  focus: { icon: Brain, label: 'Fokus' },
};

const BAR_COLOR: Record<RiskLevel, string> = {
  green: 'bg-emerald-400',
  amber: 'bg-amber-400',
  red: 'bg-red-400',
  unknown: 'bg-white/15',
};
const TEXT_COLOR: Record<RiskLevel, string> = {
  green: 'text-emerald-300',
  amber: 'text-amber-300',
  red: 'text-red-300',
  unknown: 'text-white/35',
};
const GLOW: Record<RiskLevel, string> = {
  green: '',
  amber: '',
  red: 'shadow-[0_0_12px_rgba(248,113,113,0.45)]',
  unknown: '',
};

const ORDER: RiskDomain[] = ['study', 'finance', 'body', 'focus'];

function LifeVitals({ trajectoryStatus, daysUntilExam }: LifeVitalsProps) {
  const today = todayKey();
  const { data: briefing } = useDayBriefing(today);
  const { data: checkin } = useCheckin(today, 'evening');

  const { lights, control, nextStep } = useMemo(() => {
    const l = computeRiskLights({
      trajectoryStatus,
      daysUntilExam,
      responses: checkin?.responses ?? null,
      fulfillmentRate: briefing?.fulfillment.rate ?? null,
    });
    return { lights: l, control: computeControlScore(l), nextStep: pickNextStep(l) };
  }, [trajectoryStatus, daysUntilExam, checkin?.responses, briefing?.fulfillment.rate]);

  const scoreColor =
    control >= 70 ? 'text-emerald-300' : control >= 45 ? 'text-amber-300' : 'text-red-300';

  return (
    <div className="card-surface rounded-2xl p-5" data-testid="life-vitals">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-text-tertiary" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-text-tertiary">
            Lebens-Vitals
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary">Kontrolle</span>
          <span className={`text-lg font-bold tabular-nums ${scoreColor}`}>{control}%</span>
        </div>
      </div>

      {/* Vitals bars */}
      <div className="mt-4 space-y-2.5">
        {ORDER.map((domain) => {
          const light = lights[domain];
          const meta = DOMAIN_META[domain];
          const Icon = meta.icon;
          return (
            <div key={domain} className="flex items-center gap-3">
              <div className="flex w-24 shrink-0 items-center gap-1.5">
                <Icon className={`h-3.5 w-3.5 ${TEXT_COLOR[light.level]}`} />
                <span className="text-[12.5px] text-text-secondary">{meta.label}</span>
              </div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ease-out ${BAR_COLOR[light.level]} ${GLOW[light.level]}`}
                  style={{ width: `${Math.round(light.fill * 100)}%` }}
                />
              </div>
              <div className="flex w-[120px] shrink-0 flex-col items-end leading-tight">
                <span className={`text-[12px] font-medium ${TEXT_COLOR[light.level]}`}>{light.label}</span>
                {light.detail && (
                  <span className="text-[10.5px] text-text-tertiary">{light.detail}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Next step — the active part */}
      <div className="mt-4 border-t border-border pt-3.5">
        {nextStep ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                Jetzt
              </span>
              <p className="truncate text-sm font-medium text-text-primary">{nextStep.action}</p>
            </div>
            <Link
              href={nextStep.href}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-white transition-transform hover:translate-x-0.5"
            >
              Start
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <p className="text-sm text-emerald-300">Alles im grünen Bereich — halte das Momentum. 🟢</p>
        )}
      </div>
    </div>
  );
}

export default memo(LifeVitals);
