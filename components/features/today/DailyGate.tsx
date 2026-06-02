'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Check, X, Trash2, ArrowRight, ArrowLeft, Flame, Moon, Sunrise,
  GraduationCap, ShieldCheck, Dumbbell, Brain, NotebookPen,
} from 'lucide-react';
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
import type { Commitment, CheckinResponses } from '@/lib/supabase/dailyBriefing';

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
  bg: string;
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
  const { data: checkin } = useCheckin(day, mode === 'morning' ? 'morning' : 'evening');
  const upsert = useUpsertCheckin();

  const commitments = data?.commitments ?? [];
  const streak = data?.streak ?? 0;
  const fulfillment = data?.fulfillment ?? { done: 0, total: 0, rate: 0 };

  // Local accumulated check-in state.
  const [responses, setResponses] = useState<CheckinResponses>({});
  const [energy, setEnergy] = useState<number | null>(null);
  const [journal, setJournal] = useState('');
  const [hydratedCheckin, setHydratedCheckin] = useState(false);
  if (checkin && !hydratedCheckin) {
    setResponses(checkin.responses ?? {});
    setEnergy(checkin.energy ?? null);
    setJournal(checkin.journalText ?? '');
    setHydratedCheckin(true);
  }

  const persist = (next: {
    responses?: CheckinResponses;
    energy?: number | null;
    journal?: string;
  }) => {
    upsert.mutate({
      date: day,
      type: mode,
      energy: next.energy !== undefined ? next.energy : energy,
      journalText: (next.journal !== undefined ? next.journal : journal) || null,
      responses: next.responses ?? responses,
    });
  };

  const patchResponses = (patch: Partial<CheckinResponses>) => {
    const merged = { ...responses, ...patch };
    setResponses(merged);
    persist({ responses: merged });
  };

  const greeting = useMemo(() => {
    const input = { streak, fulfillmentRate: fulfillment.rate, commitmentCount: commitments.length };
    return mode === 'morning' ? getMorningGreeting(input) : getEveningGreeting(input);
  }, [mode, streak, fulfillment.rate, commitments.length]);

  // Steps per mode.
  const steps = mode === 'morning' ? ['commitments', 'intent'] : ['commitments', 'study', 'finance', 'body', 'focus', 'reflect'];
  const [step, setStep] = useState(0);
  const isLast = step === steps.length - 1;
  const current = steps[step];

  const canAdvance = current === 'commitments' && mode === 'morning' ? commitments.length > 0 : true;

  const next = () => {
    if (isLast) {
      persist({});
      onComplete();
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

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
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 blur-3xl" style={{ background: theme.glowA }} />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[420px] w-[420px] translate-x-1/4 translate-y-1/4 blur-3xl" style={{ background: theme.glowB }} />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4" style={{ color: theme.accent }} />
          <span className="text-[12px] font-semibold uppercase tracking-[0.32em]" style={{ color: theme.accent }}>
            {theme.label}
          </span>
          <span className="text-[12px] uppercase tracking-[0.18em] text-white/35">· {formatLongDate(day)}</span>
        </div>

        {/* Lucian + greeting */}
        <div className="mt-6 flex items-start gap-5">
          <div className="relative shrink-0 rounded-2xl p-2" style={{ background: theme.accentSoft, boxShadow: `0 0 40px ${theme.accentSoft}` }}>
            <LucianSpriteAnimator animation={lucianPose} size={64} />
          </div>
          <div className="pt-1">
            <h1 className="text-[24px] font-bold leading-tight tracking-tight text-white sm:text-[28px]">{greeting}</h1>
            {streak > 0 && (
              <div className="mt-1.5 inline-flex items-center gap-1.5">
                <Flame className="h-4 w-4" style={{ color: theme.accent }} />
                <span className="text-sm text-white/70">
                  <span className="font-bold tabular-nums" style={{ color: theme.accent }}>{streak}</span>{' '}
                  {streak === 1 ? 'Tag' : 'Tage'} in Folge
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Progress dots */}
        <div className="mt-7 flex items-center gap-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className="h-1.5 flex-1 rounded-full transition-all duration-300"
              style={{ background: i <= step ? theme.accent : 'rgba(255,255,255,0.10)' }}
            />
          ))}
        </div>

        {/* Step body */}
        <div className="mt-8 min-h-[280px]">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-14 animate-pulse rounded-xl bg-white/5" />
              <div className="h-14 animate-pulse rounded-xl bg-white/5" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.28 }}
              >
                {current === 'commitments' && (
                  <CommitmentsStep day={day} mode={mode} commitments={commitments} theme={theme} />
                )}
                {current === 'intent' && (
                  <IntentStep
                    theme={theme}
                    value={responses.morningIntent ?? ''}
                    onChange={(v) => setResponses((r) => ({ ...r, morningIntent: v }))}
                    onBlur={() => persist({})}
                  />
                )}
                {current === 'study' && (
                  <YesNoStep
                    theme={theme} icon={GraduationCap} title="Studium"
                    question="Hast du heute gelernt?"
                    value={responses.studied}
                    onPick={(v) => patchResponses({ studied: v })}
                  />
                )}
                {current === 'finance' && (
                  <FinanceStep theme={theme} responses={responses} onPatch={patchResponses} />
                )}
                {current === 'body' && (
                  <BodyStep theme={theme} responses={responses} onPatch={patchResponses} />
                )}
                {current === 'focus' && (
                  <ScaleStep
                    theme={theme} icon={Brain} title="Fokus & Disziplin"
                    question="Wie fokussiert war dein Tag?"
                    labels={['Zerstreut', 'Okay', 'Sehr fokussiert']}
                    value={responses.focus ?? null}
                    onPick={(v) => patchResponses({ focus: v })}
                  />
                )}
                {current === 'reflect' && (
                  <ReflectStep
                    theme={theme}
                    energy={energy} onEnergy={(v) => { setEnergy(v); persist({ energy: v }); }}
                    journal={journal} onJournal={setJournal} onJournalBlur={() => persist({})}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={back}
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl border border-white/12 text-white/50 transition-colors hover:text-white"
              aria-label="Zurück"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            onClick={next}
            disabled={!canAdvance}
            className="group flex flex-1 items-center justify-center gap-2 rounded-xl py-4 text-[16px] font-semibold text-black transition-all disabled:cursor-not-allowed disabled:opacity-25"
            style={{ background: theme.accent, boxShadow: canAdvance ? `0 12px 40px -8px ${theme.ring}` : 'none' }}
          >
            {isLast ? (mode === 'morning' ? 'Tag starten' : 'Tag abschließen') : 'Weiter'}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Morning escape on first step */}
        {mode === 'morning' && current === 'commitments' && commitments.length === 0 && (
          <button
            type="button"
            onClick={onComplete}
            className="mt-3 text-center text-[13px] text-white/35 transition-colors hover:text-white/60"
          >
            Heute keine Vorsätze — trotzdem rein
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------- Step pieces ------------------------------- */

function StepHeading({ icon: Icon, title, question, accent }: {
  icon: typeof GraduationCap; title: string; question: string; accent: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: accent }} />
        <span className="text-[12px] font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>{title}</span>
      </div>
      <p className="mt-2 text-[19px] font-semibold text-white">{question}</p>
    </div>
  );
}

function YesNoButtons({ value, onPick, theme }: {
  value: boolean | undefined; onPick: (v: boolean) => void; theme: ModeTheme;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[{ v: true, label: 'Ja' }, { v: false, label: 'Nein' }].map(({ v, label }) => {
        const active = value === v;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onPick(v)}
            className="rounded-xl border py-5 text-[16px] font-medium transition-all"
            style={{
              borderColor: active ? theme.ring : 'rgba(255,255,255,0.10)',
              background: active ? theme.accentSoft : 'rgba(255,255,255,0.02)',
              color: active ? '#fff' : 'rgba(255,255,255,0.6)',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Scale({ value, onPick, labels, theme, count = 3 }: {
  value: number | null; onPick: (v: number) => void; labels?: string[]; theme: ModeTheme; count?: number;
}) {
  return (
    <div className={`grid gap-2.5`} style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
      {Array.from({ length: count }).map((_, i) => {
        const v = i + 1;
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onPick(v)}
            className="flex flex-col items-center gap-1 rounded-xl border py-4 transition-all"
            style={{
              borderColor: active ? theme.ring : 'rgba(255,255,255,0.10)',
              background: active ? theme.accentSoft : 'rgba(255,255,255,0.02)',
            }}
          >
            <span className="text-[17px] font-bold tabular-nums" style={{ color: active ? theme.accent : 'rgba(255,255,255,0.5)' }}>{v}</span>
            {labels?.[i] && <span className="text-[11px] text-white/50">{labels[i]}</span>}
          </button>
        );
      })}
    </div>
  );
}

function YesNoStep({ icon, title, question, value, onPick, theme }: {
  icon: typeof GraduationCap; title: string; question: string;
  value: boolean | undefined; onPick: (v: boolean) => void; theme: ModeTheme;
}) {
  return (
    <div>
      <StepHeading icon={icon} title={title} question={question} accent={theme.accent} />
      <YesNoButtons value={value} onPick={onPick} theme={theme} />
    </div>
  );
}

function ScaleStep({ icon, title, question, labels, value, onPick, theme }: {
  icon: typeof GraduationCap; title: string; question: string; labels: string[];
  value: number | null; onPick: (v: number) => void; theme: ModeTheme;
}) {
  return (
    <div>
      <StepHeading icon={icon} title={title} question={question} accent={theme.accent} />
      <Scale value={value} onPick={onPick} labels={labels} theme={theme} count={3} />
    </div>
  );
}

function FinanceStep({ theme, responses, onPatch }: {
  theme: ModeTheme; responses: CheckinResponses; onPatch: (p: Partial<CheckinResponses>) => void;
}) {
  return (
    <div>
      <StepHeading icon={ShieldCheck} title="Finanzen & Anti-Gambling" question="Bist du heute clean geblieben?" accent={theme.accent} />
      <YesNoButtons value={responses.clean} onPick={(v) => onPatch({ clean: v })} theme={theme} />
      <p className="mb-3 mt-6 text-[15px] text-white/55">Wie stark war der Drang heute?</p>
      <Scale
        value={responses.gamblingRisk ?? null}
        onPick={(v) => onPatch({ gamblingRisk: v })}
        labels={['Kein', '', 'Mittel', '', 'Stark']}
        theme={theme}
        count={5}
      />
    </div>
  );
}

function BodyStep({ theme, responses, onPatch }: {
  theme: ModeTheme; responses: CheckinResponses; onPatch: (p: Partial<CheckinResponses>) => void;
}) {
  return (
    <div>
      <StepHeading icon={Dumbbell} title="Körper" question="Warst du heute im Gym?" accent={theme.accent} />
      <YesNoButtons value={responses.gym} onPick={(v) => onPatch({ gym: v })} theme={theme} />
      <p className="mb-3 mt-6 text-[15px] text-white/55">Wie hast du geschlafen?</p>
      <Scale
        value={responses.sleep ?? null}
        onPick={(v) => onPatch({ sleep: v })}
        labels={['Schlecht', 'Okay', 'Gut']}
        theme={theme}
        count={3}
      />
    </div>
  );
}

function IntentStep({ theme, value, onChange, onBlur }: {
  theme: ModeTheme; value: string; onChange: (v: string) => void; onBlur: () => void;
}) {
  return (
    <div>
      <StepHeading icon={NotebookPen} title="Fokus heute" question="Worauf willst du heute besonders achten?" accent={theme.accent} />
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="z.B. Nachmittag verplanen, kein Insta vor dem ersten Block …"
        rows={3}
        maxLength={500}
        className="w-full resize-none rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-[15px] text-white placeholder:text-white/30 focus:outline-none"
      />
    </div>
  );
}

const ENERGY = [
  { value: 1, emoji: '😴', label: 'Müde' },
  { value: 2, emoji: '😐', label: 'Okay' },
  { value: 3, emoji: '💪', label: 'Stark' },
];

function ReflectStep({ theme, energy, onEnergy, journal, onJournal, onJournalBlur }: {
  theme: ModeTheme;
  energy: number | null; onEnergy: (v: number) => void;
  journal: string; onJournal: (v: string) => void; onJournalBlur: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <StepHeading icon={NotebookPen} title="Reflexion" question="Wie war deine Energie heute?" accent={theme.accent} />
        <div className="grid grid-cols-3 gap-2.5">
          {ENERGY.map((opt) => {
            const active = energy === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onEnergy(opt.value)}
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
        <p className="mb-3 text-[15px] text-white/55">Journal <span className="text-white/30">(optional)</span></p>
        <textarea
          value={journal}
          onChange={(e) => onJournal(e.target.value)}
          onBlur={onJournalBlur}
          placeholder="Was lief gut, was hat dich rausgebracht?"
          rows={3}
          maxLength={4000}
          className="w-full resize-none rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-[15px] text-white placeholder:text-white/30 focus:outline-none"
        />
      </div>
    </div>
  );
}

/* ----------------------------- Commitments step ---------------------------- */

function CommitmentsStep({ day, mode, commitments, theme }: {
  day: string; mode: BriefingMode; commitments: Commitment[]; theme: ModeTheme;
}) {
  const [title, setTitle] = useState('');
  const create = useCreateCommitment(day);
  const remove = useDeleteCommitment(day);
  const atLimit = commitments.length >= MAX_COMMITMENTS_PER_DAY;

  const submit = () => {
    const t = title.trim();
    if (!t || atLimit || create.isPending) return;
    create.mutate(t, { onSuccess: () => setTitle('') });
  };

  if (mode === 'evening') {
    return (
      <div>
        <StepHeading
          icon={NotebookPen}
          title="Commitments"
          question={commitments.length > 0 ? 'Was hast du heute geschafft?' : 'Heute früh hast du nichts festgelegt.'}
          accent={theme.accent}
        />
        {commitments.length > 0 ? (
          <ul className="space-y-2.5">
            {commitments.map((c) => <EveningRow key={c.id} day={day} commitment={c} theme={theme} />)}
          </ul>
        ) : (
          <p className="text-[14px] text-white/40">Kein Problem — weiter zur Reflexion.</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <StepHeading icon={NotebookPen} title="Commitments" question="Worauf committest du dich heute?" accent={theme.accent} />
      <ul className="space-y-2.5">
        {commitments.map((c, i) => (
          <li key={c.id} className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold tabular-nums" style={{ background: theme.accentSoft, color: theme.accent }}>{i + 1}</span>
            <span className="flex-1 text-[15px] text-white/90">{c.title}</span>
            <button type="button" onClick={() => remove.mutate(c.id)} className="text-white/25 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100" aria-label="Entfernen">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
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
          <button type="button" onClick={submit} disabled={!title.trim() || create.isPending} className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl text-black transition-all disabled:opacity-30" style={{ background: theme.accent }}>
            <Plus className="h-5 w-5" />
          </button>
        </div>
      )}
      <p className="mt-3 text-[13px] text-white/30">{commitments.length}/{MAX_COMMITMENTS_PER_DAY} · mind. 1 zum Starten</p>
    </div>
  );
}

function EveningRow({ day, commitment, theme }: { day: string; commitment: Commitment; theme: ModeTheme }) {
  const setStatus = useSetCommitmentStatus(day);
  const [reason, setReason] = useState(commitment.missedReason ?? '');
  const done = commitment.status === 'done';
  const missed = commitment.status === 'missed';

  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span className={`flex-1 text-[15px] ${done ? 'text-white/35 line-through' : 'text-white/90'}`}>{commitment.title}</span>
        <button
          type="button"
          onClick={() => setStatus.mutate({ id: commitment.id, status: 'done' })}
          className="flex h-8 w-8 items-center justify-center rounded-full border transition-all"
          style={{ borderColor: done ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.12)', background: done ? 'rgba(16,185,129,0.15)' : 'transparent', color: done ? '#6ee7b7' : 'rgba(255,255,255,0.4)' }}
          aria-label="Erledigt"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setStatus.mutate({ id: commitment.id, status: 'missed', missedReason: reason || null })}
          className="flex h-8 w-8 items-center justify-center rounded-full border transition-all"
          style={{ borderColor: missed ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.12)', background: missed ? 'rgba(248,113,113,0.15)' : 'transparent', color: missed ? '#fca5a5' : 'rgba(255,255,255,0.4)' }}
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
