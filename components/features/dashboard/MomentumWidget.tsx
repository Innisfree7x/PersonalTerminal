'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Flame, CheckCircle2, Zap, Target } from 'lucide-react';
import type { MomentumScoreResult } from '@/lib/trajectory/momentum';

interface GoalHealth {
  id: string;
  title: string;
  daysLeft: number;
  progress: number; // 0..1
  status: 'on_track' | 'tight' | 'at_risk';
}

interface MomentumWidgetProps {
  momentum: MomentumScoreResult | null;
  goals?: GoalHealth[];
  isLoading?: boolean;
}

function scoreColor(score: number): string {
  if (score >= 65) return 'text-success';
  if (score >= 40) return 'text-warning';
  return 'text-error';
}

function scoreBorderColor(score: number): string {
  if (score >= 65) return 'stroke-success';
  if (score >= 40) return 'stroke-warning';
  return 'stroke-error';
}

function scoreTrackColor(score: number): string {
  if (score >= 65) return 'stroke-success/20';
  if (score >= 40) return 'stroke-warning/20';
  return 'stroke-error/20';
}

function statusBadgeClass(status: 'on_track' | 'tight' | 'at_risk'): string {
  if (status === 'on_track') return 'bg-success/10 text-success border-success/20';
  if (status === 'tight') return 'bg-warning/10 text-warning border-warning/20';
  return 'bg-error/10 text-error border-error/20';
}

function statusLabel(status: 'on_track' | 'tight' | 'at_risk'): string {
  if (status === 'on_track') return 'On track';
  if (status === 'tight') return 'Tight';
  return 'At risk';
}

const GAUGE_SIZE = 96;
const STROKE_WIDTH = 6;
const RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = RADIUS * 2 * Math.PI;

interface BreakdownBarProps {
  label: string;
  value: number;
  max: number;
  icon: React.ReactNode;
}

function BreakdownBar({ label, value, max, icon }: BreakdownBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 flex items-center justify-center text-text-tertiary flex-shrink-0">
        {icon}
      </div>
      <span className="text-xs uppercase tracking-wider text-text-tertiary w-16 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-surface-hover rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
      <span className="text-xs text-text-tertiary w-8 text-right flex-shrink-0">
        {value.toFixed(0)}/{max}
      </span>
    </div>
  );
}

export default function MomentumWidget({ momentum, goals = [], isLoading }: MomentumWidgetProps) {
  const offset = useMemo(() => {
    if (!momentum) return CIRCUMFERENCE;
    return CIRCUMFERENCE - (momentum.score / 100) * CIRCUMFERENCE;
  }, [momentum]);

  if (isLoading) {
    return (
      <div className="card-warm rounded-2xl p-5 animate-pulse">
        <div className="h-4 bg-surface-hover rounded w-1/3 mb-4" />
        <div className="flex justify-center mb-4">
          <div className="w-24 h-24 rounded-full bg-surface-hover" />
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-surface-hover rounded" />
          <div className="h-2 bg-surface-hover rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!momentum) return null;

  const TrendIcon = momentum.delta > 0 ? TrendingUp : momentum.delta < 0 ? TrendingDown : Minus;
  const trendColor = momentum.delta > 0 ? 'text-success' : momentum.delta < 0 ? 'text-error' : 'text-text-tertiary';
  const trendLabel = momentum.delta > 0 ? `+${momentum.delta}` : `${momentum.delta}`;

  return (
    <div className="card-warm rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
          Momentum Score
        </h3>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          <span>{trendLabel} vs last week</span>
        </div>
      </div>

      {/* Circular Gauge */}
      <div className="flex justify-center mb-5">
        <div className="relative" style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }}>
          <svg
            width={GAUGE_SIZE}
            height={GAUGE_SIZE}
            className="transform -rotate-90"
          >
            {/* Track */}
            <circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={RADIUS}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              className={scoreTrackColor(momentum.score)}
            />
            {/* Progress */}
            <motion.circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={RADIUS}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeLinecap="round"
              className={scoreBorderColor(momentum.score)}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
              style={{ strokeDasharray: CIRCUMFERENCE }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className={`text-2xl font-bold ${scoreColor(momentum.score)}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              {momentum.score}
            </motion.span>
          </div>
        </div>
      </div>

      {/* Breakdown Bars */}
      <div className="space-y-2 mb-4">
        <BreakdownBar
          label="Status"
          value={momentum.breakdown.statusPoints}
          max={45}
          icon={<Target className="w-3 h-3" />}
        />
        <BreakdownBar
          label="Capacity"
          value={momentum.breakdown.capacityPoints}
          max={27}
          icon={<Zap className="w-3 h-3" />}
        />
        <BreakdownBar
          label="Streak"
          value={momentum.breakdown.streakBonus}
          max={5}
          icon={<Flame className="w-3 h-3" />}
        />
        <BreakdownBar
          label="Tasks"
          value={momentum.breakdown.taskBonus}
          max={5}
          icon={<CheckCircle2 className="w-3 h-3" />}
        />
      </div>

      {/* Goal Health Bars */}
      {goals.length > 0 && (
        <div className="border-t border-border pt-3 mt-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2">
            Goal Health
          </h4>
          <div className="space-y-2.5">
            {goals.map((goal) => (
              <div key={goal.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-primary truncate max-w-[140px]">
                    {goal.title}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border ${statusBadgeClass(goal.status)}`}>
                      {statusLabel(goal.status)}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      {goal.daysLeft}d
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      goal.status === 'on_track' ? 'bg-success' :
                      goal.status === 'tight' ? 'bg-warning' : 'bg-error'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, goal.progress * 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
