'use client';

import { useMemo, useState } from 'react';
import { Sunrise, Moon, Plus, Check, X, Flame, Trash2 } from 'lucide-react';
import {
  useDayBriefing,
  useCheckin,
  useCreateCommitment,
  useSetCommitmentStatus,
  useDeleteCommitment,
  useUpsertCheckin,
  todayKey,
} from '@/lib/hooks/useBriefing';
import { resolveBriefingMode, MAX_COMMITMENTS_PER_DAY, type BriefingMode } from '@/lib/dashboard/briefing';
import { getMorningGreeting, getEveningGreeting } from '@/lib/lucian/briefingCopy';
import type { Commitment } from '@/lib/supabase/dailyBriefing';

const ENERGY_OPTIONS: { value: number; emoji: string; label: string }[] = [
  { value: 1, emoji: '😴', label: 'Müde' },
  { value: 2, emoji: '😐', label: 'Okay' },
  { value: 3, emoji: '💪', label: 'Stark' },
];

export interface BriefingCardProps {
  date?: string | undefined;
}

export default function BriefingCard({ date }: BriefingCardProps) {
  const day = date ?? todayKey();
  const [mode, setMode] = useState<BriefingMode>(() => resolveBriefingMode(new Date()));

  const { data, isLoading, isError } = useDayBriefing(day);

  const commitments = data?.commitments ?? [];
  const streak = data?.streak ?? 0;
  const fulfillment = data?.fulfillment ?? { done: 0, total: 0, rate: 0 };

  const greeting = useMemo(() => {
    const input = {
      streak,
      fulfillmentRate: fulfillment.rate,
      commitmentCount: commitments.length,
    };
    return mode === 'morning' ? getMorningGreeting(input) : getEveningGreeting(input);
  }, [mode, streak, fulfillment.rate, commitments.length]);

  return (
    <div className="card-surface rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/12 text-primary">
            {mode === 'morning' ? <Sunrise className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </div>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-tertiary">
              {mode === 'morning' ? 'Morgen-Briefing' : 'Abend-Briefing'}
            </div>
            <p className="mt-0.5 text-sm text-text-primary">{greeting}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2.5 py-1 text-[12px] font-medium text-amber-300">
              <Flame className="h-3.5 w-3.5" />
              {streak}
            </span>
          )}
          <button
            type="button"
            onClick={() => setMode((m) => (m === 'morning' ? 'evening' : 'morning'))}
            className="rounded-full border border-border px-2.5 py-1 text-[11px] text-text-tertiary transition-colors hover:text-text-primary"
            title="Modus wechseln"
          >
            {mode === 'morning' ? 'Abend' : 'Morgen'}
          </button>
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <BriefingSkeleton />
        ) : isError ? (
          <p className="text-sm text-text-tertiary">Briefing konnte nicht geladen werden.</p>
        ) : mode === 'morning' ? (
          <MorningView day={day} commitments={commitments} />
        ) : (
          <EveningView day={day} commitments={commitments} fulfillmentLabel={`${fulfillment.done}/${fulfillment.total}`} />
        )}
      </div>
    </div>
  );
}

function BriefingSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-9 animate-pulse rounded-lg bg-surface-hover/60" />
      <div className="h-9 animate-pulse rounded-lg bg-surface-hover/40" />
    </div>
  );
}

function MorningView({ day, commitments }: { day: string; commitments: Commitment[] }) {
  const [title, setTitle] = useState('');
  const create = useCreateCommitment(day);
  const remove = useDeleteCommitment(day);
  const atLimit = commitments.length >= MAX_COMMITMENTS_PER_DAY;

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed || atLimit || create.isPending) return;
    create.mutate(trimmed, { onSuccess: () => setTitle('') });
  };

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-text-secondary">
        Worauf committest du dich heute? (max. {MAX_COMMITMENTS_PER_DAY})
      </p>

      <ul className="space-y-1.5">
        {commitments.map((c, i) => (
          <li
            key={c.id}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface-hover/30 px-3 py-2"
          >
            <span className="text-[12px] font-mono text-text-tertiary">{i + 1}</span>
            <span className="flex-1 text-sm text-text-primary">{c.title}</span>
            <button
              type="button"
              onClick={() => remove.mutate(c.id)}
              className="text-text-tertiary transition-colors hover:text-red-400"
              aria-label="Commitment löschen"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {!atLimit && (
        <div className="flex items-center gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            placeholder="z.B. OR Übungsblatt, 90 Min"
            maxLength={200}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!title.trim() || create.isPending}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function EveningView({
  day,
  commitments,
  fulfillmentLabel,
}: {
  day: string;
  commitments: Commitment[];
  fulfillmentLabel: string;
}) {
  return (
    <div className="space-y-4">
      {commitments.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-text-secondary">Heute committet:</p>
            <span className="text-[12px] font-mono text-text-tertiary">{fulfillmentLabel} erledigt</span>
          </div>
          <ul className="space-y-1.5">
            {commitments.map((c) => (
              <EveningCommitmentRow key={c.id} day={day} commitment={c} />
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-[13px] text-text-tertiary">
          Heute früh hast du nichts festgelegt. Trotzdem: wie war dein Tag?
        </p>
      )}

      <EveningCheckin day={day} />
    </div>
  );
}

function EveningCommitmentRow({ day, commitment }: { day: string; commitment: Commitment }) {
  const setStatus = useSetCommitmentStatus(day);
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState(commitment.missedReason ?? '');

  const done = commitment.status === 'done';
  const missed = commitment.status === 'missed';

  return (
    <li className="rounded-lg border border-border bg-surface-hover/30 px-3 py-2">
      <div className="flex items-center gap-2">
        <span
          className={`flex-1 text-sm ${
            done ? 'text-text-tertiary line-through' : 'text-text-primary'
          }`}
        >
          {commitment.title}
        </span>
        <button
          type="button"
          onClick={() => setStatus.mutate({ id: commitment.id, status: 'done' })}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
            done
              ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
              : 'border-border text-text-tertiary hover:text-emerald-300'
          }`}
          aria-label="Erledigt"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setShowReason(true);
            setStatus.mutate({ id: commitment.id, status: 'missed', missedReason: reason || null });
          }}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
            missed
              ? 'border-red-500/50 bg-red-500/15 text-red-300'
              : 'border-border text-text-tertiary hover:text-red-300'
          }`}
          aria-label="Nicht geschafft"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {missed && showReason && (
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() =>
            setStatus.mutate({ id: commitment.id, status: 'missed', missedReason: reason || null })
          }
          placeholder="Was kam dazwischen? (optional)"
          maxLength={500}
          className="mt-2 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
        />
      )}
    </li>
  );
}

function EveningCheckin({ day }: { day: string }) {
  const { data: checkin } = useCheckin(day, 'evening');
  const upsert = useUpsertCheckin();

  const energy = checkin?.energy ?? null;
  const [journal, setJournal] = useState<string>(checkin?.journalText ?? '');

  const saveEnergy = (value: number) => {
    upsert.mutate({ date: day, type: 'evening', energy: value, journalText: journal || null });
  };

  const saveJournal = () => {
    upsert.mutate({ date: day, type: 'evening', energy, journalText: journal || null });
  };

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <div>
        <p className="mb-1.5 text-[13px] text-text-secondary">Energie heute</p>
        <div className="flex gap-2">
          {ENERGY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => saveEnergy(opt.value)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-sm transition-colors ${
                energy === opt.value
                  ? 'border-primary bg-primary/10 text-text-primary'
                  : 'border-border text-text-tertiary hover:text-text-primary'
              }`}
            >
              <span className="text-base">{opt.emoji}</span>
              <span className="text-[12px]">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[13px] text-text-secondary">
          Journal <span className="text-text-tertiary">(optional)</span>
        </p>
        <textarea
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          onBlur={saveJournal}
          placeholder="Was lief gut, was hat dich rausgebracht?"
          rows={2}
          maxLength={4000}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
        />
      </div>
    </div>
  );
}
