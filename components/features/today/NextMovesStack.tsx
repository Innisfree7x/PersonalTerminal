'use client';

import Link from 'next/link';
import { ArrowRight, CalendarDays, GraduationCap, ListChecks } from 'lucide-react';
import type { ReactNode } from 'react';
import type { RankedExecutionCandidate } from '@/lib/application/use-cases/execution-engine';

export interface NextKitEvent {
  title: string;
  startsAt: string;
  location: string | null;
}

export interface NextDeadline {
  courseName: string;
  examDate: string;
  courseCode?: string | null;
}

export interface NextMovesStackProps {
  nextKitEvent: NextKitEvent | null;
  nextDeadline: NextDeadline | null;
  nextTask: RankedExecutionCandidate | null;
}

type Accent = 'sky' | 'amber' | 'rose' | 'emerald';

const ACCENT_STYLES: Record<
  Accent,
  { border: string; ring: string; iconBg: string; iconColor: string; chip: string }
> = {
  sky: {
    border: 'border-sky-400/25',
    ring: 'hover:ring-sky-400/40',
    iconBg: 'bg-sky-500/12',
    iconColor: 'text-sky-300',
    chip: 'bg-sky-500/12 text-sky-200 border-sky-400/25',
  },
  amber: {
    border: 'border-amber-400/25',
    ring: 'hover:ring-amber-400/40',
    iconBg: 'bg-amber-500/12',
    iconColor: 'text-amber-300',
    chip: 'bg-amber-500/12 text-amber-200 border-amber-400/25',
  },
  rose: {
    border: 'border-rose-400/25',
    ring: 'hover:ring-rose-400/40',
    iconBg: 'bg-rose-500/12',
    iconColor: 'text-rose-300',
    chip: 'bg-rose-500/12 text-rose-200 border-rose-400/25',
  },
  emerald: {
    border: 'border-emerald-400/25',
    ring: 'hover:ring-emerald-400/40',
    iconBg: 'bg-emerald-500/12',
    iconColor: 'text-emerald-300',
    chip: 'bg-emerald-500/12 text-emerald-200 border-emerald-400/25',
  },
};

function formatHm(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const candidate = new Date(date);
  candidate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((candidate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Heute';
  if (diffDays === 1) return 'Morgen';
  if (diffDays > 0 && diffDays <= 6) {
    return date.toLocaleDateString('de-DE', { weekday: 'short' });
  }
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

function daysUntilLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const candidate = new Date(date);
  candidate.setHours(0, 0, 0, 0);
  const diff = Math.round((candidate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `vor ${Math.abs(diff)}d`;
  if (diff === 0) return 'heute';
  if (diff === 1) return 'morgen';
  return `in ${diff}d`;
}

interface MoveCardProps {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  subtitle?: string | undefined;
  chip?: string | undefined;
  accent: Accent;
  href: string;
  action?: string | undefined;
}

function MoveCard({ icon, eyebrow, title, subtitle, chip, accent, href, action = 'Öffnen' }: MoveCardProps) {
  const style = ACCENT_STYLES[accent];
  return (
    <Link
      href={href}
      className={`card-warm group relative flex h-full flex-col gap-3 rounded-2xl border ${style.border} bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-150 hover:-translate-y-0.5 hover:ring-2 ${style.ring}`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`rounded-xl border ${style.border} ${style.iconBg} p-1.5`}>
          <span className={style.iconColor}>{icon}</span>
        </div>
        <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-text-tertiary">
          {eyebrow}
        </span>
        {chip && (
          <span
            className={`ml-auto inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums ${style.chip}`}
          >
            {chip}
          </span>
        )}
      </div>
      <div className="flex-1">
        <p className="line-clamp-2 text-[14.5px] font-semibold leading-snug text-text-primary">
          {title}
        </p>
        {subtitle && <p className="mt-1 line-clamp-1 text-[12px] text-text-secondary">{subtitle}</p>}
      </div>
      <div className="flex items-center justify-between text-[11px] text-text-tertiary transition-colors group-hover:text-text-secondary">
        <span>{action}</span>
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function EmptyCard({
  icon,
  eyebrow,
  message,
  accent,
}: {
  icon: ReactNode;
  eyebrow: string;
  message: string;
  accent: Accent;
}) {
  const style = ACCENT_STYLES[accent];
  return (
    <div
      className={`card-warm flex h-full flex-col gap-3 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] p-4 text-text-tertiary`}
    >
      <div className="flex items-center gap-2.5">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-1.5">
          <span className="opacity-60">{icon}</span>
        </div>
        <span className={`text-[10.5px] font-medium uppercase tracking-[0.22em] ${style.iconColor} opacity-60`}>
          {eyebrow}
        </span>
      </div>
      <p className="flex-1 text-sm text-text-secondary">{message}</p>
      <span className="text-[11px]">—</span>
    </div>
  );
}

export default function NextMovesStack({
  nextKitEvent,
  nextDeadline,
  nextTask,
}: NextMovesStackProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="next-moves-stack">
      {nextKitEvent ? (
        <MoveCard
          icon={<CalendarDays className="h-4 w-4" />}
          eyebrow="KIT-Termin"
          title={nextKitEvent.title}
          subtitle={nextKitEvent.location ?? undefined}
          chip={`${formatDayLabel(nextKitEvent.startsAt)} · ${formatHm(nextKitEvent.startsAt)}`}
          accent="sky"
          href="/workspace/calendar"
          action="Kalender"
        />
      ) : (
        <EmptyCard
          icon={<CalendarDays className="h-4 w-4" />}
          eyebrow="KIT-Termin"
          message="Kein anstehendes Event."
          accent="sky"
        />
      )}

      {nextDeadline ? (
        <MoveCard
          icon={<GraduationCap className="h-4 w-4" />}
          eyebrow="Nächste Prüfung"
          title={nextDeadline.courseName}
          subtitle={nextDeadline.courseCode ?? undefined}
          chip={daysUntilLabel(nextDeadline.examDate)}
          accent="amber"
          href="/university"
          action="Kurs"
        />
      ) : (
        <EmptyCard
          icon={<GraduationCap className="h-4 w-4" />}
          eyebrow="Nächste Prüfung"
          message="Keine offene Prüfung."
          accent="amber"
        />
      )}

      {nextTask ? (
        <MoveCard
          icon={<ListChecks className="h-4 w-4" />}
          eyebrow="Nächster Task"
          title={nextTask.title}
          subtitle={nextTask.subtitle ?? undefined}
          chip={
            nextTask.urgencyLabel === 'overdue'
              ? 'überfällig'
              : nextTask.urgencyLabel === 'today'
                ? 'heute'
                : nextTask.urgencyLabel === 'soon'
                  ? 'bald'
                  : typeof nextTask.daysUntilDue === 'number'
                    ? `in ${nextTask.daysUntilDue}d`
                    : undefined
          }
          accent="emerald"
          href="/today"
          action="Anfangen"
        />
      ) : (
        <EmptyCard
          icon={<ListChecks className="h-4 w-4" />}
          eyebrow="Nächster Task"
          message="Alles erledigt."
          accent="emerald"
        />
      )}
    </div>
  );
}
