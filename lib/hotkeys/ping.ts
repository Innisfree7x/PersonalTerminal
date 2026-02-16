'use client';

export type PingAction = 'critical' | 'in-progress' | 'snooze' | 'done';

const PRISM_PING_EVENT = 'prism:ping-action';

export function dispatchPingAction(action: PingAction): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PRISM_PING_EVENT, { detail: { action } }));
}

export function subscribePingAction(handler: (action: PingAction) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<{ action?: PingAction }>;
    const action = customEvent.detail?.action;
    if (!action) return;
    handler(action);
  };
  window.addEventListener(PRISM_PING_EVENT, listener as EventListener);
  return () => window.removeEventListener(PRISM_PING_EVENT, listener as EventListener);
}

