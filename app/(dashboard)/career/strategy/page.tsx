'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Flame, Plus, Sparkles, Target, Trash2 } from 'lucide-react';
import { useSoundToast } from '@/lib/hooks/useSoundToast';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { DecisionSurfaceCard } from '@/components/ui/DecisionSurfaceCard';
import { cn } from '@/lib/utils';
import { buildStrategyCommitReadiness } from '@/lib/strategy/readiness';
import { computeStrategyOptionScoreWithMode, scoreStrategyOptions, type StrategyScoreMode } from '@/lib/strategy/scoring';
import { DASHBOARD_NEXT_TASKS_QUERY_PREFIX } from '@/lib/dashboard/nextTasksClient';

type StrategyDecisionStatus = 'draft' | 'committed' | 'archived';

interface StrategyOption {
  id: string;
  decisionId: string;
  title: string;
  summary: string | null;
  impactPotential: number;
  confidenceLevel: number;
  strategicFit: number;
  effortCost: number;
  downsideRisk: number;
  timeToValueWeeks: number;
  createdAt: string;
  updatedAt: string;
}

interface StrategyCommit {
  id: string;
  optionId: string;
  createdAt: string;
  note: string | null;
  taskSourceKey?: string;
}

interface StrategyDecision {
  id: string;
  title: string;
  context: string | null;
  targetDate: string | null;
  status: StrategyDecisionStatus;
  lastScoreTotal: number | null;
  lastScoredAt: string | null;
  lastWinnerOptionId: string | null;
  createdAt: string;
  updatedAt: string;
  options: StrategyOption[];
  latestCommit: StrategyCommit | null;
  recentCommits?: StrategyCommit[];
}

interface DecisionsResponse {
  decisions: StrategyDecision[];
}

interface ScoreResponse {
  winner: {
    optionId: string;
    total: number;
  } | null;
  scoredOptions: Array<{
    optionId: string;
    title: string;
    total: number;
    breakdown: {
      impact: number;
      confidence: number;
      fit: number;
      effortPenalty: number;
      riskPenalty: number;
      speedPenalty: number;
    };
  }>;
  scoreMode?: StrategyScoreMode;
}

const EMPTY_DECISIONS: StrategyDecision[] = [];

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.error?.message || payload?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

function toDateInputValue(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

function clampScoreValue(raw: string): number {
  const value = Number(raw);
  if (Number.isNaN(value)) return 1;
  return Math.max(1, Math.min(10, Math.round(value)));
}

function clampWeeksValue(raw: string): number {
  const value = Number(raw);
  if (Number.isNaN(value)) return 1;
  return Math.max(1, Math.min(104, Math.round(value)));
}

function statusVariant(status: StrategyDecisionStatus): 'success' | 'warning' | 'default' {
  if (status === 'committed') return 'success';
  if (status === 'draft') return 'warning';
  return 'default';
}

function formatCommitTimestamp(iso: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function addDaysToDateInput(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0] ?? isoDate;
}

function describeScoreBand(value: number, tone: 'positive' | 'negative'): string {
  if (tone === 'positive') {
    if (value <= 3) return 'niedrig';
    if (value <= 7) return 'mittel';
    return 'hoch';
  }
  if (value <= 3) return 'gering';
  if (value <= 7) return 'mittel';
  return 'hoch';
}

interface ScoreInputCardProps {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  tone: 'positive' | 'negative';
  weightLabel: string;
}

function ScoreInputCard({ label, description, value, onChange, tone, weightLabel }: ScoreInputCardProps) {
  const band = describeScoreBand(value, tone);
  const cardToneClasses =
    tone === 'positive'
      ? 'border-emerald-500/22 bg-gradient-to-br from-emerald-500/[0.12] via-emerald-500/[0.05] to-transparent'
      : 'border-amber-500/22 bg-gradient-to-br from-amber-500/[0.12] via-amber-500/[0.05] to-transparent';
  const chipToneClasses =
    tone === 'positive'
      ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300'
      : 'border-amber-500/35 bg-amber-500/15 text-amber-300';
  const hint = tone === 'positive' ? 'Höher = stärkerer Plus-Beitrag' : 'Höher = stärkere Minus-Strafe';

  return (
    <div className={cn('rounded-xl border px-3 py-2 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.75)] backdrop-blur-[1px]', cardToneClasses)}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-text-primary">{label}</p>
        <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', chipToneClasses)}>
          {value}/10 · {band}
        </span>
      </div>
      <p className="text-[11px] text-text-tertiary">{description}</p>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={(event) => onChange(clampScoreValue(event.target.value))}
          className="h-1.5 w-full cursor-pointer accent-primary"
        />
        <Input
          type="number"
          min={1}
          max={10}
          value={value}
          onChange={(event) => onChange(clampScoreValue(event.target.value))}
          inputSize="sm"
          className="w-[72px]"
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-text-tertiary">
        <span>1</span>
        <span>{hint}</span>
        <span>10 · {weightLabel}</span>
      </div>
    </div>
  );
}

type StrategyPreset = {
  id: 'conservative' | 'balanced' | 'aggressive';
  label: string;
  description: string;
  values: {
    impactPotential: number;
    confidenceLevel: number;
    strategicFit: number;
    effortCost: number;
    downsideRisk: number;
    timeToValueWeeks: number;
  };
};

const STRATEGY_PRESETS: StrategyPreset[] = [
  {
    id: 'conservative',
    label: 'Conservative',
    description: 'Risikoarm, eher sichere Optionen',
    values: {
      impactPotential: 6,
      confidenceLevel: 8,
      strategicFit: 7,
      effortCost: 4,
      downsideRisk: 3,
      timeToValueWeeks: 8,
    },
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Standardprofil für normale Trade-offs',
    values: {
      impactPotential: 7,
      confidenceLevel: 6,
      strategicFit: 7,
      effortCost: 5,
      downsideRisk: 4,
      timeToValueWeeks: 6,
    },
  },
  {
    id: 'aggressive',
    label: 'Aggressive',
    description: 'Maximaler Hebel bei höherem Risiko',
    values: {
      impactPotential: 9,
      confidenceLevel: 5,
      strategicFit: 8,
      effortCost: 7,
      downsideRisk: 6,
      timeToValueWeeks: 4,
    },
  },
];

type TrajectoryGoalCategory = 'thesis' | 'gmat' | 'master_app' | 'internship' | 'other';

function inferTrajectoryCategory(input: string): TrajectoryGoalCategory {
  const normalized = input.toLowerCase();
  if (normalized.includes('gmat')) return 'gmat';
  if (normalized.includes('thesis') || normalized.includes('bachelor')) return 'thesis';
  if (normalized.includes('master')) return 'master_app';
  if (normalized.includes('intern') || normalized.includes('prakt')) return 'internship';
  return 'other';
}

export default function StrategyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const soundToast = useSoundToast();
  const [selectedDecisionId, setSelectedDecisionId] = useState<string>('');
  const [decisionTitle, setDecisionTitle] = useState('');
  const [decisionContext, setDecisionContext] = useState('');
  const [decisionTargetDate, setDecisionTargetDate] = useState(toDateInputValue(new Date()));

  const [editingDecisionTitle, setEditingDecisionTitle] = useState('');
  const [editingDecisionContext, setEditingDecisionContext] = useState('');
  const [editingDecisionTargetDate, setEditingDecisionTargetDate] = useState('');

  const [optionTitle, setOptionTitle] = useState('');
  const [optionSummary, setOptionSummary] = useState('');
  const [impactPotential, setImpactPotential] = useState(7);
  const [confidenceLevel, setConfidenceLevel] = useState(6);
  const [strategicFit, setStrategicFit] = useState(7);
  const [effortCost, setEffortCost] = useState(5);
  const [downsideRisk, setDownsideRisk] = useState(4);
  const [timeToValueWeeks, setTimeToValueWeeks] = useState(6);
  const [activePreset, setActivePreset] = useState<StrategyPreset['id']>('balanced');
  const [scoreMode, setScoreMode] = useState<StrategyScoreMode>('standard');

  const [commitNote, setCommitNote] = useState('');
  const [followUpEnabled, setFollowUpEnabled] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['strategy', 'decisions'],
    queryFn: () => apiRequest<DecisionsResponse>('/api/strategy/decisions'),
    staleTime: 15 * 1000,
    refetchOnWindowFocus: false,
  });

  const decisions = useMemo(() => data?.decisions ?? EMPTY_DECISIONS, [data?.decisions]);

  useEffect(() => {
    if (!decisions.length) {
      setSelectedDecisionId('');
      return;
    }

    setSelectedDecisionId((current) => {
      if (current && decisions.some((decision) => decision.id === current)) return current;
      return decisions[0]?.id ?? '';
    });
  }, [decisions]);

  const selectedDecision = useMemo(
    () => decisions.find((decision) => decision.id === selectedDecisionId) ?? null,
    [decisions, selectedDecisionId]
  );

  useEffect(() => {
    if (!selectedDecision) {
      setEditingDecisionTitle('');
      setEditingDecisionContext('');
      setEditingDecisionTargetDate('');
      return;
    }

    setEditingDecisionTitle(selectedDecision.title);
    setEditingDecisionContext(selectedDecision.context ?? '');
    setEditingDecisionTargetDate(selectedDecision.targetDate ?? '');
  }, [selectedDecision]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const prefillDecisionTitle = url.searchParams.get('prefillDecisionTitle')?.trim() ?? '';
    const prefillDecisionContext = url.searchParams.get('prefillDecisionContext')?.trim() ?? '';
    const prefillTargetDate = url.searchParams.get('prefillTargetDate')?.trim() ?? '';
    const prefillOptionTitle = url.searchParams.get('prefillOptionTitle')?.trim() ?? '';
    const prefillOptionSummary = url.searchParams.get('prefillOptionSummary')?.trim() ?? '';

    const hasPrefill =
      Boolean(prefillDecisionTitle) ||
      Boolean(prefillDecisionContext) ||
      Boolean(prefillOptionTitle) ||
      Boolean(prefillOptionSummary);

    if (!hasPrefill) return;

    setDecisionTitle(prefillDecisionTitle);
    setDecisionContext(prefillDecisionContext);
    setDecisionTargetDate(prefillTargetDate || toDateInputValue(new Date()));
    setOptionTitle(prefillOptionTitle);
    setOptionSummary(prefillOptionSummary);
    setImpactPotential(clampScoreValue(url.searchParams.get('prefillImpactPotential') ?? '7'));
    setConfidenceLevel(clampScoreValue(url.searchParams.get('prefillConfidenceLevel') ?? '6'));
    setStrategicFit(clampScoreValue(url.searchParams.get('prefillStrategicFit') ?? '7'));
    setEffortCost(clampScoreValue(url.searchParams.get('prefillEffortCost') ?? '5'));
    setDownsideRisk(clampScoreValue(url.searchParams.get('prefillDownsideRisk') ?? '4'));
    setTimeToValueWeeks(clampWeeksValue(url.searchParams.get('prefillTimeToValueWeeks') ?? '6'));
    soundToast.success('Career-Lead in Strategy übernommen.');

    [
      'prefillDecisionTitle',
      'prefillDecisionContext',
      'prefillTargetDate',
      'prefillOptionTitle',
      'prefillOptionSummary',
      'prefillImpactPotential',
      'prefillConfidenceLevel',
      'prefillStrategicFit',
      'prefillEffortCost',
      'prefillDownsideRisk',
      'prefillTimeToValueWeeks',
    ].forEach((key) => url.searchParams.delete(key));

    const nextUrl = `${url.pathname}${url.searchParams.toString() ? `?${url.searchParams.toString()}` : ''}`;
    window.history.replaceState({}, '', nextUrl);
  }, [soundToast]);

  const localScore = useMemo(() => {
    if (!selectedDecision) return { winner: null as null | { optionId: string; total: number }, scoredOptions: [] as ScoreResponse['scoredOptions'] };

    const result = scoreStrategyOptions(
      selectedDecision.options.map((option) => ({
        id: option.id,
        title: option.title,
        impactPotential: option.impactPotential,
        confidenceLevel: option.confidenceLevel,
        strategicFit: option.strategicFit,
        effortCost: option.effortCost,
        downsideRisk: option.downsideRisk,
        timeToValueWeeks: option.timeToValueWeeks,
      })),
      scoreMode
    );

    return {
      winner: result.winner
        ? {
            optionId: result.winner.optionId,
            total: result.winner.total,
          }
        : null,
      scoredOptions: result.scoredOptions,
    };
  }, [selectedDecision, scoreMode]);

  const scoreByOptionId = useMemo(() => {
    const map = new Map<string, ScoreResponse['scoredOptions'][number]>();
    for (const item of localScore.scoredOptions) map.set(item.optionId, item);
    return map;
  }, [localScore.scoredOptions]);

  const draftOptionScore = useMemo(
    () =>
      computeStrategyOptionScoreWithMode(
        {
          id: 'draft',
          title: optionTitle.trim() || 'Neue Option',
          impactPotential,
          confidenceLevel,
          strategicFit,
          effortCost,
          downsideRisk,
          timeToValueWeeks,
        },
        scoreMode
      ),
    [optionTitle, impactPotential, confidenceLevel, strategicFit, effortCost, downsideRisk, timeToValueWeeks, scoreMode]
  );

  const hasCareerBridgeDraft = useMemo(
    () =>
      Boolean(optionTitle.trim()) ||
      Boolean(optionSummary.trim()) ||
      impactPotential !== 7 ||
      confidenceLevel !== 6 ||
      strategicFit !== 7 ||
      effortCost !== 5 ||
      downsideRisk !== 4 ||
      timeToValueWeeks !== 6,
    [optionTitle, optionSummary, impactPotential, confidenceLevel, strategicFit, effortCost, downsideRisk, timeToValueWeeks]
  );

  const winnerInsight = useMemo(() => {
    if (!localScore.winner) return null;

    const winner = localScore.scoredOptions.find((entry) => entry.optionId === localScore.winner?.optionId);
    if (!winner) return null;
    const runner = localScore.scoredOptions.find((entry) => entry.optionId !== winner.optionId) ?? null;

    if (!runner) {
      return {
        winnerTitle: winner.title,
        margin: winner.total,
        drivers: ['Nur eine Option vorhanden. Vergleich entsteht ab Option 2.'],
      };
    }

    const deltas = [
      { label: 'Impact', delta: winner.breakdown.impact - runner.breakdown.impact },
      { label: 'Strategic Fit', delta: winner.breakdown.fit - runner.breakdown.fit },
      { label: 'Confidence', delta: winner.breakdown.confidence - runner.breakdown.confidence },
      { label: 'Effort-Strafe', delta: runner.breakdown.effortPenalty - winner.breakdown.effortPenalty },
      { label: 'Risk-Strafe', delta: runner.breakdown.riskPenalty - winner.breakdown.riskPenalty },
      { label: 'Speed-Strafe', delta: runner.breakdown.speedPenalty - winner.breakdown.speedPenalty },
    ]
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 2)
      .map((entry) => `${entry.label} ${entry.delta > 0 ? '+' : ''}${entry.delta}`);

    return {
      winnerTitle: winner.title,
      margin: winner.total - runner.total,
      drivers: deltas.length ? deltas : ['Vorsprung ist knapp und verteilt sich auf mehrere Faktoren.'],
    };
  }, [localScore.scoredOptions, localScore.winner]);

  const selectedWinnerOption = useMemo(() => {
    if (!selectedDecision || !localScore.winner) return null;
    return selectedDecision.options.find((option) => option.id === localScore.winner?.optionId) ?? null;
  }, [localScore.winner, selectedDecision]);

  const commitReadiness = useMemo(
    () =>
      buildStrategyCommitReadiness({
        hasWinner: Boolean(localScore.winner),
        optionCount: selectedDecision?.options.length ?? 0,
        winnerTitle: winnerInsight?.winnerTitle ?? null,
        winnerMargin: winnerInsight?.margin ?? null,
        scoreMode,
      }),
    [localScore.winner, scoreMode, selectedDecision?.options.length, winnerInsight]
  );

  const trajectoryBridgeHref = useMemo(() => {
    if (!selectedDecision || !selectedWinnerOption) return null;

    const title = `${selectedDecision.title}: ${selectedWinnerOption.title}`;
    const category = inferTrajectoryCategory(`${selectedDecision.title} ${selectedWinnerOption.title}`);
    const effortHours = Math.max(24, Math.round(selectedWinnerOption.timeToValueWeeks * 6));
    const bufferWeeks = scoreMode === 'deadline' ? 1 : 2;

    const params = new URLSearchParams({
      source: 'strategy_bridge',
      prefillTitle: title,
      prefillCategory: category,
      prefillEffortHours: String(effortHours),
      prefillBufferWeeks: String(bufferWeeks),
    });

    if (selectedDecision.targetDate) {
      params.set('prefillDueDate', selectedDecision.targetDate);
    }

    return `/trajectory?${params.toString()}`;
  }, [scoreMode, selectedDecision, selectedWinnerOption]);

  const optionsForRender = useMemo(() => {
    if (!selectedDecision) return [];

    return [...selectedDecision.options].sort((a, b) => {
      const scoreA = scoreByOptionId.get(a.id)?.total ?? -1;
      const scoreB = scoreByOptionId.get(b.id)?.total ?? -1;
      if (scoreA === scoreB) return a.createdAt.localeCompare(b.createdAt);
      return scoreB - scoreA;
    });
  }, [selectedDecision, scoreByOptionId]);

  const applyPreset = (presetId: StrategyPreset['id']) => {
    const preset = STRATEGY_PRESETS.find((entry) => entry.id === presetId);
    if (!preset) return;
    setActivePreset(preset.id);
    setImpactPotential(preset.values.impactPotential);
    setConfidenceLevel(preset.values.confidenceLevel);
    setStrategicFit(preset.values.strategicFit);
    setEffortCost(preset.values.effortCost);
    setDownsideRisk(preset.values.downsideRisk);
    setTimeToValueWeeks(preset.values.timeToValueWeeks);
  };

  const optionTitleById = useMemo(() => {
    if (!selectedDecision) return new Map<string, string>();
    return new Map(selectedDecision.options.map((option) => [option.id, option.title]));
  }, [selectedDecision]);

  const createDecisionMutation = useMutation({
    mutationFn: (payload: { title: string; context: string | null; targetDate: string | null }) =>
      apiRequest<StrategyDecision>('/api/strategy/decisions', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (created) => {
      soundToast.success('Strategie-Entscheidung erstellt');
      setDecisionTitle('');
      setDecisionContext('');
      setDecisionTargetDate(toDateInputValue(new Date()));
      setSelectedDecisionId(created.id);
      void queryClient.invalidateQueries({ queryKey: ['strategy', 'decisions'] });
    },
    onError: (error: Error) => soundToast.error(error.message),
  });

  const updateDecisionMutation = useMutation({
    mutationFn: (payload: { id: string; title: string; context: string | null; targetDate: string | null }) =>
      apiRequest<StrategyDecision>(`/api/strategy/decisions/${payload.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: payload.title,
          context: payload.context,
          targetDate: payload.targetDate,
        }),
      }),
    onSuccess: () => {
      soundToast.success('Decision aktualisiert');
      void queryClient.invalidateQueries({ queryKey: ['strategy', 'decisions'] });
    },
    onError: (error: Error) => soundToast.error(error.message),
  });

  const deleteDecisionMutation = useMutation({
    mutationFn: (decisionId: string) =>
      apiRequest<{ success: true }>(`/api/strategy/decisions/${decisionId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      soundToast.success('Decision gelöscht');
      void queryClient.invalidateQueries({ queryKey: ['strategy', 'decisions'] });
    },
    onError: (error: Error) => soundToast.error(error.message),
  });

  const createOptionMutation = useMutation({
    mutationFn: (payload: {
      decisionId: string;
      title: string;
      summary: string | null;
      impactPotential: number;
      confidenceLevel: number;
      strategicFit: number;
      effortCost: number;
      downsideRisk: number;
      timeToValueWeeks: number;
    }) =>
      apiRequest<StrategyOption>('/api/strategy/options', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      soundToast.success('Option erstellt');
      setOptionTitle('');
      setOptionSummary('');
      setImpactPotential(7);
      setConfidenceLevel(6);
      setStrategicFit(7);
      setEffortCost(5);
      setDownsideRisk(4);
      setTimeToValueWeeks(6);
      void queryClient.invalidateQueries({ queryKey: ['strategy', 'decisions'] });
    },
    onError: (error: Error) => soundToast.error(error.message),
  });

  const deleteOptionMutation = useMutation({
    mutationFn: (optionId: string) =>
      apiRequest<{ success: true }>(`/api/strategy/options/${optionId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      soundToast.success('Option entfernt');
      void queryClient.invalidateQueries({ queryKey: ['strategy', 'decisions'] });
    },
    onError: (error: Error) => soundToast.error(error.message),
  });

  const scoreMutation = useMutation({
    mutationFn: (decisionId: string) =>
      apiRequest<ScoreResponse>(`/api/strategy/decisions/${decisionId}/score`, {
        method: 'POST',
        body: JSON.stringify({ scoreMode }),
      }),
    onSuccess: () => {
      soundToast.success('Score aktualisiert');
      void queryClient.invalidateQueries({ queryKey: ['strategy', 'decisions'] });
    },
    onError: (error: Error) => soundToast.error(error.message),
  });

  const commitMutation = useMutation({
    mutationFn: (payload: { decisionId: string; optionId: string; note: string | null }) =>
      apiRequest<{ skippedExistingTask: boolean }>(`/api/strategy/decisions/${payload.decisionId}/commit`, {
        method: 'POST',
        // Commit enthält optional direkt den Follow-up Schritt für den nächsten Tag.
        body: JSON.stringify({
          optionId: payload.optionId,
          scoreMode,
          note: payload.note,
          taskTitle: selectedDecision ? `Strategie-Commit: ${selectedDecision.title}` : null,
          timeEstimate: '45m',
          followUpEnabled,
          followUpDate: followUpEnabled ? addDaysToDateInput(new Date().toISOString().split('T')[0] ?? '', 1) : null,
          followUpTitle: followUpEnabled ? `Follow-up: nächster Schritt für ${selectedDecision?.title ?? 'Strategy'}` : null,
        }),
      }),
    onSuccess: (response) => {
      soundToast.success(response.skippedExistingTask ? 'Commit gespeichert (Task bereits vorhanden)' : 'Commit + Today-Task erstellt');
      setCommitNote('');
      void queryClient.invalidateQueries({ queryKey: ['strategy', 'decisions'] });
      void queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_NEXT_TASKS_QUERY_PREFIX });
    },
    onError: (error: Error) => soundToast.error(error.message),
  });

  const handleCreateDecision = () => {
    if (!decisionTitle.trim()) {
      soundToast.error('Titel fehlt');
      return;
    }

    createDecisionMutation.mutate({
      title: decisionTitle.trim(),
      context: decisionContext.trim() ? decisionContext.trim() : null,
      targetDate: decisionTargetDate || null,
    });
  };

  const handleCreateOption = () => {
    if (!selectedDecision) {
      soundToast.error('Wähle zuerst eine Decision aus');
      return;
    }
    if (!optionTitle.trim()) {
      soundToast.error('Option-Titel fehlt');
      return;
    }

    createOptionMutation.mutate({
      decisionId: selectedDecision.id,
      title: optionTitle.trim(),
      summary: optionSummary.trim() ? optionSummary.trim() : null,
      impactPotential,
      confidenceLevel,
      strategicFit,
      effortCost,
      downsideRisk,
      timeToValueWeeks,
    });
  };

  return (
    <div className="space-y-4 pb-2 md:space-y-5">
      <section className="dashboard-premium-card relative overflow-hidden rounded-2xl border border-primary/26 bg-gradient-to-br from-primary/[0.12] via-surface/94 to-surface/88 p-4 shadow-[0_18px_48px_-30px_rgba(0,0,0,0.85)] transition-all duration-300 hover:border-primary/34 hover:shadow-[0_22px_56px_-34px_rgba(0,0,0,0.9)] sm:p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_320px_at_6%_0%,rgba(255,95,76,0.2),transparent_56%),radial-gradient(700px_260px_at_96%_100%,rgba(250,176,64,0.14),transparent_60%)]" />
        <div className="relative flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-primary/80">Strategy Lab</p>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">Strategic Decision Engine</h1>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              Vergleiche Optionen mit transparenten Subscores und committe den Gewinner direkt als Today-Task.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            <div className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors duration-200 hover:border-white/25">
              <p className="text-text-tertiary">Decisions</p>
              <p className="text-lg font-semibold tracking-tight text-text-primary">{decisions.length}</p>
            </div>
            <div className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors duration-200 hover:border-white/25">
              <p className="text-text-tertiary">Active</p>
              <p className="text-lg font-semibold tracking-tight text-text-primary">{decisions.filter((d) => d.status !== 'archived').length}</p>
            </div>
            <div className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors duration-200 hover:border-white/25">
              <p className="text-text-tertiary">Committed</p>
              <p className="text-lg font-semibold tracking-tight text-text-primary">{decisions.filter((d) => d.status === 'committed').length}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:gap-5 xl:grid-cols-12">
        <aside className="space-y-4 xl:col-span-4">
          <section className="dashboard-premium-card rounded-2xl border border-border/70 bg-gradient-to-b from-surface/[0.72] to-surface/[0.44] p-3 backdrop-blur-[2px] shadow-[0_14px_36px_-30px_rgba(0,0,0,0.85)] transition-all duration-300 hover:border-primary/26 hover:shadow-[0_20px_44px_-34px_rgba(0,0,0,0.9)] sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">Neue Decision</h2>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-2">
              <Input
                value={decisionTitle}
                onChange={(event) => setDecisionTitle(event.target.value)}
                placeholder="z.B. GMAT jetzt oder nach Praktikum"
              />
              <Textarea
                value={decisionContext}
                onChange={(event) => setDecisionContext(event.target.value)}
                placeholder="Kontext, Constraints, harte Deadlines"
                rows={3}
              />
              <Input
                type="date"
                value={decisionTargetDate}
                onChange={(event) => setDecisionTargetDate(event.target.value)}
              />
              <Button fullWidth onClick={handleCreateDecision} loading={createDecisionMutation.isPending} leftIcon={<Plus className="h-4 w-4" />}>
                Decision erstellen
              </Button>
            </div>
          </section>

          <section className="dashboard-premium-card rounded-2xl border border-border/70 bg-gradient-to-b from-surface/[0.68] to-surface/[0.4] p-3 backdrop-blur-[2px] shadow-[0_14px_36px_-30px_rgba(0,0,0,0.85)] transition-all duration-300 hover:border-primary/26 hover:shadow-[0_20px_44px_-34px_rgba(0,0,0,0.9)]">
            <h2 className="mb-2 text-sm font-semibold text-text-primary">Decision Stack</h2>
            <div className="space-y-2">
              {isLoading ? (
                <p className="text-sm text-text-tertiary">Lade Decisions...</p>
              ) : decisions.length === 0 ? (
                <p className="text-sm text-text-tertiary">Noch keine Decision vorhanden.</p>
              ) : (
                decisions.map((decision) => (
                  <button
                    key={decision.id}
                    onClick={() => setSelectedDecisionId(decision.id)}
                    className={cn(
                      'w-full rounded-xl border px-3 py-2 text-left transition-all duration-200 ease-out motion-safe:hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45',
                      selectedDecisionId === decision.id
                        ? 'border-primary/40 bg-gradient-to-r from-primary/[0.18] to-primary/[0.06] shadow-[inset_2px_0_0_0_rgba(255,95,76,0.85)]'
                        : 'border-border/70 bg-surface/40 hover:border-primary/25 hover:bg-primary/[0.08] hover:shadow-[0_10px_22px_-18px_rgba(255,95,76,0.6)]'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-medium text-text-primary">{decision.title}</p>
                      <Badge variant={statusVariant(decision.status)} size="sm">
                        {decision.status}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-text-secondary">
                      <span>{decision.options.length} Optionen</span>
                      <span>{decision.lastScoreTotal !== null ? `${decision.lastScoreTotal} pts` : 'noch unscored'}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>
        </aside>

        <section className="space-y-4 xl:col-span-8">
          {!selectedDecision ? (
            <div className="space-y-4">
              <div className="dashboard-premium-card rounded-2xl border border-dashed border-border/70 p-10 text-center">
                <Target className="mx-auto mb-2 h-6 w-6 text-primary/70" />
                <p className="text-lg font-medium text-text-primary">Wähle oder erstelle eine Decision</p>
                <p className="mt-1 text-sm text-text-secondary">Danach kannst du Optionen bewerten und committen.</p>
              </div>

              {hasCareerBridgeDraft ? (
                <section className="dashboard-premium-card rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/[0.09] to-surface/[0.42] p-3 backdrop-blur-[2px] shadow-[0_14px_36px_-30px_rgba(0,0,0,0.85)] transition-all duration-300 hover:border-primary/32 sm:p-4">
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Career-Bridge Draft übernommen</p>
                      <p className="text-xs text-text-secondary">Die Option ist vorgeladen. Erstelle links die Decision und speichere danach den Draft.</p>
                    </div>
                    <Badge variant="primary" size="sm">
                      {draftOptionScore.total} pts
                    </Badge>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    <Input
                      label="Option Titel"
                      description="Aus dem Career-Lead übernommen"
                      value={optionTitle}
                      onChange={(event) => setOptionTitle(event.target.value)}
                      placeholder="z.B. Kern Advisory aktiv verfolgen"
                    />
                    <Input
                      label="Time to Value (Wochen)"
                      description="Wie schnell liefert die Option realen Output?"
                      value={timeToValueWeeks}
                      type="number"
                      min={1}
                      max={104}
                      onChange={(event) => setTimeToValueWeeks(clampWeeksValue(event.target.value))}
                    />
                  </div>
                  <div className="mt-2">
                    <Textarea
                      label="Option Summary"
                      description="Kurz begründen, warum diese Option strategisch sinnvoll ist."
                      value={optionSummary}
                      onChange={(event) => setOptionSummary(event.target.value)}
                      rows={2}
                      placeholder="Warum ist diese Option stark?"
                    />
                  </div>

                  <div className="mt-2 grid gap-2 md:grid-cols-3">
                    <Input
                      label="Impact"
                      value={impactPotential}
                      type="number"
                      min={1}
                      max={10}
                      onChange={(event) => setImpactPotential(clampScoreValue(event.target.value))}
                    />
                    <Input
                      label="Confidence"
                      value={confidenceLevel}
                      type="number"
                      min={1}
                      max={10}
                      onChange={(event) => setConfidenceLevel(clampScoreValue(event.target.value))}
                    />
                    <Input
                      label="Strategic Fit"
                      value={strategicFit}
                      type="number"
                      min={1}
                      max={10}
                      onChange={(event) => setStrategicFit(clampScoreValue(event.target.value))}
                    />
                    <Input
                      label="Effort"
                      value={effortCost}
                      type="number"
                      min={1}
                      max={10}
                      onChange={(event) => setEffortCost(clampScoreValue(event.target.value))}
                    />
                    <Input
                      label="Risk"
                      value={downsideRisk}
                      type="number"
                      min={1}
                      max={10}
                      onChange={(event) => setDownsideRisk(clampScoreValue(event.target.value))}
                    />
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] md:grid-cols-3">
                    <div className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-emerald-300">Impact {impactPotential}/10</div>
                    <div className="rounded-md border border-cyan-500/25 bg-cyan-500/10 px-2 py-1 text-cyan-300">Confidence {confidenceLevel}/10</div>
                    <div className="rounded-md border border-sky-500/25 bg-sky-500/10 px-2 py-1 text-sky-300">Fit {strategicFit}/10</div>
                    <div className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-amber-300">Effort {effortCost}/10</div>
                    <div className="rounded-md border border-red-500/25 bg-red-500/10 px-2 py-1 text-red-300">Risk {downsideRisk}/10</div>
                    <div className="rounded-md border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-violet-300">Speed {timeToValueWeeks}w</div>
                  </div>
                </section>
              ) : null}
            </div>
          ) : (
            <>
              <section className="dashboard-premium-card rounded-2xl border border-border/70 bg-gradient-to-b from-surface/[0.72] to-surface/[0.42] p-3 backdrop-blur-[2px] shadow-[0_14px_36px_-30px_rgba(0,0,0,0.85)] transition-all duration-300 hover:border-primary/26 hover:shadow-[0_20px_44px_-34px_rgba(0,0,0,0.9)] sm:p-4">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-base font-semibold text-text-primary sm:text-lg">{selectedDecision.title}</h2>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => scoreMutation.mutate(selectedDecision.id)}
                      loading={scoreMutation.isPending}
                      leftIcon={<Flame className="h-4 w-4" />}
                    >
                      Score run
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => deleteDecisionMutation.mutate(selectedDecision.id)}
                      loading={deleteDecisionMutation.isPending}
                      leftIcon={<Trash2 className="h-4 w-4" />}
                    >
                      Löschen
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <Input value={editingDecisionTitle} onChange={(event) => setEditingDecisionTitle(event.target.value)} />
                  <Input type="date" value={editingDecisionTargetDate} onChange={(event) => setEditingDecisionTargetDate(event.target.value)} />
                </div>
                <div className="mt-2">
                  <Textarea value={editingDecisionContext} onChange={(event) => setEditingDecisionContext(event.target.value)} rows={3} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
                  <span>
                    Last score: {selectedDecision.lastScoreTotal !== null ? `${selectedDecision.lastScoreTotal} pts` : 'noch keiner'}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      updateDecisionMutation.mutate({
                        id: selectedDecision.id,
                        title: editingDecisionTitle.trim(),
                        context: editingDecisionContext.trim() ? editingDecisionContext.trim() : null,
                        targetDate: editingDecisionTargetDate || null,
                      })
                    }
                    loading={updateDecisionMutation.isPending}
                  >
                    Decision speichern
                  </Button>
                </div>
              </section>

              <section className="dashboard-premium-card rounded-2xl border border-border/70 bg-gradient-to-b from-surface/[0.72] to-surface/[0.42] p-3 backdrop-blur-[2px] shadow-[0_14px_36px_-30px_rgba(0,0,0,0.85)] transition-all duration-300 hover:border-primary/26 hover:shadow-[0_20px_44px_-34px_rgba(0,0,0,0.9)] sm:p-4">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-sm font-semibold text-text-primary">Optionen vergleichen</h3>
                  {localScore.winner ? (
                    <Badge variant="success" size="sm" dot>
                      Winner: {localScore.scoredOptions.find((entry) => entry.optionId === localScore.winner?.optionId)?.title}
                    </Badge>
                  ) : null}
                </div>

                <div className="mb-3 rounded-xl border border-border/70 bg-surface/35 p-2">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-text-primary">Scoring Lens</p>
                    <span className="text-[11px] text-text-tertiary">
                      {scoreMode === 'deadline' ? 'Deadline dominiert (Risiko/Tempo strenger)' : 'Standard-Balance'}
                    </span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setScoreMode('standard')}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-left transition-all duration-200 ease-out motion-safe:hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45',
                        scoreMode === 'standard'
                          ? 'border-primary/45 bg-primary/[0.12]'
                          : 'border-border/70 bg-surface/40 hover:border-primary/30 hover:bg-primary/[0.08]'
                      )}
                    >
                      <p className="text-xs font-semibold text-text-primary">Standard</p>
                      <p className="mt-0.5 text-[11px] text-text-secondary">Normale Trade-off Bewertung</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setScoreMode('deadline')}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-left transition-all duration-200 ease-out motion-safe:hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45',
                        scoreMode === 'deadline'
                          ? 'border-primary/45 bg-primary/[0.12]'
                          : 'border-border/70 bg-surface/40 hover:border-primary/30 hover:bg-primary/[0.08]'
                      )}
                    >
                      <p className="text-xs font-semibold text-text-primary">Deadline Pressure</p>
                      <p className="mt-0.5 text-[11px] text-text-secondary">Zeit + Risiko werden höher gewichtet</p>
                    </button>
                  </div>
                </div>

                {winnerInsight ? (
                  <div className="mb-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/[0.16] to-primary/[0.05] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <p className="text-xs font-semibold text-text-primary">
                      Warum gewinnt <span className="text-primary">{winnerInsight.winnerTitle}</span>?
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-text-secondary">
                      <span className="rounded-md border border-white/15 bg-black/20 px-2 py-1">
                        Vorsprung: {winnerInsight.margin > 0 ? '+' : ''}
                        {winnerInsight.margin} Punkte
                      </span>
                      {winnerInsight.drivers.map((driver) => (
                        <span key={driver} className="rounded-md border border-white/15 bg-black/20 px-2 py-1">
                          {driver}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mb-3">
                  <DecisionSurfaceCard
                    eyebrow="Commit readiness"
                    title={commitReadiness.title}
                    summary={commitReadiness.summary}
                    bullets={commitReadiness.bullets}
                    chips={[
                      { label: `${selectedDecision.options.length} Optionen`, tone: 'info' },
                      { label: scoreMode === 'deadline' ? 'Deadline lens' : 'Standard lens', tone: 'default' },
                      ...(winnerInsight ? [{ label: `Vorsprung ${winnerInsight.margin > 0 ? '+' : ''}${winnerInsight.margin} pts`, tone: commitReadiness.tone }] : []),
                    ]}
                    tone={commitReadiness.tone}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    footer={
                      <div className="flex items-center justify-between gap-3 text-xs text-text-secondary">
                        <span>{commitReadiness.nextStep}</span>
                        <div className="flex items-center gap-2">
                          {trajectoryBridgeHref ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => router.push(trajectoryBridgeHref)}
                            >
                              In Trajectory vorbereiten
                            </Button>
                          ) : null}
                          {localScore.winner ? (
                            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-xs uppercase tracking-[0.14em] text-text-tertiary">
                              Winner vorhanden
                            </span>
                          ) : null}
                        </div>
                      </div>
                    }
                  />
                </div>

                <div className="grid gap-2.5 lg:grid-cols-2">
                  {optionsForRender.map((option, index) => {
                    const score = scoreByOptionId.get(option.id);
                    const isWinner = localScore.winner?.optionId === option.id;
                    const winnerTotal = localScore.winner?.total ?? null;
                    const gap = score && winnerTotal !== null ? winnerTotal - score.total : null;
                    return (
                      <article
                        key={option.id}
                        className={cn(
                          'rounded-xl border p-3 transition-all duration-200 ease-out motion-safe:hover:-translate-y-[1px] motion-safe:hover:shadow-[0_20px_36px_-30px_rgba(0,0,0,0.9)]',
                          isWinner
                            ? 'border-success/45 bg-gradient-to-br from-success/[0.16] via-success/[0.09] to-transparent'
                            : 'border-border/70 bg-gradient-to-b from-surface/55 to-surface/35'
                        )}
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <div className="mb-1 flex items-center gap-2">
                              <span className="rounded-md border border-white/15 bg-black/20 px-1.5 py-0.5 text-xs font-semibold text-text-secondary">
                                #{index + 1}
                              </span>
                              <p className="text-sm font-semibold text-text-primary">{option.title}</p>
                            </div>
                            {option.summary ? <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">{option.summary}</p> : null}
                          </div>
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-wide text-text-tertiary">Score</p>
                            <p className="text-xl font-bold text-text-primary sm:text-2xl">{score?.total ?? '—'}</p>
                          </div>
                        </div>

                        {score ? (
                          <>
                            <div className="grid grid-cols-3 gap-1 text-[11px]">
                              <div className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-emerald-300">Impact +{score.breakdown.impact}</div>
                              <div className="rounded-md border border-cyan-500/25 bg-cyan-500/10 px-2 py-1 text-cyan-300">Fit +{score.breakdown.fit}</div>
                              <div className="rounded-md border border-sky-500/25 bg-sky-500/10 px-2 py-1 text-sky-300">Conf +{score.breakdown.confidence}</div>
                              <div className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-amber-300">Effort -{score.breakdown.effortPenalty}</div>
                              <div className="rounded-md border border-red-500/25 bg-red-500/10 px-2 py-1 text-red-300">Risk -{score.breakdown.riskPenalty}</div>
                              <div className="rounded-md border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-violet-300">Speed -{score.breakdown.speedPenalty}</div>
                            </div>
                            {!isWinner && gap !== null ? (
                              <div className="mt-2 rounded-md border border-white/10 bg-black/20 px-2 py-1.5">
                                <div className="mb-1 flex items-center justify-between text-[11px] text-text-secondary">
                                  <span>Gap zum Winner</span>
                                  <span>−{gap} pts</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/10">
                                  <div
                                    className="h-1.5 rounded-full bg-primary/70"
                                    style={{ width: `${Math.max(6, Math.min(100, (score.total / Math.max(1, winnerTotal ?? 100)) * 100))}%` }}
                                  />
                                </div>
                              </div>
                            ) : null}
                          </>
                        ) : null}

                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => deleteOptionMutation.mutate(option.id)}
                            loading={deleteOptionMutation.isPending}
                          >
                            Option löschen
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              commitMutation.mutate({
                                decisionId: selectedDecision.id,
                                optionId: option.id,
                                note: commitNote.trim() ? commitNote.trim() : null,
                              })
                            }
                            loading={commitMutation.isPending}
                            leftIcon={<CheckCircle2 className="h-4 w-4" />}
                          >
                            Commit → Today
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                  <div className="mt-4 rounded-xl border border-border/70 bg-gradient-to-b from-surface/[0.58] to-surface/[0.32] p-3 transition-all duration-300 hover:border-primary/22">
                  <h4 className="mb-2 text-sm font-semibold text-text-primary">Neue Option</h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    <Input
                      label="Option Titel"
                      description="Was ist die konkrete Option?"
                      value={optionTitle}
                      onChange={(event) => setOptionTitle(event.target.value)}
                      placeholder="z.B. GMAT im Q1"
                    />
                    <Input
                      label="Time to Value (Wochen)"
                      description="Wann liefert die Option realen Output?"
                      value={timeToValueWeeks}
                      type="number"
                      min={1}
                      max={104}
                      onChange={(event) => setTimeToValueWeeks(clampWeeksValue(event.target.value))}
                    />
                  </div>
                  <div className="mt-2">
                    <Textarea
                      label="Option Summary"
                      description="Kurz begründen, warum diese Option strategisch sinnvoll ist."
                      value={optionSummary}
                      onChange={(event) => setOptionSummary(event.target.value)}
                      rows={2}
                      placeholder="Warum ist diese Option stark?"
                    />
                  </div>
                  <div className="mt-2 rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-[11px] text-text-tertiary">
                    {scoreMode === 'deadline' ? (
                      <>
                        Deadline-Logik: <span className="text-emerald-300">Impact (+) ×3.7</span>,{' '}
                        <span className="text-cyan-300">Confidence (+) ×1.8</span>,{' '}
                        <span className="text-sky-300">Fit (+) ×2.4</span>,{' '}
                        <span className="text-amber-300">Effort (−) ×2.2</span>,{' '}
                        <span className="text-red-300">Risk (−) ×2.1</span>,{' '}
                        <span className="text-violet-300">Speed-Strafe max 16</span> · Baseline 28
                      </>
                    ) : (
                      <>
                        Standard-Logik: <span className="text-emerald-300">Impact (+) ×4</span>,{' '}
                        <span className="text-cyan-300">Confidence (+) ×2</span>,{' '}
                        <span className="text-sky-300">Fit (+) ×2.5</span>,{' '}
                        <span className="text-amber-300">Effort (−) ×1.9</span>,{' '}
                        <span className="text-red-300">Risk (−) ×1.6</span>,{' '}
                        <span className="text-violet-300">Speed-Strafe max 10</span> · Baseline 28
                      </>
                    )}
                  </div>
                  <div className="mt-2 rounded-lg border border-border/70 bg-gradient-to-r from-surface/[0.55] to-surface/[0.35] p-2">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-text-primary">Scoring Presets</p>
                      <span className="text-[11px] text-text-tertiary">
                        aktiv: {STRATEGY_PRESETS.find((entry) => entry.id === activePreset)?.label}
                      </span>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                      {STRATEGY_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyPreset(preset.id)}
                          className={cn(
                            'rounded-lg border px-3 py-2 text-left transition-all duration-200 ease-out motion-safe:hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45',
                            preset.id === activePreset
                              ? 'border-primary/45 bg-primary/[0.12]'
                              : 'border-border/70 bg-surface/40 hover:border-primary/30 hover:bg-primary/[0.08]'
                          )}
                        >
                          <p className="text-xs font-semibold text-text-primary">{preset.label}</p>
                          <p className="mt-0.5 text-[11px] text-text-secondary">{preset.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 rounded-lg border border-primary/25 bg-gradient-to-r from-primary/[0.16] to-primary/[0.06] px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-text-primary">Live-Score Vorschau</p>
                      <Badge variant="primary" size="sm">
                        {draftOptionScore.total} pts
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
                      <div className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-emerald-300">
                        Impact +{draftOptionScore.breakdown.impact}
                      </div>
                      <div className="rounded-md border border-cyan-500/25 bg-cyan-500/10 px-2 py-1 text-cyan-300">
                        Conf +{draftOptionScore.breakdown.confidence}
                      </div>
                      <div className="rounded-md border border-sky-500/25 bg-sky-500/10 px-2 py-1 text-sky-300">
                        Fit +{draftOptionScore.breakdown.fit}
                      </div>
                      <div className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-amber-300">
                        Effort -{draftOptionScore.breakdown.effortPenalty}
                      </div>
                      <div className="rounded-md border border-red-500/25 bg-red-500/10 px-2 py-1 text-red-300">
                        Risk -{draftOptionScore.breakdown.riskPenalty}
                      </div>
                      <div className="rounded-md border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-violet-300">
                        Speed -{draftOptionScore.breakdown.speedPenalty}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                    <ScoreInputCard
                      label="Impact Potential (+)"
                      description="Wie stark bewegt diese Option deine Gesamtlage?"
                      value={impactPotential}
                      onChange={setImpactPotential}
                      tone="positive"
                      weightLabel="×4.0"
                    />
                    <ScoreInputCard
                      label="Confidence Level (+)"
                      description="Wie sicher bist du, dass die Option so funktioniert?"
                      value={confidenceLevel}
                      onChange={setConfidenceLevel}
                      tone="positive"
                      weightLabel="×2.0"
                    />
                    <ScoreInputCard
                      label="Strategic Fit (+)"
                      description="Wie gut passt die Option zu deinem Zielpfad?"
                      value={strategicFit}
                      onChange={setStrategicFit}
                      tone="positive"
                      weightLabel="×2.5"
                    />
                    <ScoreInputCard
                      label="Effort Cost (−)"
                      description="Wie viel Aufwand bindet diese Option realistisch?"
                      value={effortCost}
                      onChange={setEffortCost}
                      tone="negative"
                      weightLabel="×1.9"
                    />
                    <ScoreInputCard
                      label="Downside Risk (−)"
                      description="Wie hoch ist das Risiko, dass es schiefgeht?"
                      value={downsideRisk}
                      onChange={setDownsideRisk}
                      tone="negative"
                      weightLabel="×1.6"
                    />
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Input
                      value={commitNote}
                      onChange={(event) => setCommitNote(event.target.value)}
                      placeholder="Optionale Commit-Notiz"
                      className="w-full sm:max-w-[320px]"
                    />
                    <button
                      type="button"
                      onClick={() => setFollowUpEnabled((current) => !current)}
                      className={cn(
                        'rounded-md border px-3 py-2 text-xs transition-all duration-200 ease-out motion-safe:hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45',
                        followUpEnabled
                          ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300'
                          : 'border-border/70 bg-surface/35 text-text-secondary hover:border-primary/30'
                      )}
                    >
                      Follow-up Task {followUpEnabled ? 'AN' : 'AUS'}
                    </button>
                    <Button onClick={handleCreateOption} loading={createOptionMutation.isPending} leftIcon={<Plus className="h-4 w-4" />}>
                      Option hinzufügen
                    </Button>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-border/70 bg-gradient-to-b from-surface/[0.58] to-surface/[0.32] p-3 transition-all duration-300 hover:border-primary/22">
                  <h4 className="mb-2 text-sm font-semibold text-text-primary">Decision Replay</h4>
                  {!selectedDecision.recentCommits || selectedDecision.recentCommits.length === 0 ? (
                    <p className="text-xs text-text-tertiary">Noch keine Commits für diese Decision.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDecision.recentCommits.slice(0, 5).map((commit, idx) => (
                        <div key={commit.id} className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors duration-200 hover:border-white/25">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-text-primary">
                              #{idx + 1} · {optionTitleById.get(commit.optionId) ?? 'Option'}
                            </p>
                            <span className="text-[11px] text-text-tertiary">{formatCommitTimestamp(commit.createdAt)}</span>
                          </div>
                          <p className="mt-1 text-[11px] text-text-secondary">
                            {commit.note?.trim() ? commit.note : 'Keine Commit-Notiz hinterlegt.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
