'use client';

export type ChampionEvent =
  | { type: 'TASK_COMPLETED'; taskTitle?: string }
  | { type: 'PENTAKILL'; count: number }
  | { type: 'GOAL_CREATED' }
  | { type: 'DEADLINE_WARNING'; hoursLeft: number }
  | { type: 'FOCUS_START' }
  | { type: 'FOCUS_END' }
  | { type: 'LEVEL_UP'; newLevel: number }
  | { type: 'STREAK_BROKEN' }
  | { type: 'PAGE_CHANGE'; page: string }
  | { type: 'APPLICATION_SENT' }
  | { type: 'EXERCISE_COMPLETED' };

const CHAMPION_EVENT_NAME = 'prism:champion-event';

export function dispatchChampionEvent(event: ChampionEvent): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ChampionEvent>(CHAMPION_EVENT_NAME, { detail: event }));
}

export function subscribeChampionEvent(
  handler: (event: ChampionEvent) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const listener = (raw: Event) => {
    const customEvent = raw as CustomEvent<ChampionEvent>;
    if (!customEvent.detail) return;
    handler(customEvent.detail);
  };

  window.addEventListener(CHAMPION_EVENT_NAME, listener);
  return () => window.removeEventListener(CHAMPION_EVENT_NAME, listener);
}

