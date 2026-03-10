'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Flame, Plus, Sparkles, Target, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { scoreStrategyOptions } from '@/lib/strategy/scoring';

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

function statusVariant(status: StrategyDecisionStatus): 'success' | 'warning' | 'default' {
  if (status === 'committed') return 'success';
  if (status === 'draft') return 'warning';
  return 'default';
}

export default function StrategyPage() {
  const queryClient = useQueryClient();
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

  const [commitNote, setCommitNote] = useState('');

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
      }))
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
  }, [selectedDecision]);

  const scoreByOptionId = useMemo(() => {
    const map = new Map<string, ScoreResponse['scoredOptions'][number]>();
    for (const item of localScore.scoredOptions) map.set(item.optionId, item);
    return map;
  }, [localScore.scoredOptions]);

  const createDecisionMutation = useMutation({
    mutationFn: (payload: { title: string; context: string | null; targetDate: string | null }) =>
      apiRequest<StrategyDecision>('/api/strategy/decisions', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (created) => {
      toast.success('Strategie-Entscheidung erstellt');
      setDecisionTitle('');
      setDecisionContext('');
      setDecisionTargetDate(toDateInputValue(new Date()));
      setSelectedDecisionId(created.id);
      void queryClient.invalidateQueries({ queryKey: ['strategy', 'decisions'] });
    },
    onError: (error: Error) => toast.error(error.message),
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
      toast.success('Decision aktualisiert');
      void queryClient.invalidateQueries({ queryKey: ['strategy', 'decisions'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteDecisionMutation = useMutation({
    mutationFn: (decisionId: string) =>
      apiRequest<{ success: true }>(`/api/strategy/decisions/${decisionId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast.success('Decision gelöscht');
      void queryClient.invalidateQueries({ queryKey: ['strategy', 'decisions'] });
    },
    onError: (error: Error) => toast.error(error.message),
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
      toast.success('Option erstellt');
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
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteOptionMutation = useMutation({
    mutationFn: (optionId: string) =>
      apiRequest<{ success: true }>(`/api/strategy/options/${optionId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast.success('Option entfernt');
      void queryClient.invalidateQueries({ queryKey: ['strategy', 'decisions'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const scoreMutation = useMutation({
    mutationFn: (decisionId: string) =>
      apiRequest<ScoreResponse>(`/api/strategy/decisions/${decisionId}/score`, {
        method: 'POST',
      }),
    onSuccess: () => {
      toast.success('Score aktualisiert');
      void queryClient.invalidateQueries({ queryKey: ['strategy', 'decisions'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const commitMutation = useMutation({
    mutationFn: (payload: { decisionId: string; optionId: string; note: string | null }) =>
      apiRequest<{ skippedExistingTask: boolean }>(`/api/strategy/decisions/${payload.decisionId}/commit`, {
        method: 'POST',
        body: JSON.stringify({
          optionId: payload.optionId,
          note: payload.note,
          taskTitle: selectedDecision ? `Strategie-Commit: ${selectedDecision.title}` : null,
          timeEstimate: '45m',
        }),
      }),
    onSuccess: (response) => {
      toast.success(response.skippedExistingTask ? 'Commit gespeichert (Task bereits vorhanden)' : 'Commit + Today-Task erstellt');
      setCommitNote('');
      void queryClient.invalidateQueries({ queryKey: ['strategy', 'decisions'] });
      void queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'next-tasks'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleCreateDecision = () => {
    if (!decisionTitle.trim()) {
      toast.error('Titel fehlt');
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
      toast.error('Wähle zuerst eine Decision aus');
      return;
    }
    if (!optionTitle.trim()) {
      toast.error('Option-Titel fehlt');
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
    <div className="space-y-5">
      <section className="dashboard-premium-card rounded-2xl border border-primary/22 bg-gradient-to-br from-primary/[0.09] via-surface/92 to-surface/88 p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-primary/80">Strategy Lab</p>
            <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Strategic Decision Engine</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Vergleiche Optionen mit transparenten Subscores und committe den Gewinner direkt als Today-Task.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-text-tertiary">Decisions</p>
              <p className="text-lg font-semibold text-text-primary">{decisions.length}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-text-tertiary">Active</p>
              <p className="text-lg font-semibold text-text-primary">{decisions.filter((d) => d.status !== 'archived').length}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-text-tertiary">Committed</p>
              <p className="text-lg font-semibold text-text-primary">{decisions.filter((d) => d.status === 'committed').length}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-12">
        <aside className="space-y-4 xl:col-span-4">
          <section className="dashboard-premium-card rounded-2xl border border-border/70 p-4">
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

          <section className="dashboard-premium-card rounded-2xl border border-border/70 p-3">
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
                      'w-full rounded-xl border px-3 py-2 text-left transition-colors',
                      selectedDecisionId === decision.id
                        ? 'border-primary/40 bg-primary/[0.12]'
                        : 'border-border/70 bg-surface/40 hover:border-primary/25 hover:bg-primary/[0.08]'
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
            <div className="dashboard-premium-card rounded-2xl border border-dashed border-border/70 p-10 text-center">
              <Target className="mx-auto mb-2 h-6 w-6 text-primary/70" />
              <p className="text-lg font-medium text-text-primary">Wähle oder erstelle eine Decision</p>
              <p className="mt-1 text-sm text-text-secondary">Danach kannst du Optionen bewerten und committen.</p>
            </div>
          ) : (
            <>
              <section className="dashboard-premium-card rounded-2xl border border-border/70 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-text-primary">{selectedDecision.title}</h2>
                  <div className="flex items-center gap-2">
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

              <section className="dashboard-premium-card rounded-2xl border border-border/70 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text-primary">Optionen vergleichen</h3>
                  {localScore.winner ? (
                    <Badge variant="success" size="sm" dot>
                      Winner: {localScore.scoredOptions.find((entry) => entry.optionId === localScore.winner?.optionId)?.title}
                    </Badge>
                  ) : null}
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  {selectedDecision.options.map((option) => {
                    const score = scoreByOptionId.get(option.id);
                    const isWinner = localScore.winner?.optionId === option.id;
                    return (
                      <article
                        key={option.id}
                        className={cn(
                          'rounded-xl border p-3',
                          isWinner ? 'border-success/45 bg-success/10' : 'border-border/70 bg-surface/40'
                        )}
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-text-primary">{option.title}</p>
                            {option.summary ? <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">{option.summary}</p> : null}
                          </div>
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-wide text-text-tertiary">Score</p>
                            <p className="text-2xl font-bold text-text-primary">{score?.total ?? '—'}</p>
                          </div>
                        </div>

                        {score ? (
                          <div className="grid grid-cols-3 gap-1 text-[11px]">
                            <div className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-emerald-300">Impact +{score.breakdown.impact}</div>
                            <div className="rounded-md border border-cyan-500/25 bg-cyan-500/10 px-2 py-1 text-cyan-300">Fit +{score.breakdown.fit}</div>
                            <div className="rounded-md border border-sky-500/25 bg-sky-500/10 px-2 py-1 text-sky-300">Conf +{score.breakdown.confidence}</div>
                            <div className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-amber-300">Effort -{score.breakdown.effortPenalty}</div>
                            <div className="rounded-md border border-red-500/25 bg-red-500/10 px-2 py-1 text-red-300">Risk -{score.breakdown.riskPenalty}</div>
                            <div className="rounded-md border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-violet-300">Speed -{score.breakdown.speedPenalty}</div>
                          </div>
                        ) : null}

                        <div className="mt-3 flex items-center justify-between gap-2">
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

                <div className="mt-4 rounded-xl border border-border/70 bg-surface/30 p-3">
                  <h4 className="mb-2 text-sm font-semibold text-text-primary">Neue Option</h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    <Input value={optionTitle} onChange={(event) => setOptionTitle(event.target.value)} placeholder="z.B. GMAT im Q1" />
                    <Input
                      value={timeToValueWeeks}
                      type="number"
                      min={1}
                      max={104}
                      onChange={(event) => setTimeToValueWeeks(Number(event.target.value || 1))}
                      placeholder="Time to value (Wochen)"
                    />
                  </div>
                  <div className="mt-2">
                    <Textarea value={optionSummary} onChange={(event) => setOptionSummary(event.target.value)} rows={2} placeholder="Warum ist diese Option stark?" />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                    <Input type="number" min={1} max={10} value={impactPotential} onChange={(event) => setImpactPotential(Number(event.target.value || 1))} placeholder="Impact (1-10)" />
                    <Input type="number" min={1} max={10} value={confidenceLevel} onChange={(event) => setConfidenceLevel(Number(event.target.value || 1))} placeholder="Confidence (1-10)" />
                    <Input type="number" min={1} max={10} value={strategicFit} onChange={(event) => setStrategicFit(Number(event.target.value || 1))} placeholder="Fit (1-10)" />
                    <Input type="number" min={1} max={10} value={effortCost} onChange={(event) => setEffortCost(Number(event.target.value || 1))} placeholder="Effort cost (1-10)" />
                    <Input type="number" min={1} max={10} value={downsideRisk} onChange={(event) => setDownsideRisk(Number(event.target.value || 1))} placeholder="Risk (1-10)" />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Input
                      value={commitNote}
                      onChange={(event) => setCommitNote(event.target.value)}
                      placeholder="Optionale Commit-Notiz"
                      className="max-w-[320px]"
                    />
                    <Button onClick={handleCreateOption} loading={createOptionMutation.isPending} leftIcon={<Plus className="h-4 w-4" />}>
                      Option hinzufügen
                    </Button>
                  </div>
                </div>
              </section>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
