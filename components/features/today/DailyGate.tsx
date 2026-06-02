'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check, X, Trash2, ArrowRight, Flame, Moon, Sunrise } from 'lucide-react';
import { LucianSpriteAnimator } from '@/components/features/lucian/LucianSpriteAnimator';
import {
  useDayBriefing,
  useCheckin,
  useCreateCommitment,
  useSetCommitmentStatus,
  useDeleteCommitment,
  useUpsertCheckin,
} from '@/lib/hooks/useBriefing';
import { MAX_COMMITMENTS_PER_DAY, type BriefingMode } from '@/lib/dashboard/briefing';
import { getMorningGreeting, getEveningGreeting } from '@/lib/lucian/briefingCopy';
import type { Commitment } from '@/lib/supabase/dailyBriefing';

const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()}. ${MONTHS[date.getMonth()]}`;
}

interface ModeTheme {
  /** Layered background gradient. */
  bg: string;
  /** Radial accent glows. */
  glowA: string;
  glowB: string;
  accent: string;
  accentSoft: string;
  ring: string;
  label: string;
  icon: typeof Sunrise;
}

const THEMES: Record<BriefingMode, ModeTheme> = {
  morning: {
    bg: 'radial-gradient(120% 90% at 50% 0%, #2a1c08 0%, #14110c 42%, #07070c 100%)',
    glowA: 'radial-gradient(circle, rgba(251,146,60,0.30) 0%, transparent 70%)',
    glowB: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)',
    accent: '#fbbf24',
    accentSoft: 'rgba(251,191,36,0.14)',
    ring: 'rgba(251,191,36,0.45)',
    label: 'Morgen-Briefing',
    icon: Sunrise,
  },
  evening: {
    bg: 'radial-gradient(120% 90% at 50% 0%, #2a0f33 0%, #140f24 44%, #07060c 100%)',
    glowA: 'radial-gradient(circle, rgba(168,85,247,0.30) 0%, transparent 70%)',
    glowB: 'radial-gradient(circle, rgba(217,70,239,0.16) 0%, transparent 70%)',
    accent: '#c084fc',
    accentSoft: 'rgba(192,132,252,0.14)',
    ring: 'rgba(192,132,252,0.45)',
    label: 'Abend-Briefing',
    icon: Moon,
  },
};

export interface DailyGateProps {
  day: string;
  mode: BriefingMode;
  onComplete: () => void;
}

export default function DailyGate({ day, mode, onComplete }: DailyGateProps) {
  const theme = THEMES[mode];
  const { data, isLoading } = useDayBriefing(day);

  const commitments = data?.commitments ?? [];
  const streak = data?.streak ?? 0;
  const fulfillment = data?.fulfillment ?? { done: 0, total: 0, rate: 0 };

  const greeting = useMemo(() => {
    const input = { streak, fulfillmentRate: fulfillment.rate, commitmentCount: commitments.length };
    return mode === 'morning' ? getMorningGreeting(input) : getEveningGreeting(input);
  }, [mode, streak, fulfillment.rate, commitments.length]);

  const lucianPose =
    mode === 'evening' && fulfillment.total > 0 && fulfillment.rate >= 0.7 ? 'victory' : 'idle';

  const Icon = theme.icon;

  return (
    <motion.div
      className="fixed inset-0 z-[100] overflow-y-auto"
      style={{ background: theme.bg }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      data-testid="daily-gate"
    >
      {/* Atmosphere glows */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 blur-3xl"
        style={{ background: theme.glowA }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[420px] w-[420px] translate-x-1/4 translate-y-1/4 blur-3xl"
        style={{ background: theme.glowB }}
      />
      {/* Grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="flex items-center gap-2.5"
        >
          <Icon className="h-4 w-4" style={{ color: theme.accent }} />
          <span
            className="text-[12px] font-semibold uppercase tracking-[0.32em]"
            style={{ color: theme.accent }}
          >
            {theme.label}
          </span>
          <span className="text-[12px] uppercase tracking-[0.18em] text-white/35">
            · {formatLongDate(day)}
          </span>
        </motion.div>

        {/* Lucian + greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="mt-6 flex items-start gap-5"
        >
          <div
            className="relative shrink-0 rounded-2xl p-2"
            style={{ background: theme.accentSoft, boxShadow: `0 0 40px ${theme.accentSoft}` }}
          >
            <LucianSpriteAnimator animation={lucianPose} size={72} />
          </div>
          <div className="pt-1">
            <h1 className="text-[26px] font-bold leading-tight tracking-tight text-white sm:text-[30px]">
              {greeting}
            </h1>
            {streak > 0 && (
              <div className="mt-2 inline-flex items-center gap-1.5">
                <Flame className="h-4 w-4" style={{ color: theme.accent }} />
                <span className="text-sm text-white/70">
                  <span className="font-bold tabular-nums" style={{ color: theme.accent }}>
                    {streak}
                  </span>{' '}
                  {streak === 1 ? 'Tag' : 'Tage'} in Folge
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Body */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22 }}
          className="mt-9"
        >
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-14 animate-pulse rounded-xl bg-white/5" />
              <div className="h-14 animate-pulse rounded-xl bg-white/5" />
            </div>
          ) : mode === 'morning' ? (
            <MorningGate day={day} commitments={commitments} theme={theme} onComplete={onComplete} />
          ) : (
            <EveningGate
              day={day}
              commitments={commitments}
              fulfillment={fulfillment}
              theme={theme}
              onComplete={onComplete}
            />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ---------------------------------- Morning ---------------------------------- */

function MorningGate({
  day,
  commitments,
  theme,
  onComplete,
}: {
  day: string;
  commitments: Commitment[];
  theme: ModeTheme;
  onComplete: () => void;
}) {
  const [title, setTitle] = useState('');
  const create = useCreateCommitment(day);
  const remove = useDeleteCommitment(day);
  const atLimit = commitments.length >= MAX_COMMITMENTS_PER_DAY;
  const canStart = commitments.length > 0;

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed || atLimit || create.isPending) return;
    create.mutate(trimmed, { onSuccess: () => setTitle('') });
  };

  return (
    <div>
      <p className="text-[15px] text-white/55">
        Worauf committest du dich heute? <span className="text-white/30">(max. {MAX_COMMITMENTS_PER_DAY})</span>
      </p>

      <ul className="mt-4 space-y-2.5">
        {commitments.map((c, i) => (
          <motion.li
            key={c.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5"
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold tabular-nums"
              style={{ background: theme.accentSoft, color: theme.accent }}
            >
              {i + 1}
            </span>
            <span className="flex-1 text-[15px] text-white/90">{c.title}</span>
            <button
              type="button"
              onClick={() => remove.mutate(c.id)}
              className="text-white/25 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
              aria-label="Entfernen"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </motion.li>
        ))}
      </ul>

      {!atLimit && (
        <div className="mt-3 flex items-center gap-2.5">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="z.B. OR Übungsblatt, 90 Min"
            maxLength={200}
            className="flex-1 rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:outline-none"
            style={{ borderColor: title ? theme.ring : undefined }}
          />
          <button
            type="button"
            onClick={submit}
            disabled={!title.trim() || create.isPending}
            className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl font-medium text-black transition-all disabled:opacity-30"
            style={{ background: theme.accent }}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* CTA */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onComplete}
          disabled={!canStart}
          className="group flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[16px] font-semibold text-black transition-all disabled:cursor-not-allowed disabled:opacity-25"
          style={{ background: theme.accent, boxShadow: canStart ? `0 12px 40px -8px ${theme.ring}` : 'none' }}
        >
          Tag starten
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
        <button
          type="button"
          onClick={onComplete}
          className="text-[13px] text-white/35 transition-colors hover:text-white/60"
        >
          Heute keine Vorsätze — trotzdem rein
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------- Evening ---------------------------------- */

const ENERGY = [
  { value: 1, emoji: '😴', label: 'Müde' },
  { value: 2, emoji: '😐', label: 'Okay' },
  { value: 3, emoji: '💪', label: 'Stark' },
];

function EveningGate({
  day,
  commitments,
  fulfillment,
  theme,
  onComplete,
}: {
  day: string;
  commitments: Commitment[];
  fulfillment: { done: number; total: number; rate: number };
  theme: ModeTheme;
  onComplete: () => void;
}) {
  const { data: checkin } = useCheckin(day, 'evening');
  const upsert = useUpsertCheckin();
  const energy = checkin?.energy ?? null;
  const [journal, setJournal] = useState<string>(checkin?.journalText ?? '');

  const saveEnergy = (value: number) =>
    upsert.mutate({ date: day, type: 'evening', energy: value, journalText: journal || null });
  const saveJournal = () =>
    upsert.mutate({ date: day, type: 'evening', energy, journalText: journal || null });

  return (
    <div className="space-y-7">
      {commitments.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[15px] text-white/55">Heute committet</p>
            <span className="text-[13px] font-medium tabular-nums" style={{ color: theme.accent }}>
              {fulfillment.done}/{fulfillment.total} erledigt
            </span>
          </div>
          <ul className="space-y-2.5">
            {commitments.map((c) => (
              <EveningRow key={c.id} day={day} commitment={c} theme={theme} />
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-3 text-[15px] text-white/55">Wie war deine Energie heute?</p>
        <div className="grid grid-cols-3 gap-2.5">
          {ENERGY.map((opt) => {
            const active = energy === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => saveEnergy(opt.value)}
                className="flex flex-col items-center gap-1.5 rounded-xl border py-4 transition-all"
                style={{
                  borderColor: active ? theme.ring : 'rgba(255,255,255,0.10)',
                  background: active ? theme.accentSoft : 'rgba(255,255,255,0.02)',
                }}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="text-[13px] text-white/70">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-3 text-[15px] text-white/55">
          Journal <span className="text-white/30">(optional)</span>
        </p>
        <textarea
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          onBlur={saveJournal}
          placeholder="Was lief gut, was hat dich rausgebracht?"
          rows={3}
          maxLength={4000}
          className="w-full resize-none rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-[15px] text-white placeholder:text-white/30 focus:outline-none"
        />
      </div>

      <button
        type="button"
        onClick={onComplete}
        className="group flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[16px] font-semibold text-black transition-all"
        style={{ background: theme.accent, boxShadow: `0 12px 40px -8px ${theme.ring}` }}
      >
        Tag abschließen
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}

function EveningRow({
  day,
  commitment,
  theme,
}: {
  day: string;
  commitment: Commitment;
  theme: ModeTheme;
}) {
  const setStatus = useSetCommitmentStatus(day);
  const [reason, setReason] = useState(commitment.missedReason ?? '');
  const done = commitment.status === 'done';
  const missed = commitment.status === 'missed';

  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span className={`flex-1 text-[15px] ${done ? 'text-white/35 line-through' : 'text-white/90'}`}>
          {commitment.title}
        </span>
        <button
          type="button"
          onClick={() => setStatus.mutate({ id: commitment.id, status: 'done' })}
          className="flex h-8 w-8 items-center justify-center rounded-full border transition-all"
          style={{
            borderColor: done ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.12)',
            background: done ? 'rgba(16,185,129,0.15)' : 'transparent',
            color: done ? '#6ee7b7' : 'rgba(255,255,255,0.4)',
          }}
          aria-label="Erledigt"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setStatus.mutate({ id: commitment.id, status: 'missed', missedReason: reason || null })}
          className="flex h-8 w-8 items-center justify-center rounded-full border transition-all"
          style={{
            borderColor: missed ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.12)',
            background: missed ? 'rgba(248,113,113,0.15)' : 'transparent',
            color: missed ? '#fca5a5' : 'rgba(255,255,255,0.4)',
          }}
          aria-label="Nicht geschafft"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {missed && (
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setStatus.mutate({ id: commitment.id, status: 'missed', missedReason: reason || null })}
          placeholder="Was kam dazwischen? (optional)"
          maxLength={500}
          className="mt-2.5 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[14px] text-white placeholder:text-white/25 focus:outline-none"
          style={{ borderColor: reason ? theme.ring : undefined }}
        />
      )}
    </li>
  );
}
