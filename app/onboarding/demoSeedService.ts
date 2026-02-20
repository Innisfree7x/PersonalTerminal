'use client';

import { DEMO_COURSES, DEMO_GOALS, DEMO_TASKS } from './demoData';
import { trackOnboardingEvent } from './analytics';
import { fetchDemoDataIdsAction, updateProfileAction, type DemoDataIds } from '@/app/actions/profile';

const LS_KEY = 'innis_demo_ids';

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
export async function seedDemoData(): Promise<void> {
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

  saveDemoIds(ids);
  try {
    await updateProfileAction({ demoDataIds: ids });
  } catch {
    // Metadata persistence is best-effort; local fallback remains available.
  }
}

/**
 * Removes all demo data that was previously seeded.
 * Dispatches a custom DOM event so React Query caches can be invalidated.
 */
export async function removeDemoData(): Promise<void> {
  let ids = loadDemoIds();
  if (!ids) {
    try {
      ids = await fetchDemoDataIdsAction();
    } catch {
      ids = null;
    }
  }
  if (!ids) return;

  const totalIds = ids.courseIds.length + ids.goalIds.length + ids.taskIds.length;

  await Promise.allSettled([
    ...ids.courseIds.map((id) => fetch(`/api/courses/${id}`, { method: 'DELETE' })),
    ...ids.goalIds.map((id) => fetch(`/api/goals/${id}`, { method: 'DELETE' })),
    ...ids.taskIds.map((id) => fetch(`/api/daily-tasks/${id}`, { method: 'DELETE' })),
  ]);

  try {
    localStorage.removeItem(LS_KEY);
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
