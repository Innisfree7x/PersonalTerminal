'use client';

import { AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { CrisisCollision } from '@/lib/trajectory/crisis';

interface CrisisBannerProps {
  collisions: CrisisCollision[];
  goalsById: Record<string, { title: string }>;
}

const codeLabel: Record<CrisisCollision['code'], string> = {
  FIXED_WINDOW_COLLISION: 'Fixed-Window Kollision',
  FIXED_BLOCKS_PREP: 'Prep-Phase blockiert',
  NO_FLEXIBLE_SLOT: 'Keine Flex-Slots',
  LEAD_TIME_TOO_SHORT: 'Lead-Time zu kurz',
};

function formatWindow(window: { startDate: string; endDate: string }): string {
  return `${format(parseISO(window.startDate), 'dd.MM.yyyy')} – ${format(
    parseISO(window.endDate),
    'dd.MM.yyyy'
  )}`;
}

export default function CrisisBanner({ collisions, goalsById }: CrisisBannerProps) {
  if (collisions.length === 0) return null;

  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-500/40 bg-red-500/[0.08] p-4 shadow-[0_0_24px_rgba(239,68,68,0.12)]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-500/45 bg-red-500/15">
          <AlertTriangle className="h-4 w-4 text-red-300" />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm font-semibold text-red-100">
              Crisis erkannt — {collisions.length} Kollision
              {collisions.length === 1 ? '' : 'en'}
            </h3>
            <span className="text-[11px] uppercase tracking-[0.16em] text-red-300/70">critical</span>
          </div>
          <p className="mt-1 text-xs text-red-100/75">
            Dein Plan hat sich kollidierende Fenster. Priorisiere oder verschiebe eins der Ziele.
          </p>
          <ul className="mt-3 space-y-2">
            {collisions.map((c, idx) => {
              const goalTitles = c.conflictingGoalIds
                .map((id) => goalsById[id]?.title ?? id)
                .join(' ↔ ');
              return (
                <li
                  key={`${c.code}-${idx}`}
                  className="rounded-xl border border-red-500/25 bg-red-500/[0.05] px-3 py-2 text-xs text-red-100/90"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="rounded-full border border-red-500/40 bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-200">
                      {codeLabel[c.code]}
                    </span>
                    <span className="font-medium text-red-100">{goalTitles}</span>
                    <span className="text-red-100/60">· {formatWindow(c.window)}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-red-100/75">{c.message}</div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
