'use client';

import { useEffect, useMemo, useState } from 'react';
import { hasHotkeyBlocker, isTypingTarget } from '@/lib/hotkeys/guards';

type ListAction = 'next' | 'prev' | 'enter' | 'space' | 'clear';
const LIST_NAV_EVENT = 'prism:list-action';

export function dispatchListNavigationAction(action: ListAction): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(LIST_NAV_EVENT, { detail: { action } }));
}

interface UseListNavigationOptions<T> {
  items: T[];
  getId: (item: T) => string;
  enabled?: boolean;
  onEnter?: (item: T) => void;
  onSpace?: (item: T) => void;
  onEscape?: () => void;
}

interface UseListNavigationResult {
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
}

export function useListNavigation<T>({
  items,
  getId,
  enabled = true,
  onEnter,
  onSpace,
  onEscape,
}: UseListNavigationOptions<T>): UseListNavigationResult {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const ids = useMemo(() => items.map(getId), [items, getId]);

  useEffect(() => {
    if (!ids.length) {
      setFocusedIndex(null);
      return;
    }

    if (focusedIndex === null) return;
    if (focusedIndex < ids.length) return;
    setFocusedIndex(ids.length - 1);
  }, [ids, focusedIndex]);

  useEffect(() => {
    if (!enabled) return;

    const focusAt = (nextIndex: number) => {
      if (!ids.length) return;
      const bounded = ((nextIndex % ids.length) + ids.length) % ids.length;
      setFocusedIndex(bounded);
      const id = ids[bounded];
      if (!id) return;
      const node = document.querySelector<HTMLElement>(`[data-list-nav-id="${CSS.escape(id)}"]`);
      node?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };

    const runAction = (action: ListAction) => {
      if (action === 'next') {
        focusAt((focusedIndex ?? -1) + 1);
        return true;
      }

      if (action === 'prev') {
        focusAt((focusedIndex ?? ids.length) - 1);
        return true;
      }

      if (action === 'enter') {
        if (focusedIndex === null) return false;
        const item = items[focusedIndex];
        if (!item) return false;
        onEnter?.(item);
        return true;
      }

      if (action === 'space') {
        if (focusedIndex === null) return false;
        const item = items[focusedIndex];
        if (!item) return false;
        onSpace?.(item);
        return true;
      }

      if (action === 'clear') {
        if (focusedIndex === null) return false;
        setFocusedIndex(null);
        onEscape?.();
        return true;
      }

      return false;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target) || hasHotkeyBlocker()) return;

      if (event.key === 'j' || event.key === 'J' || event.key === 'ArrowDown') {
        event.preventDefault();
        runAction('next');
        return;
      }

      if (event.key === 'k' || event.key === 'K' || event.key === 'ArrowUp') {
        event.preventDefault();
        runAction('prev');
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        runAction('enter');
        return;
      }

      if (event.key === ' ') {
        event.preventDefault();
        runAction('space');
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        runAction('clear');
      }
    };

    const onExternalAction = (event: Event) => {
      const customEvent = event as CustomEvent<{ action?: ListAction }>;
      const action = customEvent.detail?.action;
      if (!action) return;
      if (runAction(action)) {
        customEvent.preventDefault();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener(LIST_NAV_EVENT, onExternalAction as EventListener);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener(LIST_NAV_EVENT, onExternalAction as EventListener);
    };
  }, [enabled, focusedIndex, ids, items, onEnter, onEscape, onSpace]);

  return {
    focusedId: focusedIndex !== null ? (ids[focusedIndex] ?? null) : null,
    setFocusedId: (id: string | null) => {
      if (id === null) {
        setFocusedIndex(null);
        return;
      }
      const idx = ids.findIndex((currentId) => currentId === id);
      setFocusedIndex(idx === -1 ? null : idx);
    },
  };
}
