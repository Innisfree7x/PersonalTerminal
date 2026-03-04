'use client';

import {
  DEMO_COURSES,
  DEMO_GOALS,
  DEMO_TASKS,
  DEMO_TRAJECTORY_GOAL,
  DEMO_TRAJECTORY_SETTINGS,
} from './demoData';
import { trackOnboardingEvent } from './analytics';
import { fetchDemoDataIdsAction, updateProfileAction, type DemoDataIds } from '@/app/actions/profile';

const LS_KEY = 'innis_demo_ids';
const LS_TRAJECTORY_GOALS_KEY = 'innis_demo_trajectory_goal_ids';

type TrajectoryRiskStatus = 'on_track' | 'tight' | 'at_risk';

export interface DemoTrajectorySeedResult {
  goalId: string;
  goalDraft: {
    title: string;
    category: 'thesis' | 'gmat' | 'master_app' | 'internship' | 'other';
    dueDate: string;
    effortHours: number;
    bufferWeeks: number;
    priority: number;
    status: 'active';
  };
  settingsDraft: {
    hoursPerWeek: number;
    horizonMonths: number;
  };
  planSummary: {
    status: TrajectoryRiskStatus;
    startDate: string;
    explanation: string;
    effectiveCapacityHoursPerWeek: number;
  };
}

export interface DemoSeedResult {
  trajectory: DemoTrajectorySeedResult;
}

function loadDemoIds(): DemoDataIds | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as DemoDataIds) : null;
  } catch {
    return null;
  }
}

function saveDemoIds(ids: DemoDataIds): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ids));
  } catch {
    // localStorage unavailable
  }
}

function loadDemoTrajectoryGoalIds(): string[] {
  try {
    const raw = localStorage.getItem(LS_TRAJECTORY_GOALS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === 'string');
  } catch {
    return [];
  }
}

function saveDemoTrajectoryGoalIds(ids: string[]): void {
  try {
    localStorage.setItem(LS_TRAJECTORY_GOALS_KEY, JSON.stringify(ids));
  } catch {
    // localStorage unavailable
  }
}

export function hasDemoData(): boolean {
  try {
    return !!localStorage.getItem(LS_KEY);
  } catch {
    return false;
  }
}

/**
 * Seeds demo courses, goals, and tasks via existing API routes.
 * Stores all created IDs in localStorage and user_metadata so they can be removed later.
 */
export async function seedDemoData(): Promise<DemoSeedResult> {
  trackOnboardingEvent('demo_seed_started');

  const today = new Date().toISOString().split('T')[0] ?? new Date().toISOString().slice(0, 10);
  const ids: DemoDataIds = { courseIds: [], goalIds: [], taskIds: [] };

  // Create courses
  for (const course of DEMO_COURSES) {
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(course),
    });
    if (res.ok) {
      const data = (await res.json()) as { id: string };
      ids.courseIds.push(data.id);
    }
  }

  // Create goals
  for (const goal of DEMO_GOALS) {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    });
    if (res.ok) {
      const data = (await res.json()) as { id: string };
      ids.goalIds.push(data.id);
    }
  }

  // Create tasks for today
  for (const task of DEMO_TASKS) {
    const res = await fetch('/api/daily-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, date: today, source: 'manual' }),
    });
    if (res.ok) {
      const data = (await res.json()) as { id: string };
      ids.taskIds.push(data.id);
    }
  }

  // Trajectory goal + settings + computed plan for onboarding v2.
  const goalResponse = await fetch('/api/trajectory/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(DEMO_TRAJECTORY_GOAL),
  });
  if (!goalResponse.ok) {
    const payload = await goalResponse.json().catch(() => null);
    throw new Error(payload?.error?.message || 'Trajectory demo goal konnte nicht erstellt werden.');
  }
  const createdGoal = (await goalResponse.json()) as { id: string };

  const settingsResponse = await fetch('/api/trajectory/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(DEMO_TRAJECTORY_SETTINGS),
  });
  if (!settingsResponse.ok) {
    const payload = await settingsResponse.json().catch(() => null);
    throw new Error(payload?.error?.message || 'Trajectory demo settings konnten nicht gespeichert werden.');
  }

  const planResponse = await fetch('/api/trajectory/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ simulationHoursPerWeek: DEMO_TRAJECTORY_SETTINGS.hoursPerWeek }),
  });
  if (!planResponse.ok) {
    const payload = await planResponse.json().catch(() => null);
    throw new Error(payload?.error?.message || 'Trajectory demo plan konnte nicht berechnet werden.');
  }
  const planPayload = (await planResponse.json()) as {
    simulation: { effectiveCapacityHoursPerWeek: number };
    computed: {
      generatedBlocks: Array<{
        goalId: string;
        status: TrajectoryRiskStatus;
        startDate: string;
        reasons: string[];
      }>;
    };
  };
  const block =
    planPayload.computed.generatedBlocks.find((item) => item.goalId === createdGoal.id) ??
    planPayload.computed.generatedBlocks[0];
  if (!block) {
    throw new Error('Trajectory demo plan enthält keinen block.');
  }

  const explanation =
    block.reasons[0] === 'required_start_in_past'
      ? 'Start date is already in the past based on current capacity.'
      : block.reasons[0] === 'collision_above_50pct'
        ? 'High overlap with other planned blocks detected.'
        : block.reasons[0] === 'collision_above_25pct'
          ? 'Moderate overlap with other planned blocks detected.'
          : 'Trajectory computed with deterministic planning rules.';

  saveDemoIds(ids);
  saveDemoTrajectoryGoalIds([createdGoal.id]);
  try {
    await updateProfileAction({ demoDataIds: ids });
  } catch {
    // Metadata persistence is best-effort; local fallback remains available.
  }

  return {
    trajectory: {
      goalId: createdGoal.id,
      goalDraft: DEMO_TRAJECTORY_GOAL,
      settingsDraft: {
        hoursPerWeek: DEMO_TRAJECTORY_SETTINGS.hoursPerWeek,
        horizonMonths: DEMO_TRAJECTORY_SETTINGS.horizonMonths,
      },
      planSummary: {
        status: block.status,
        startDate: block.startDate,
        explanation,
        effectiveCapacityHoursPerWeek: planPayload.simulation.effectiveCapacityHoursPerWeek,
      },
    },
  };
}

/**
 * Removes all demo data that was previously seeded.
 * Dispatches a custom DOM event so React Query caches can be invalidated.
 */
export async function removeDemoData(): Promise<void> {
  const trajectoryGoalIds = loadDemoTrajectoryGoalIds();
  let ids = loadDemoIds();
  if (!ids) {
    try {
      ids = await fetchDemoDataIdsAction();
    } catch {
      ids = null;
    }
  }
  if (!ids && trajectoryGoalIds.length === 0) return;
  const safeIds: DemoDataIds = ids ?? { courseIds: [], goalIds: [], taskIds: [] };
  const totalIds = safeIds.courseIds.length + safeIds.goalIds.length + safeIds.taskIds.length + trajectoryGoalIds.length;

  await Promise.allSettled([
    ...safeIds.courseIds.map((id) => fetch(`/api/courses/${id}`, { method: 'DELETE' })),
    ...safeIds.goalIds.map((id) => fetch(`/api/goals/${id}`, { method: 'DELETE' })),
    ...safeIds.taskIds.map((id) => fetch(`/api/daily-tasks/${id}`, { method: 'DELETE' })),
    ...trajectoryGoalIds.map((id) => fetch(`/api/trajectory/goals/${id}`, { method: 'DELETE' })),
  ]);

  try {
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_TRAJECTORY_GOALS_KEY);
  } catch {
    // ignore
  }
  try {
    await updateProfileAction({ demoDataIds: null });
  } catch {
    // ignore metadata cleanup failures
  }

  trackOnboardingEvent('demo_seed_removed', { ids_removed: totalIds });

  // Signal to React Query / page components to refetch
  try {
    window.dispatchEvent(new CustomEvent('innis:demo-removed'));
  } catch {
    // ignore in SSR contexts
  }
}
