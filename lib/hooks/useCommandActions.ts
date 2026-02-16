'use client';

import { useEffect } from 'react';

export type PrismCommandAction =
  | 'open-new-goal'
  | 'open-new-course'
  | 'open-new-application';

const PRISM_COMMAND_EVENT = 'prism:command-action';
const PRISM_PENDING_COMMAND_KEY = 'prism:pending-command-action';

export function dispatchPrismCommandAction(action: PrismCommandAction): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PRISM_COMMAND_EVENT, { detail: { action } }));
}

export function queuePrismCommandAction(action: PrismCommandAction): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(PRISM_PENDING_COMMAND_KEY, action);
}

function consumeQueuedPrismCommandAction(action: PrismCommandAction): boolean {
  if (typeof window === 'undefined') return false;
  const queued = window.sessionStorage.getItem(PRISM_PENDING_COMMAND_KEY);
  if (queued !== action) return false;
  window.sessionStorage.removeItem(PRISM_PENDING_COMMAND_KEY);
  return true;
}

export function usePrismCommandAction(
  action: PrismCommandAction,
  handler: () => void
): void {
  useEffect(() => {
    if (consumeQueuedPrismCommandAction(action)) {
      handler();
    }

    const listener = (event: Event) => {
      const customEvent = event as CustomEvent<{ action?: PrismCommandAction }>;
      if (customEvent.detail?.action !== action) return;
      window.sessionStorage.removeItem(PRISM_PENDING_COMMAND_KEY);
      handler();
    };

    window.addEventListener(PRISM_COMMAND_EVENT, listener as EventListener);
    return () => {
      window.removeEventListener(PRISM_COMMAND_EVENT, listener as EventListener);
    };
  }, [action, handler]);
}
