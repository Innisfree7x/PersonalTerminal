'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addMonths, differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns';
import { motion } from 'framer-motion';
import { useSoundToast } from '@/lib/hooks/useSoundToast';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Flame,
  Gauge,
  Eye,
  EyeOff,
  Save,
  Share2,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import TrajectoryShareCard from '@/components/features/trajectory/TrajectoryShareCard';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { DecisionSurfaceCard } from '@/components/ui/DecisionSurfaceCard';
import { buildTimelineRuler } from '@/lib/trajectory/timeline';
import { detectGoalStatusTransitions } from '@/lib/trajectory/statusTransition';
import { cn } from '@/lib/utils';
import { useAppSound } from '@/lib/hooks/useAppSound';
import {
  getRiskStatusLabel,
  getRiskStatusTone,
  type RiskStatus,
} from '@/lib/design-system/statusTone';

type GoalCategory = 'thesis' | 'gmat' | 'master_app' | 'internship' | 'other';
type GoalStatus = 'active' | 'done' | 'archived';
type WindowType = 'internship' | 'master_cycle' | 'exam_period' | 'other';
type WindowConfidence = 'low' | 'medium' | 'high';
type BlockStatus = 'planned' | 'in_progress' | 'done' | 'skipped';

interface TrajectorySettings {
  id: string;
  hoursPerWeek: number;
  horizonMonths: number;
  createdAt: string;
  updatedAt: string;
}

interface TrajectoryGoal {
  id: string;
  title: string;
  category: GoalCategory;
  dueDate: string;
  effortHours: number;
  bufferWeeks: number;
  priority: number;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

interface TrajectoryWindow {
  id: string;
  title: string;
  windowType: WindowType;
  startDate: string;
  endDate: string;
  confidence: WindowConfidence;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TrajectoryBlock {
  id: string;
  goalId: string;
  title: string;
  startDate: string;
  endDate: string;
  weeklyHours: number;
  status: BlockStatus;
  source: string;
  createdAt: string;
  updatedAt: string;
}

interface GeneratedTrajectoryBlock {
  goalId: string;
  title: string;
  startDate: string;
  endDate: string;
  weeklyHours: number;
  requiredWeeks: number;
  plannedBlockHours: number;
  overlapRatio: number;
  status: RiskStatus;
  reasons: string[];
}

interface TrajectoryAlert {
  severity: 'warning' | 'critical';
  code: 'TIGHT_CAPACITY' | 'TIMELINE_COLLISION' | 'LATE_START';
  message: string;
  goalId: string;
}

interface TrajectoryComputed {
  effectiveCapacityHoursPerWeek: number;
  generatedBlocks: GeneratedTrajectoryBlock[];
  alerts: TrajectoryAlert[];
  summary: {
    total: number;
    onTrack: number;
    tight: number;
    atRisk: number;
  };
}

interface TrajectoryOverviewResponse {
  settings: TrajectorySettings;
  goals: TrajectoryGoal[];
  windows: TrajectoryWindow[];
  blocks: TrajectoryBlock[];
  computed: TrajectoryComputed;
}

interface TrajectoryPlanResponse {
  settings: TrajectorySettings;
  simulation: {
    used: boolean;
    effectiveCapacityHoursPerWeek: number;
  };
  computed: TrajectoryComputed;
}

interface GoalFormState {
  title: string;
  category: GoalCategory;
  dueDate: string;
  effortUnit: 'hours' | 'months';
  effortHours: number;
  effortMonths: number;
  bufferUnit: 'weeks' | 'months';
  bufferWeeks: number;
  bufferMonths: number;
  priority: number;
  status: GoalStatus;
}

interface WindowFormState {
  title: string;
  windowType: WindowType;
  startDate: string;
  endDate: string;
  confidence: WindowConfidence;
  notes: string;
}

const goalCategoryOptions: Array<{ value: GoalCategory; label: string }> = [
  { value: 'thesis', label: 'Bachelor Thesis' },
  { value: 'gmat', label: 'GMAT' },
  { value: 'master_app', label: 'Master Application' },
  { value: 'internship', label: 'Internship' },
  { value: 'other', label: 'Other' },
];

const windowTypeOptions: Array<{ value: WindowType; label: string }> = [
  { value: 'internship', label: 'Internship Cycle' },
  { value: 'master_cycle', label: 'Master Application Cycle' },
  { value: 'exam_period', label: 'Exam Period' },
  { value: 'other', label: 'Other Window' },
];

function quarterGlowClasses(quarter: 1 | 2 | 3 | 4): string {
  if (quarter === 1) return 'from-emerald-400/45 to-emerald-300/15 shadow-[0_0_10px_rgba(52,211,153,0.28)]';
  if (quarter === 2) return 'from-sky-400/45 to-sky-300/15 shadow-[0_0_10px_rgba(56,189,248,0.26)]';
  if (quarter === 3) return 'from-amber-400/50 to-amber-300/15 shadow-[0_0_10px_rgba(251,191,36,0.26)]';
  return 'from-violet-400/45 to-violet-300/15 shadow-[0_0_10px_rgba(167,139,250,0.26)]';
}

const EMPTY_GOALS: TrajectoryGoal[] = [];
const EMPTY_WINDOWS: TrajectoryWindow[] = [];
const EMPTY_BLOCKS: TrajectoryBlock[] = [];
const EMPTY_GENERATED_BLOCKS: GeneratedTrajectoryBlock[] = [];
const EMPTY_ALERTS: TrajectoryAlert[] = [];

function toDateInputValue(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

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
    const message =
      payload?.error?.message ||
      payload?.message ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

function formatShortDate(dateString: string): string {
  return format(parseISO(dateString), 'dd MMM yyyy');
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function monthsToHours(months: number, weeklyCapacityHours: number): number {
  const normalizedMonths = Math.max(0.25, months);
  const normalizedWeekly = Math.max(1, weeklyCapacityHours);
  // Approximation: 1 month = 4.345 weeks
  return Math.max(1, Math.round(normalizedMonths * 4.345 * normalizedWeekly));
}

function monthsToWeeks(months: number): number {
  const normalizedMonths = Math.max(0.25, months);
  return Math.max(0, Math.round(normalizedMonths * 4.345));
}

const GOAL_STATUS_PULSE_DURATION_MS = 1_800;
const GOAL_STATUS_PULSE_COOLDOWN_MS = 10_000;

function getTimelineRiskClasses(status: RiskStatus): string {
  if (status === 'at_risk') return 'border-error/50 bg-error/25';
  if (status === 'tight') return 'border-warning/50 bg-warning/25';
  return 'border-success/50 bg-success/20';
}

export default function TrajectoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { play } = useAppSound();
  const soundToast = useSoundToast();
  const previousOverallStatusRef = useRef<RiskStatus | null>(null);
  const previousGoalStatusRef = useRef<Record<string, RiskStatus>>({});
  const goalStatusPulseCooldownRef = useRef<Record<string, number>>({});
  const goalStatusPulseTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [goalStatusPulseIds, setGoalStatusPulseIds] = useState<string[]>([]);

  const handleExport = async () => {
    if (!shareCardRef.current) return;
    const { toPng } = await import('html-to-image');
    try {
      const dataUrl = await toPng(shareCardRef.current, { width: 1200, height: 630, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = 'innis-trajectory-plan.png';
      link.href = dataUrl;
      link.click();
    } catch {
      soundToast.error('Export fehlgeschlagen. Bitte erneut versuchen.');
    }
  };
  const [deepLinkedGoalId, setDeepLinkedGoalId] = useState('');
  const [deepLinkedWindowId, setDeepLinkedWindowId] = useState('');

  const [simulationHours, setSimulationHours] = useState<number | null>(null);
  const [horizonMonthsDraft, setHorizonMonthsDraft] = useState<number | null>(null);
  const [planningUnit, setPlanningUnit] = useState<'weeks' | 'months'>('months');
  const [showMilestones, setShowMilestones] = useState(true);
  const [showPrepBlocks, setShowPrepBlocks] = useState(true);
  const [showWindows, setShowWindows] = useState(true);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [selectedWindowId, setSelectedWindowId] = useState<string>('');
  const [taskCount, setTaskCount] = useState<number>(6);

  const [goalForm, setGoalForm] = useState<GoalFormState>({
    title: '',
    category: 'thesis',
    dueDate: toDateInputValue(addMonths(new Date(), 6)),
    effortUnit: 'months',
    effortHours: 120,
    effortMonths: 3,
    bufferUnit: 'months',
    bufferWeeks: 2,
    bufferMonths: 0.5,
    priority: 3,
    status: 'active',
  });

  const [windowForm, setWindowForm] = useState<WindowFormState>({
    title: '',
    windowType: 'internship',
    startDate: toDateInputValue(addMonths(new Date(), 2)),
    endDate: toDateInputValue(addMonths(new Date(), 4)),
    confidence: 'medium',
    notes: '',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const goalId = url.searchParams.get('goalId')?.trim() ?? '';
    const windowId = url.searchParams.get('windowId')?.trim() ?? '';
    setDeepLinkedGoalId(goalId);
    setDeepLinkedWindowId(windowId);

    const prefillTitle = url.searchParams.get('prefillTitle')?.trim() ?? '';
    const prefillCategory = url.searchParams.get('prefillCategory')?.trim() ?? '';
    const prefillDueDate = url.searchParams.get('prefillDueDate')?.trim() ?? '';
    const prefillEffortHours = Number(url.searchParams.get('prefillEffortHours') ?? '');
    const prefillBufferWeeks = Number(url.searchParams.get('prefillBufferWeeks') ?? '');

    const validCategory: GoalCategory =
      prefillCategory === 'thesis' ||
      prefillCategory === 'gmat' ||
      prefillCategory === 'master_app' ||
      prefillCategory === 'internship'
        ? prefillCategory
        : 'other';

    if (prefillTitle) {
      setGoalForm((current) => ({
        ...current,
        title: prefillTitle,
        category: validCategory,
        dueDate: prefillDueDate || current.dueDate,
        effortUnit: 'hours',
        effortHours: Number.isFinite(prefillEffortHours) && prefillEffortHours > 0 ? prefillEffortHours : current.effortHours,
        bufferUnit: 'weeks',
        bufferWeeks: Number.isFinite(prefillBufferWeeks) && prefillBufferWeeks >= 0 ? prefillBufferWeeks : current.bufferWeeks,
      }));
      soundToast.success('Strategy-Entscheidung in das Trajectory-Formular übernommen.');

      ['prefillTitle', 'prefillCategory', 'prefillDueDate', 'prefillEffortHours', 'prefillBufferWeeks'].forEach((key) =>
        url.searchParams.delete(key)
      );
      const nextUrl = `${url.pathname}${url.searchParams.toString() ? `?${url.searchParams.toString()}` : ''}`;
      window.history.replaceState({}, '', nextUrl);
    }
  }, [soundToast]);

  const {
    data: overview,
    isLoading: isOverviewLoading,
    isFetching: isOverviewFetching,
    error: overviewError,
  } = useQuery({
    queryKey: ['trajectory', 'overview'],
    queryFn: () => apiRequest<TrajectoryOverviewResponse>('/api/trajectory/overview'),
    staleTime: 20 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!overview) return;
    setSimulationHours((current) => current ?? overview.settings.hoursPerWeek);
    setHorizonMonthsDraft((current) => current ?? overview.settings.horizonMonths);
  }, [overview]);

  const {
    data: planData,
    isFetching: isPlanFetching,
    refetch: refetchPlan,
  } = useQuery({
    queryKey: ['trajectory', 'plan', simulationHours],
    queryFn: () =>
      apiRequest<TrajectoryPlanResponse>('/api/trajectory/plan', {
        method: 'POST',
        body: JSON.stringify({ simulationHoursPerWeek: simulationHours }),
      }),
    enabled: simulationHours !== null,
    staleTime: 20 * 1000,
    refetchOnWindowFocus: false,
  });

  const computed = planData?.computed ?? overview?.computed;
  const goals = useMemo(() => overview?.goals ?? EMPTY_GOALS, [overview?.goals]);
  const windows = useMemo(() => overview?.windows ?? EMPTY_WINDOWS, [overview?.windows]);
  const committedBlocks = useMemo(() => overview?.blocks ?? EMPTY_BLOCKS, [overview?.blocks]);
  const generatedBlocks = useMemo(
    () => computed?.generatedBlocks ?? EMPTY_GENERATED_BLOCKS,
    [computed?.generatedBlocks]
  );
  const alerts = useMemo(() => computed?.alerts ?? EMPTY_ALERTS, [computed?.alerts]);

  const overallStatus = useMemo<RiskStatus>(() => {
    if (!computed?.summary) return 'on_track';
    if (computed.summary.atRisk > 0) return 'at_risk';
    if (computed.summary.tight > 0) return 'tight';
    return 'on_track';
  }, [computed?.summary]);
  const riskSummaryCards = useMemo(
    () => [
      { status: 'on_track' as const, value: computed?.summary.onTrack ?? 0 },
      { status: 'tight' as const, value: computed?.summary.tight ?? 0 },
      { status: 'at_risk' as const, value: computed?.summary.atRisk ?? 0 },
    ],
    [computed?.summary.atRisk, computed?.summary.onTrack, computed?.summary.tight]
  );

  useEffect(() => {
    const previous = previousOverallStatusRef.current;
    if (!previous) {
      previousOverallStatusRef.current = overallStatus;
      return;
    }
    if (previous === overallStatus) return;

    const becameRisk = overallStatus === 'at_risk' && previous !== 'at_risk';
    const recovered = previous !== 'on_track' && overallStatus === 'on_track';
    if (becameRisk) {
      play('trajectory-at-risk');
    } else if (recovered) {
      play('trajectory-on-track');
    }
    previousOverallStatusRef.current = overallStatus;
  }, [overallStatus, play]);

  useEffect(() => {
    return () => {
      for (const timer of Object.values(goalStatusPulseTimersRef.current)) {
        clearTimeout(timer);
      }
      goalStatusPulseTimersRef.current = {};
    };
  }, []);

  useEffect(() => {
    if (generatedBlocks.length === 0) {
      setSelectedGoalId('');
      return;
    }

    setSelectedGoalId((current) => {
      if (deepLinkedGoalId && generatedBlocks.some((block) => block.goalId === deepLinkedGoalId)) {
        return deepLinkedGoalId;
      }
      if (current && generatedBlocks.some((block) => block.goalId === current)) return current;
      return generatedBlocks[0]?.goalId ?? '';
    });
  }, [generatedBlocks, deepLinkedGoalId]);

  useEffect(() => {
    if (windows.length === 0) {
      setSelectedWindowId('');
      return;
    }

    if (deepLinkedWindowId) {
      const hasWindow = windows.some((window) => window.id === deepLinkedWindowId);
      if (hasWindow) {
        setSelectedWindowId(deepLinkedWindowId);
        setShowWindows(true);
        return;
      }
    }

    setSelectedWindowId((current) => {
      if (current && windows.some((window) => window.id === current)) return current;
      return windows[0]?.id ?? '';
    });
  }, [windows, deepLinkedWindowId]);

  const effectiveCapacity = planData?.simulation.effectiveCapacityHoursPerWeek ?? overview?.settings.hoursPerWeek ?? 8;
  const baselineHoursPerWeek = overview?.settings.hoursPerWeek ?? 8;

  const selectedBlock = useMemo(
    () => generatedBlocks.find((block) => block.goalId === selectedGoalId) ?? null,
    [generatedBlocks, selectedGoalId]
  );
  const selectedGoal = useMemo(
    () => goals.find((goal) => goal.id === selectedGoalId) ?? null,
    [goals, selectedGoalId]
  );
  const selectedTrajectoryDecisionSurface = useMemo(() => {
    if (!selectedGoal || !selectedBlock) return null;

    const status = selectedBlock.status;
    const tone: 'error' | 'warning' | 'success' =
      status === 'at_risk' ? 'error' : status === 'tight' ? 'warning' : 'success';
    const dueInDays = differenceInCalendarDays(parseISO(selectedGoal.dueDate), startOfDay(new Date()));

    return {
      tone,
      title:
        status === 'at_risk'
          ? `${selectedGoal.title} driftet gerade`
          : status === 'tight'
            ? `${selectedGoal.title} ist knapp, aber machbar`
            : `${selectedGoal.title} ist sauber planbar`,
      summary:
        `${selectedBlock.requiredWeeks} Wochen Prep bei ${selectedBlock.weeklyHours.toFixed(1)}h/Woche. ` +
        `Start ${formatShortDate(selectedBlock.startDate)}, Deadline in ${dueInDays} Tagen.`,
      bullets: [
        ...selectedBlock.reasons.slice(0, 3),
        `Buffer: ${selectedGoal.bufferWeeks} Wochen · Effort: ${selectedGoal.effortHours}h`,
      ],
      chips: [
        { label: getRiskStatusLabel(status), tone },
        { label: `${selectedBlock.requiredWeeks} Prep-Wochen`, tone: 'info' as const },
        { label: `${selectedBlock.weeklyHours.toFixed(1)}h/Woche`, tone: 'default' as const },
      ],
      nextStep:
        status === 'at_risk'
          ? 'Task-Package erzeugen und diese Woche den Prep-Start absichern.'
          : status === 'tight'
            ? 'Simulation committen oder jetzt direkt ein Task-Package nach Today schieben.'
            : 'Plan committen und nur noch den wöchentlichen Check-in halten.',
    };
  }, [selectedBlock, selectedGoal]);
  const selectedGoalSimulationWeeks = useMemo(() => {
    if (!selectedGoal) return null;
    return Math.max(1, Math.ceil(selectedGoal.effortHours / Math.max(1, effectiveCapacity)));
  }, [effectiveCapacity, selectedGoal]);
  const selectedGoalBaselineWeeks = useMemo(() => {
    if (!selectedGoal) return null;
    return Math.max(
      1,
      Math.ceil(selectedGoal.effortHours / Math.max(1, baselineHoursPerWeek))
    );
  }, [baselineHoursPerWeek, selectedGoal]);
  const selectedGoalWeeksDelta = useMemo(() => {
    if (selectedGoalSimulationWeeks === null || selectedGoalBaselineWeeks === null) return null;
    return selectedGoalSimulationWeeks - selectedGoalBaselineWeeks;
  }, [selectedGoalBaselineWeeks, selectedGoalSimulationWeeks]);

  const isSimulationDirty =
    overview &&
    simulationHours !== null &&
    simulationHours !== overview.settings.hoursPerWeek;
  const isHorizonDirty =
    overview &&
    horizonMonthsDraft !== null &&
    horizonMonthsDraft !== overview.settings.horizonMonths;

  const timelineStart = useMemo(() => startOfDay(new Date()), []);
  const timelineHorizonMonths = horizonMonthsDraft ?? overview?.settings.horizonMonths ?? 24;
  const timelineEnd = useMemo(
    () => addMonths(timelineStart, timelineHorizonMonths),
    [timelineStart, timelineHorizonMonths]
  );

  const totalTimelineDays = Math.max(1, differenceInCalendarDays(timelineEnd, timelineStart));

  const timelineRangeLabel = useMemo(
    () => `${format(timelineStart, 'MM.yy')} -> ${format(timelineEnd, 'MM.yy')}`,
    [timelineEnd, timelineStart]
  );
  const timelineRangeStart = useMemo(
    () => format(timelineStart, 'MM.yy'),
    [timelineStart]
  );
  const timelineRangeEnd = useMemo(
    () => format(timelineEnd, 'MM.yy'),
    [timelineEnd]
  );

  const nextMilestoneLabel = useMemo(() => {
    const now = new Date();
    const upcoming = goals
      .filter((goal) => goal.status === 'active')
      .map((goal) => ({ goal, due: parseISO(goal.dueDate) }))
      .filter((entry) => entry.due >= now)
      .sort((a, b) => a.due.getTime() - b.due.getTime())[0];

    if (!upcoming) return 'No upcoming milestone';
    return `${upcoming.goal.title} · ${format(upcoming.due, 'dd MMM yyyy')}`;
  }, [goals]);

  const toPercent = (dateString: string): number => {
    const distance = differenceInCalendarDays(parseISO(dateString), timelineStart);
    return clampPercent((distance / totalTimelineDays) * 100);
  };

  const span = (startDate: string, endDate: string): { left: number; width: number } => {
    const left = toPercent(startDate);
    const right = toPercent(endDate);
    return { left, width: Math.max(1, right - left) };
  };

  const { monthGridLines, quarterSegments, monthLabelTicks } = useMemo(
    () => buildTimelineRuler(timelineStart, timelineHorizonMonths),
    [timelineStart, timelineHorizonMonths]
  );

  const riskByGoal = useMemo(() => {
    const map = new Map<string, RiskStatus>();
    for (const block of generatedBlocks) map.set(block.goalId, block.status);
    return map;
  }, [generatedBlocks]);

  useEffect(() => {
    if (goals.length === 0) {
      previousGoalStatusRef.current = {};
      return;
    }

    const currentByGoal: Record<string, RiskStatus> = {};
    for (const goal of goals) {
      currentByGoal[goal.id] = riskByGoal.get(goal.id) ?? 'on_track';
    }

    if (Object.keys(previousGoalStatusRef.current).length === 0) {
      previousGoalStatusRef.current = currentByGoal;
      return;
    }

    const transition = detectGoalStatusTransitions({
      previousByGoal: previousGoalStatusRef.current,
      currentByGoal,
      lastPulseByGoal: goalStatusPulseCooldownRef.current,
      nowMs: Date.now(),
      cooldownMs: GOAL_STATUS_PULSE_COOLDOWN_MS,
    });

    previousGoalStatusRef.current = currentByGoal;
    goalStatusPulseCooldownRef.current = transition.nextLastPulseByGoal;
    if (transition.changedGoalIds.length === 0) return;

    setGoalStatusPulseIds((current) =>
      Array.from(new Set([...current, ...transition.changedGoalIds]))
    );

    for (const goalId of transition.changedGoalIds) {
      const existingTimer = goalStatusPulseTimersRef.current[goalId];
      if (existingTimer) clearTimeout(existingTimer);
      goalStatusPulseTimersRef.current[goalId] = setTimeout(() => {
        setGoalStatusPulseIds((current) => current.filter((id) => id !== goalId));
        delete goalStatusPulseTimersRef.current[goalId];
      }, GOAL_STATUS_PULSE_DURATION_MS);
    }
  }, [goals, riskByGoal]);

  const committedBlockKey = useMemo(() => {
    const keys = new Set<string>();
    for (const block of committedBlocks) {
      keys.add(`${block.goalId}|${block.startDate}|${block.endDate}`);
    }
    return keys;
  }, [committedBlocks]);

  const upsertGoalMutation = useMutation({
    mutationFn: (payload: GoalFormState) =>
      apiRequest<TrajectoryGoal>('/api/trajectory/goals', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      soundToast.success('Milestone added.');
      setGoalForm((current) => ({
        ...current,
        title: '',
      }));
      queryClient.invalidateQueries({ queryKey: ['trajectory', 'overview'] });
    },
    onError: (error: Error) => {
      soundToast.error(error.message);
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: string) =>
      apiRequest<{ success: boolean }>(`/api/trajectory/goals/${goalId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      soundToast.success('Milestone removed.');
      queryClient.invalidateQueries({ queryKey: ['trajectory', 'overview'] });
    },
    onError: (error: Error) => {
      soundToast.error(error.message);
    },
  });

  const createWindowMutation = useMutation({
    mutationFn: (payload: WindowFormState) =>
      apiRequest<TrajectoryWindow>('/api/trajectory/windows', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      soundToast.success('Timeline window added.');
      setWindowForm((current) => ({
        ...current,
        title: '',
        notes: '',
      }));
      queryClient.invalidateQueries({ queryKey: ['trajectory', 'overview'] });
    },
    onError: (error: Error) => {
      soundToast.error(error.message);
    },
  });

  const deleteWindowMutation = useMutation({
    mutationFn: (windowId: string) =>
      apiRequest<{ success: boolean }>(`/api/trajectory/windows/${windowId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      soundToast.success('Timeline window removed.');
      queryClient.invalidateQueries({ queryKey: ['trajectory', 'overview'] });
    },
    onError: (error: Error) => {
      soundToast.error(error.message);
    },
  });

  const saveBaselineMutation = useMutation({
    mutationFn: () =>
      apiRequest<TrajectorySettings>('/api/trajectory/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          hoursPerWeek: simulationHours,
          horizonMonths: horizonMonthsDraft,
        }),
      }),
    onSuccess: () => {
      soundToast.success('Baseline saved.');
      queryClient.invalidateQueries({ queryKey: ['trajectory', 'overview'] });
    },
    onError: (error: Error) => {
      soundToast.error(error.message);
    },
  });

  const commitBlocksMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ blocks: TrajectoryBlock[] }>('/api/trajectory/blocks/commit', {
        method: 'POST',
        body: JSON.stringify({
          blocks: generatedBlocks.map((block) => ({
            goalId: block.goalId,
            title: block.title,
            startDate: block.startDate,
            endDate: block.endDate,
            weeklyHours: block.weeklyHours,
            status: 'planned' as BlockStatus,
          })),
        }),
      }),
    onSuccess: () => {
      soundToast.success('Plan committed.');
      queryClient.invalidateQueries({ queryKey: ['trajectory', 'overview'] });
    },
    onError: (error: Error) => {
      soundToast.error(error.message);
    },
  });

  const createTaskPackageMutation = useMutation({
    mutationFn: (variables?: {
      goalId?: string;
      taskCount?: number;
      navigateToToday?: boolean;
      source?: 'footer' | 'risk_console_alert';
    }) => {
      const targetGoalId = variables?.goalId ?? selectedBlock?.goalId;
      const targetBlock = generatedBlocks.find((block) => block.goalId === targetGoalId);
      if (!targetGoalId || !targetBlock) throw new Error('Please pick a generated block first.');

      const effectiveTaskCount = Math.max(
        1,
        Math.min(60, Math.round(variables?.taskCount ?? taskCount))
      );
      return apiRequest<{ skippedExisting: boolean; tasks: Array<{ id: string }> }>('/api/trajectory/tasks/package', {
        method: 'POST',
        body: JSON.stringify({
          goalId: targetGoalId,
          startDate: targetBlock.startDate,
          endDate: targetBlock.endDate,
          taskCount: effectiveTaskCount,
        }),
      });
    },
    onSuccess: (result, variables) => {
      if (result.skippedExisting) {
        soundToast.success('Task package already existed and was reused.');
      } else {
        soundToast.success(`Created ${result.tasks.length} trajectory tasks.`);
      }
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['trajectory', 'overview'] });
      if (variables?.navigateToToday) {
        router.push('/today?source=trajectory_risk_bridge');
      }
    },
    onError: (error: Error) => {
      soundToast.error(error.message);
    },
  });

  const milestoneEffortHours = useMemo(() => {
    if (goalForm.effortUnit === 'months') {
      return monthsToHours(goalForm.effortMonths, effectiveCapacity);
    }
    return Math.max(1, Math.round(goalForm.effortHours));
  }, [effectiveCapacity, goalForm.effortHours, goalForm.effortMonths, goalForm.effortUnit]);

  const milestoneBufferWeeks = useMemo(() => {
    if (goalForm.bufferUnit === 'months') {
      return monthsToWeeks(goalForm.bufferMonths);
    }
    return Math.max(0, Math.round(goalForm.bufferWeeks));
  }, [goalForm.bufferMonths, goalForm.bufferUnit, goalForm.bufferWeeks]);

  if (isOverviewLoading && !overview) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 rounded-2xl bg-surface border border-border" />
        <div className="h-[360px] rounded-2xl bg-surface border border-border" />
        <div className="h-40 rounded-2xl bg-surface border border-border" />
      </div>
    );
  }

  if (overviewError || !overview || !computed) {
    return (
      <div className="rounded-2xl border border-error/30 bg-error/10 p-6">
        <p className="text-error font-semibold mb-1">Trajectory data could not be loaded.</p>
        <p className="text-sm text-text-secondary">
          {overviewError instanceof Error ? overviewError.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.08] via-background to-background p-5"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Trajectory Planner
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Strategic Career Timeline</h1>
              <p className="mt-1 text-sm text-text-secondary">
                Backward-plan thesis, GMAT, master applications and internship windows with deterministic risk logic.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-surface/80 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-text-tertiary">Horizon</div>
                <div className="mt-1 text-lg font-semibold text-text-primary">{timelineHorizonMonths}m</div>
              </div>
              <div className="rounded-xl border border-border bg-surface/80 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-text-tertiary">Baseline</div>
                <div className="mt-1 text-lg font-semibold text-text-primary">{overview.settings.hoursPerWeek}h/w</div>
              </div>
              <div className="rounded-xl border border-border bg-surface/80 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-text-tertiary">Simulated</div>
                <div className="mt-1 text-lg font-semibold text-primary">{effectiveCapacity}h/w</div>
              </div>
              <div className="rounded-xl border border-border bg-surface/80 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-text-tertiary">Risk</div>
                <div className="mt-1 text-lg font-semibold text-error">{computed.summary.atRisk}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px_220px_220px] lg:items-end">
            <div className="rounded-xl border border-border bg-surface/80 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-text-tertiary">Simulation Capacity</span>
                <span className="text-xs font-semibold text-primary">{simulationHours ?? overview.settings.hoursPerWeek}h/week</span>
              </div>
              <input
                type="range"
                min={1}
                max={60}
                value={simulationHours ?? overview.settings.hoursPerWeek}
                onChange={(event) => setSimulationHours(Number(event.target.value))}
                className="w-full accent-[rgb(var(--primary))]"
              />
              {selectedGoal && selectedGoalSimulationWeeks !== null && selectedGoalBaselineWeeks !== null ? (
                <p className="mt-2 text-[11px] text-text-secondary">
                  <span className="font-semibold text-text-primary">{selectedGoal.title}</span>: {selectedGoalSimulationWeeks}w prep
                  at {effectiveCapacity}h/w
                  {selectedGoalWeeksDelta !== null && selectedGoalWeeksDelta !== 0 ? (
                    <span className={cn(
                      'ml-1 font-medium',
                      selectedGoalWeeksDelta > 0 ? 'text-error' : 'text-success'
                    )}>
                      ({selectedGoalWeeksDelta > 0 ? `+${selectedGoalWeeksDelta}` : selectedGoalWeeksDelta}w vs baseline)
                    </span>
                  ) : (
                    <span className="ml-1 text-text-tertiary">(same as baseline)</span>
                  )}
                  .
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-text-tertiary">
                  Lower capacity starts prep earlier and can move milestones from on track to tight/at risk.
                </p>
              )}
            </div>

            <Input
              label="Horizon (months)"
              type="number"
              min={6}
              max={36}
              inputSize="sm"
              value={horizonMonthsDraft ?? overview.settings.horizonMonths}
              onChange={(event) =>
                setHorizonMonthsDraft(Math.min(36, Math.max(6, Number(event.target.value || overview.settings.horizonMonths))))
              }
              fullWidth
            />

            <div className="rounded-xl border border-border bg-surface/80 p-3">
              <div className="text-[11px] uppercase tracking-wider text-text-tertiary">Plan State</div>
              <div className="mt-1 flex items-center gap-2 text-sm font-medium text-text-primary">
                {isPlanFetching ? (
                  <>
                    <Clock3 className="h-4 w-4 text-primary animate-pulse" />
                    Recomputing
                  </>
                ) : isSimulationDirty || isHorizonDirty ? (
                  <>
                    <Flame className="h-4 w-4 text-warning" />
                    Draft changed
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Synced
                  </>
                )}
              </div>
            </div>

            <label className="text-xs text-text-secondary">
              Planning Unit
              <select
                value={planningUnit}
                onChange={(event) => {
                  const unit = event.target.value as 'weeks' | 'months';
                  setPlanningUnit(unit);
                  setGoalForm((current) => ({
                    ...current,
                    effortUnit: unit === 'months' ? 'months' : 'hours',
                    bufferUnit: unit,
                  }));
                }}
                className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-2 text-sm text-text-primary focus:border-primary focus:outline-none"
              >
                <option value="months">Months</option>
                <option value="weeks">Weeks</option>
              </select>
            </label>

            <div className="lg:col-span-4 flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => saveBaselineMutation.mutate()}
                loading={saveBaselineMutation.isPending}
                leftIcon={<Save className="h-4 w-4" />}
                disabled={!isSimulationDirty && !isHorizonDirty}
              >
                Save as baseline
              </Button>

              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.08] transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" />
                Export image
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <TrajectoryShareCard
        ref={shareCardRef}
        goals={goals}
        generatedBlocks={generatedBlocks}
        overallStatus={overallStatus}
        effectiveCapacity={effectiveCapacity}
      />

      <div className="grid gap-6 xl:grid-cols-[1.72fr_0.82fr] 2xl:grid-cols-[1.8fr_0.75fr]">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="rounded-2xl border border-border bg-surface/35 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <CalendarRange className="h-5 w-5 text-primary" />
                  Timeline Lanes
                </h2>
                <p className="text-xs text-text-tertiary">Goals, generated prep blocks and opportunity windows across {timelineHorizonMonths} months.</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-full border border-border bg-background/40 px-2 py-0.5 text-text-secondary">
                    Range: {timelineRangeLabel}
                  </span>
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-primary/90">
                    Next: {nextMilestoneLabel}
                  </span>
                </div>
              </div>
              <Badge variant="info" size="sm">
                {generatedBlocks.length} blocks
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setShowMilestones((current) => !current)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors',
                  showMilestones
                    ? 'border-success/40 bg-success/15 text-success'
                    : 'border-border bg-background/40 text-text-tertiary'
                )}
              >
                {showMilestones ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                Milestones
              </button>

              <button
                type="button"
                onClick={() => setShowPrepBlocks((current) => !current)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors',
                  showPrepBlocks
                    ? 'border-warning/40 bg-warning/15 text-warning'
                    : 'border-border bg-background/40 text-text-tertiary'
                )}
              >
                {showPrepBlocks ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                Prep Blocks
              </button>

              <button
                type="button"
                onClick={() => setShowWindows((current) => !current)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors',
                  showWindows
                    ? 'border-info/40 bg-info/15 text-info'
                    : 'border-border bg-background/40 text-text-tertiary'
                )}
              >
                {showWindows ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                Opportunity Windows
              </button>
            </div>

            <div className="overflow-hidden">
              <div className="w-full space-y-3">
                <div className="relative h-16 rounded-lg border border-border bg-gradient-to-b from-background/80 to-background/45 px-3">
                  <div className="absolute inset-x-3 top-0.5 h-[2px] rounded-full bg-gradient-to-r from-primary/30 via-primary/15 to-transparent" />
                  {quarterSegments.map((segment, index) => (
                    <div
                      key={`q-segment-${index}-${segment.startPercent}`}
                      className={cn(
                        'absolute top-0.5 h-[2px] rounded-full bg-gradient-to-r',
                        quarterGlowClasses(segment.quarter)
                      )}
                      style={{
                        left: `calc(${segment.startPercent}% + 6px)`,
                        width: `calc(${Math.max(0, segment.endPercent - segment.startPercent)}% - 12px)`,
                      }}
                    />
                  ))}

                  {monthGridLines.map((line) => (
                    <div
                      key={`ruler-line-${line.monthOffset}`}
                      className={cn(
                        'absolute top-6 w-px',
                        line.isMajor ? 'h-7 bg-border/70' : 'h-4 bg-border/30'
                      )}
                      style={{ left: `${line.offsetPercent}%` }}
                    />
                  ))}

                  {quarterSegments.map((segment, index) => (
                    <div
                      key={`q-label-${index}-${segment.startPercent}`}
                      className="absolute top-1 h-5"
                      style={{
                        left: `${segment.startPercent}%`,
                        width: `${Math.max(0, segment.endPercent - segment.startPercent)}%`,
                      }}
                    >
                      <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.14em] text-primary/85">
                        {segment.label}
                      </span>
                    </div>
                  ))}

                  {monthLabelTicks.map((tick) => (
                    <div
                      key={`m-dot-${tick.monthOffset}-${tick.offsetPercent}`}
                      className="absolute inset-y-0"
                      style={{ left: `${tick.offsetPercent}%` }}
                    >
                      <span className="absolute bottom-1 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-border/70" />
                    </div>
                  ))}

                  <span className="absolute bottom-1 left-3 font-mono text-[10px] tracking-[0.08em] text-text-tertiary">
                    {timelineRangeStart}
                  </span>
                  <span className="absolute bottom-1 right-3 font-mono text-[10px] tracking-[0.08em] text-text-tertiary">
                    {timelineRangeEnd}
                  </span>
                </div>

                <div className="relative h-[280px] rounded-xl border border-border/80 bg-background/45 px-3 py-3">
                  <div className="absolute inset-y-3 left-[0.7%] w-[2px] rounded-full bg-primary/70 shadow-[0_0_14px_rgba(251,191,36,0.4)]" />
                  <span className="absolute left-[0.2%] top-2 rounded-full border border-primary/35 bg-primary/10 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-primary">
                    Now
                  </span>

                  {monthGridLines
                    .filter((line) => line.isMajor)
                    .map((line) => (
                      <div
                        key={`body-line-${line.monthOffset}`}
                        className="absolute inset-y-3 w-px bg-border/20"
                        style={{ left: `${line.offsetPercent}%` }}
                      />
                    ))}
                  <div className="absolute inset-x-3 top-[88px] h-px bg-border/55" />
                  <div className="absolute inset-x-3 top-[158px] h-px bg-border/55" />
                  <div className="absolute inset-x-3 top-[228px] h-px bg-border/55" />

                  {showWindows ? windows.map((window, index) => {
                    const frame = span(window.startDate, window.endDate);
                    const topOffset = 188 + (index % 2) * 34;
                    const isSelected = window.id === selectedWindowId;
                    return (
                      <div
                        key={window.id}
                        className={cn(
                          'absolute h-7 cursor-pointer rounded-md border border-info/45 bg-info/20 px-2 text-[11px] font-semibold leading-7 text-info transition-all',
                          isSelected && 'ring-1 ring-info/60 shadow-[0_0_0_1px_rgba(96,165,250,0.4)]'
                        )}
                        style={{
                          left: `${frame.left}%`,
                          width: `${frame.width}%`,
                          top: `${topOffset}px`,
                          zIndex: isSelected ? 25 : 12,
                        }}
                        title={`${window.title} · ${formatShortDate(window.startDate)} to ${formatShortDate(window.endDate)}`}
                        onClick={() => setSelectedWindowId(window.id)}
                      >
                        <span className="truncate block">{window.title}</span>
                      </div>
                    );
                  }) : null}

                  {showPrepBlocks ? generatedBlocks.map((block, index) => {
                    const key = `${block.goalId}|${block.startDate}|${block.endDate}`;
                    const frame = span(block.startDate, block.endDate);
                    const isCommitted = committedBlockKey.has(key);
                    const isSelected = block.goalId === selectedGoalId;
                    const topOffset = 116 + (index % 2) * 34;

                    return (
                      <div
                        key={key}
                        className={cn(
                          'absolute h-7 rounded-md border px-2 text-[11px] font-semibold leading-7 text-white/90 transition-all',
                          getTimelineRiskClasses(block.status),
                          isSelected && 'ring-1 ring-primary/55 shadow-[0_0_0_1px_rgba(250,240,230,0.25)]'
                        )}
                        style={{ left: `${frame.left}%`, width: `${frame.width}%`, top: `${topOffset}px`, zIndex: isSelected ? 20 : 10 }}
                        title={`${block.title} · ${formatShortDate(block.startDate)} to ${formatShortDate(block.endDate)}`}
                      >
                        <span className="truncate block">{block.title}{isCommitted ? ' · committed' : ''}</span>
                      </div>
                    );
                  }) : null}

                  {showMilestones ? goals.map((goal) => {
                    const risk = riskByGoal.get(goal.id) ?? 'on_track';
                    const isSelected = goal.id === selectedGoalId;
                    const isStatusPulsing = goalStatusPulseIds.includes(goal.id);
                    const left = toPercent(goal.dueDate);

                    return (
                      <div key={goal.id} className="absolute" style={{ left: `${left}%`, top: '30px' }}>
                        <div
                          className={cn(
                            'h-[170px] rounded-full transition-all',
                            isSelected ? 'w-[3px] shadow-[0_0_14px_rgba(250,240,230,0.35)]' : 'w-[2px]',
                            isStatusPulsing && 'animate-pulse shadow-[0_0_16px_rgba(250,240,230,0.45)]',
                            risk === 'at_risk' ? 'bg-error' : risk === 'tight' ? 'bg-warning' : 'bg-success'
                          )}
                        />
                        <div
                          className={cn(
                            'mt-1 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold',
                            isSelected ? 'text-text-primary' : 'text-text-secondary'
                          )}
                        >
                          {goal.title}
                        </div>
                      </div>
                    );
                  }) : null}

                  {goals.length === 0 && generatedBlocks.length === 0 && windows.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-text-tertiary">
                      Add milestones and windows to build your timeline.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface/35 p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Add Milestone</h3>
              <div className="space-y-3">
                <Input
                  label="Title"
                  value={goalForm.title}
                  onChange={(event) => setGoalForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Bachelor thesis submission"
                  inputSize="sm"
                  fullWidth
                />

                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-text-secondary">
                    Category
                    <select
                      value={goalForm.category}
                      onChange={(event) => setGoalForm((current) => ({ ...current, category: event.target.value as GoalCategory }))}
                      className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2 text-sm text-text-primary focus:border-primary focus:outline-none"
                    >
                      {goalCategoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <Input
                    label="Due date"
                    type="date"
                    value={goalForm.dueDate}
                    onChange={(event) => setGoalForm((current) => ({ ...current, dueDate: event.target.value }))}
                    inputSize="sm"
                    fullWidth
                  />
                </div>

                <div className="rounded-lg border border-border/70 bg-background/40 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-text-tertiary">
                    Planning mode: <span className="text-primary font-semibold">{planningUnit}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {planningUnit === 'months' ? (
                    <Input
                      label="Effort (months)"
                      type="number"
                      min={0.25}
                      max={36}
                      step={0.25}
                      value={goalForm.effortMonths}
                      onChange={(event) =>
                        setGoalForm((current) => ({
                          ...current,
                          effortMonths: Number(event.target.value || 0.25),
                          effortUnit: 'months',
                        }))
                      }
                      inputSize="sm"
                      fullWidth
                    />
                  ) : (
                    <Input
                      label="Effort (hours)"
                      type="number"
                      min={1}
                      max={2000}
                      value={goalForm.effortHours}
                      onChange={(event) =>
                        setGoalForm((current) => ({
                          ...current,
                          effortHours: Number(event.target.value || 1),
                          effortUnit: 'hours',
                        }))
                      }
                      inputSize="sm"
                      fullWidth
                    />
                  )}

                  {planningUnit === 'months' ? (
                    <Input
                      label="Buffer (months)"
                      type="number"
                      min={0.25}
                      max={12}
                      step={0.25}
                      value={goalForm.bufferMonths}
                      onChange={(event) =>
                        setGoalForm((current) => ({
                          ...current,
                          bufferMonths: Number(event.target.value || 0.25),
                          bufferUnit: 'months',
                        }))
                      }
                      inputSize="sm"
                      fullWidth
                    />
                  ) : (
                    <Input
                      label="Buffer (weeks)"
                      type="number"
                      min={0}
                      max={16}
                      value={goalForm.bufferWeeks}
                      onChange={(event) =>
                        setGoalForm((current) => ({
                          ...current,
                          bufferWeeks: Number(event.target.value || 0),
                          bufferUnit: 'weeks',
                        }))
                      }
                      inputSize="sm"
                      fullWidth
                    />
                  )}

                  <Input
                    label="Priority (1-5)"
                    type="number"
                    min={1}
                    max={5}
                    value={goalForm.priority}
                    onChange={(event) => setGoalForm((current) => ({ ...current, priority: Number(event.target.value || 3) }))}
                    inputSize="sm"
                    fullWidth
                  />
                </div>

                {planningUnit === 'months' ? (
                  <div className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-xs text-text-secondary">
                    Auto-convert: {goalForm.effortMonths} months →{' '}
                    <span className="font-semibold text-primary">{milestoneEffortHours}h</span> at {effectiveCapacity}h/week ·
                    buffer {goalForm.bufferMonths} months →{' '}
                    <span className="font-semibold text-info">{milestoneBufferWeeks} weeks</span>.
                  </div>
                ) : (
                  <div className="rounded-lg border border-border/70 bg-background/35 px-3 py-2 text-xs text-text-secondary">
                    Direct mode: effort and buffer are stored exactly as entered.
                  </div>
                )}

                <Button
                  size="sm"
                  variant="primary"
                  fullWidth
                  loading={upsertGoalMutation.isPending}
                  disabled={goalForm.title.trim().length === 0}
                  leftIcon={<Sparkles className="h-4 w-4" />}
                  onClick={() =>
                    upsertGoalMutation.mutate({
                      ...goalForm,
                      effortHours: milestoneEffortHours,
                      bufferWeeks: milestoneBufferWeeks,
                    })
                  }
                >
                  Create milestone
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface/35 p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Add Opportunity Window</h3>
              <div className="space-y-3">
                <Input
                  label="Title"
                  value={windowForm.title}
                  onChange={(event) => setWindowForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Internship recruiting Q1"
                  inputSize="sm"
                  fullWidth
                />

                <label className="text-xs text-text-secondary block">
                  Type
                  <select
                    value={windowForm.windowType}
                    onChange={(event) => setWindowForm((current) => ({ ...current, windowType: event.target.value as WindowType }))}
                    className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2 text-sm text-text-primary focus:border-primary focus:outline-none"
                  >
                    {windowTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Start"
                    type="date"
                    value={windowForm.startDate}
                    onChange={(event) => setWindowForm((current) => ({ ...current, startDate: event.target.value }))}
                    inputSize="sm"
                    fullWidth
                  />
                  <Input
                    label="End"
                    type="date"
                    value={windowForm.endDate}
                    onChange={(event) => setWindowForm((current) => ({ ...current, endDate: event.target.value }))}
                    inputSize="sm"
                    fullWidth
                  />
                </div>

                <label className="text-xs text-text-secondary block">
                  Confidence
                  <select
                    value={windowForm.confidence}
                    onChange={(event) => setWindowForm((current) => ({ ...current, confidence: event.target.value as WindowConfidence }))}
                    className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2 text-sm text-text-primary focus:border-primary focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>

                <Textarea
                  label="Notes"
                  value={windowForm.notes}
                  onChange={(event) => setWindowForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Optional context"
                  fullWidth
                />

                <Button
                  size="sm"
                  variant="secondary"
                  fullWidth
                  loading={createWindowMutation.isPending}
                  disabled={windowForm.title.trim().length === 0}
                  leftIcon={<CalendarClock className="h-4 w-4" />}
                  onClick={() => createWindowMutation.mutate(windowForm)}
                >
                  Create window
                </Button>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="rounded-2xl border border-border bg-surface/35 p-3">
            <h2 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Gauge className="h-4 w-4 text-primary" />
              Risk Console
            </h2>

            <div className="grid grid-cols-3 gap-2">
              {riskSummaryCards.map((entry) => {
                const tone = getRiskStatusTone(entry.status);
                return (
                  <div key={entry.status} className={cn('rounded-xl border px-2.5 py-2', tone.surface, tone.border)}>
                    <div className={cn('text-[10px] uppercase tracking-wider', tone.text)}>
                      {getRiskStatusLabel(entry.status)}
                    </div>
                    <div className={cn('mt-1 text-xl font-bold', tone.text)}>{entry.value}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 space-y-2">
              {alerts.length === 0 ? (
                <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  No active trajectory alerts.
                </div>
              ) : (
                alerts.map((alert, index) => (
                  (() => {
                    const alertBlock = generatedBlocks.find((block) => block.goalId === alert.goalId);
                    const suggestedTaskCount = alertBlock
                      ? Math.max(3, Math.min(12, alertBlock.requiredWeeks))
                      : taskCount;

                    return (
                      <div
                        key={`${alert.goalId}-${alert.code}-${index}`}
                        className={cn(
                          'rounded-lg border p-3 text-sm',
                          alert.severity === 'critical'
                            ? 'border-error/35 bg-error/10 text-error'
                            : 'border-warning/35 bg-warning/10 text-warning'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">{alert.code.replaceAll('_', ' ')}</p>
                            <p className="mt-0.5 text-xs text-text-secondary">{alert.message}</p>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="shrink-0"
                            disabled={!alertBlock}
                            loading={
                              createTaskPackageMutation.isPending &&
                              createTaskPackageMutation.variables?.source === 'risk_console_alert' &&
                              createTaskPackageMutation.variables?.goalId === alert.goalId
                            }
                            onClick={() => {
                              setSelectedGoalId(alert.goalId);
                              createTaskPackageMutation.mutate({
                                goalId: alert.goalId,
                                taskCount: suggestedTaskCount,
                                navigateToToday: true,
                                source: 'risk_console_alert',
                              });
                            }}
                          >
                            In Today übernehmen
                          </Button>
                        </div>
                      </div>
                    );
                  })()
                ))
              )}
            </div>
          </div>

          {selectedTrajectoryDecisionSurface ? (
            <DecisionSurfaceCard
              eyebrow="Selected plan"
              title={selectedTrajectoryDecisionSurface.title}
              summary={selectedTrajectoryDecisionSurface.summary}
              bullets={selectedTrajectoryDecisionSurface.bullets}
              chips={selectedTrajectoryDecisionSurface.chips}
              tone={selectedTrajectoryDecisionSurface.tone}
              icon={<Sparkles className="h-4 w-4" />}
              footer={<p className="text-xs text-text-secondary">{selectedTrajectoryDecisionSurface.nextStep}</p>}
            />
          ) : null}

          <div className="rounded-2xl border border-border bg-surface/35 p-3">
            <h3 className="mb-2 text-sm font-semibold text-text-primary">Milestones</h3>
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {goals.length === 0 ? (
                <p className="text-sm text-text-tertiary">No milestones yet.</p>
              ) : (
                goals.map((goal) => {
                  const risk = riskByGoal.get(goal.id);
                  const isSelected = goal.id === selectedGoalId;
                  const isStatusPulsing = goalStatusPulseIds.includes(goal.id);
                  return (
                  <div
                    key={goal.id}
                    className={cn(
                      'rounded-lg border bg-background/50 px-3 py-2 transition-colors',
                      isSelected ? 'border-primary/45 bg-primary/10' : 'border-border hover:border-primary/30',
                      isStatusPulsing && 'animate-pulse border-primary/55 shadow-[0_0_0_1px_rgba(250,240,230,0.25)]'
                    )}
                  >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{goal.title}</p>
                          <p className="text-[11px] text-text-tertiary">
                            Due {formatShortDate(goal.dueDate)} · {goal.effortHours}h · buffer {goal.bufferWeeks}w
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedGoalId(goal.id)}
                            className={cn(
                              'rounded-md border px-1.5 py-1 text-[10px] font-medium transition-colors',
                              isSelected
                                ? 'border-primary/40 bg-primary/15 text-primary'
                                : 'border-border text-text-tertiary hover:border-primary/30 hover:text-text-primary'
                            )}
                          >
                            focus
                          </button>
                          {risk && (
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]',
                                getRiskStatusTone(risk).badge
                              )}
                            >
                              {getRiskStatusLabel(risk)}
                            </span>
                          )}
                          <button
                            onClick={() => deleteGoalMutation.mutate(goal.id)}
                            className="rounded-md p-1.5 text-text-tertiary hover:bg-error/10 hover:text-error"
                            aria-label={`Delete ${goal.title}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface/35 p-3">
            <h3 className="mb-2 text-sm font-semibold text-text-primary">Opportunity Windows</h3>
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {windows.length === 0 ? (
                <p className="text-sm text-text-tertiary">No windows yet.</p>
              ) : (
                windows.map((window) => {
                  const isSelected = window.id === selectedWindowId;
                  return (
                  <div
                    key={window.id}
                    className={cn(
                      'rounded-lg border bg-background/50 px-3 py-2 transition-colors',
                      isSelected
                        ? 'border-info/50 ring-1 ring-info/50'
                        : 'border-border'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{window.title}</p>
                        <p className="text-[11px] text-text-tertiary">
                          {formatShortDate(window.startDate)} → {formatShortDate(window.endDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedWindowId(window.id);
                            setShowWindows(true);
                          }}
                          className={cn(
                            'rounded-md border px-1.5 py-1 text-[10px] font-medium transition-colors',
                            isSelected
                              ? 'border-info/45 bg-info/15 text-info'
                              : 'border-border text-text-tertiary hover:border-info/30 hover:text-info'
                          )}
                        >
                          focus
                        </button>
                        <Badge size="sm" variant="info">
                          {window.confidence}
                        </Badge>
                        <button
                          onClick={() => deleteWindowMutation.mutate(window.id)}
                          className="rounded-md p-1.5 text-text-tertiary hover:bg-error/10 hover:text-error"
                          aria-label={`Delete ${window.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
                })
              )}
            </div>
          </div>
        </motion.section>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-primary/20 bg-gradient-to-r from-surface/80 via-surface/60 to-surface/80 p-4"
      >
        <div className="grid gap-4 lg:grid-cols-[1.2fr_auto_auto_auto] lg:items-end">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-text-secondary">
              Task package source block
              <select
                value={selectedGoalId}
                onChange={(event) => setSelectedGoalId(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-border bg-background px-2 text-sm text-text-primary focus:border-primary focus:outline-none"
              >
                {generatedBlocks.length === 0 ? (
                  <option value="">No generated block available</option>
                ) : (
                  generatedBlocks.map((block) => (
                    <option key={block.goalId} value={block.goalId}>
                      {block.title} ({formatShortDate(block.startDate)} - {formatShortDate(block.endDate)})
                    </option>
                  ))
                )}
              </select>
            </label>

            <Input
              label="Task count"
              type="number"
              min={1}
              max={60}
              value={taskCount}
              onChange={(event) => setTaskCount(Math.max(1, Math.min(60, Number(event.target.value || 6))))}
              inputSize="md"
              fullWidth
            />
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              void refetchPlan();
              soundToast.success('Plan regenerated.');
            }}
            loading={isPlanFetching}
            leftIcon={<Wand2 className="h-4 w-4" />}
          >
            Generate plan
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => commitBlocksMutation.mutate()}
            loading={commitBlocksMutation.isPending || isOverviewFetching}
            disabled={generatedBlocks.length === 0}
            leftIcon={<ArrowRight className="h-4 w-4" />}
          >
            Commit simulation
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => createTaskPackageMutation.mutate({ source: 'footer' })}
            loading={createTaskPackageMutation.isPending}
            disabled={!selectedBlock}
            leftIcon={computed.summary.atRisk > 0 ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          >
            Create task package
          </Button>
        </div>
      </motion.section>
    </div>
  );
}
