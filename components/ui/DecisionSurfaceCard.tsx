'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type DecisionSurfaceTone = 'default' | 'success' | 'warning' | 'error' | 'info';

interface DecisionSurfaceChip {
  label: string;
  tone?: DecisionSurfaceTone;
}

interface DecisionSurfaceCardProps {
  eyebrow?: string;
  title: string;
  summary: string;
  bullets?: string[];
  chips?: DecisionSurfaceChip[];
  footer?: ReactNode;
  icon?: ReactNode;
  tone?: DecisionSurfaceTone;
  className?: string;
}

const toneStyles: Record<DecisionSurfaceTone, { shell: string; chip: string }> = {
  default: {
    shell: 'border-white/10 bg-white/[0.03]',
    chip: 'border-white/15 bg-white/[0.04] text-text-secondary',
  },
  success: {
    shell: 'border-emerald-500/25 bg-emerald-500/[0.08]',
    chip: 'border-emerald-500/25 bg-emerald-500/[0.12] text-emerald-200',
  },
  warning: {
    shell: 'border-amber-500/25 bg-amber-500/[0.08]',
    chip: 'border-amber-500/25 bg-amber-500/[0.12] text-amber-200',
  },
  error: {
    shell: 'border-red-500/25 bg-red-500/[0.08]',
    chip: 'border-red-500/25 bg-red-500/[0.12] text-red-200',
  },
  info: {
    shell: 'border-sky-500/25 bg-sky-500/[0.08]',
    chip: 'border-sky-500/25 bg-sky-500/[0.12] text-sky-200',
  },
};

export function DecisionSurfaceCard({
  eyebrow,
  title,
  summary,
  bullets = [],
  chips = [],
  footer,
  icon,
  tone = 'default',
  className,
}: DecisionSurfaceCardProps) {
  const style = toneStyles[tone];

  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        style.shell,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">{eyebrow}</p>
          ) : null}
          <h3 className="mt-1 text-sm font-semibold text-text-primary">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">{summary}</p>
        </div>
        {icon ? <div className="mt-0.5 text-text-tertiary">{icon}</div> : null}
      </div>

      {chips.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((chip) => {
            const chipTone = toneStyles[chip.tone ?? tone];
            return (
              <span
                key={chip.label}
                className={cn(
                  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                  chipTone.chip
                )}
              >
                {chip.label}
              </span>
            );
          })}
        </div>
      ) : null}

      {bullets.length > 0 ? (
        <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-text-secondary">
          {bullets.map((bullet) => (
            <li key={bullet}>• {bullet}</li>
          ))}
        </ul>
      ) : null}

      {footer ? <div className="mt-3 border-t border-white/8 pt-3">{footer}</div> : null}
    </div>
  );
}
