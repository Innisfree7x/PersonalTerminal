'use client';

import { forwardRef } from 'react';
import { format, parseISO } from 'date-fns';

type RiskStatus = 'on_track' | 'tight' | 'at_risk';
type GoalStatus = 'active' | 'done' | 'archived';

interface ShareGoal {
  id: string;
  title: string;
  dueDate: string;
  status: GoalStatus;
}

interface ShareBlock {
  goalId: string;
  startDate: string;
  endDate: string;
  status: RiskStatus;
}

interface TrajectoryShareCardProps {
  goals: ShareGoal[];
  generatedBlocks: ShareBlock[];
  overallStatus: RiskStatus;
  effectiveCapacity: number;
}

const STATUS_COLORS: Record<RiskStatus, { bg: string; text: string; label: string }> = {
  on_track: { bg: '#10b981', text: '#fff', label: 'On Track' },
  tight: { bg: '#f59e0b', text: '#fff', label: 'Tight' },
  at_risk: { bg: '#ef4444', text: '#fff', label: 'At Risk' },
};

function MilestoneBar({ goals, generatedBlocks }: { goals: ShareGoal[]; generatedBlocks: ShareBlock[] }) {
  const activeGoals = goals.filter((g) => g.status === 'active').slice(0, 5);
  if (activeGoals.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {activeGoals.map((goal) => {
        const block = generatedBlocks.find((b) => b.goalId === goal.id);
        const statusColor = block ? STATUS_COLORS[block.status].bg : '#71717a';
        return (
          <div key={goal.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusColor, flexShrink: 0 }} />
            <span style={{ fontSize: 14, color: '#d4d4d8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {goal.title}
            </span>
            <span style={{ fontSize: 12, color: '#71717a', flexShrink: 0 }}>
              {format(parseISO(goal.dueDate), 'MMM yyyy')}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const TrajectoryShareCard = forwardRef<HTMLDivElement, TrajectoryShareCardProps>(function TrajectoryShareCard(
  { goals, generatedBlocks, overallStatus, effectiveCapacity },
  ref
) {
  const statusConfig = STATUS_COLORS[overallStatus];
  const activeGoals = goals.filter((g) => g.status === 'active');
  const nearestDeadline = activeGoals
    .map((g) => ({ goal: g, due: parseISO(g.dueDate) }))
    .sort((a, b) => a.due.getTime() - b.due.getTime())[0];

  return (
    <div
      ref={ref}
      style={{
        width: 1200,
        height: 630,
        backgroundColor: '#0d0d12',
        padding: '48px 56px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'fixed',
        left: -9999,
        top: -9999,
        zIndex: -1,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#71717a', marginBottom: 12 }}>
            My Trajectory Plan
          </p>
          <h1 style={{ fontSize: 44, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.1 }}>
            {nearestDeadline?.goal.title ?? 'Strategic Plan'}
          </h1>
          {nearestDeadline && (
            <p style={{ fontSize: 16, color: '#a1a1aa', marginTop: 10 }}>
              Deadline: {format(nearestDeadline.due, 'dd MMMM yyyy')} · {effectiveCapacity}h/week
            </p>
          )}
        </div>
        <div
          style={{
            backgroundColor: statusConfig.bg,
            color: statusConfig.text,
            padding: '8px 18px',
            borderRadius: 24,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {statusConfig.label}
        </div>
      </div>

      {/* Milestone list */}
      <div
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '28px 32px',
        }}
      >
        <p style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#52525b', marginBottom: 16 }}>
          Milestones
        </p>
        <MilestoneBar goals={goals} generatedBlocks={generatedBlocks} />
        {activeGoals.length === 0 && (
          <p style={{ color: '#52525b', fontSize: 14 }}>No active milestones</p>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ color: '#3f3f46', fontSize: 13 }}>Built with INNIS — Strategic Planning for Students</p>
        <p style={{ color: '#3f3f46', fontSize: 13 }}>innis.app</p>
      </div>

      {/* 4-color gradient bottom stripe */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(to right, #f87171, #fbbf24, #fb923c, #38bdf8)',
        }}
      />
    </div>
  );
});

export default TrajectoryShareCard;
