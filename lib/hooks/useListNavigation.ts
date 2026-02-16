'use client';

import { useEffect, useMemo, useState } from 'react';
import { hasHotkeyBlocker, isTypingTarget } from '@/lib/hotkeys/guards';

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

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target) || hasHotkeyBlocker()) return;

      if (event.key === 'j' || event.key === 'J' || event.key === 'ArrowDown') {
        event.preventDefault();
        focusAt((focusedIndex ?? -1) + 1);
        return;
      }

      if (event.key === 'k' || event.key === 'K' || event.key === 'ArrowUp') {
        event.preventDefault();
        focusAt((focusedIndex ?? ids.length) - 1);
        return;
      }

      if (event.key === 'Enter') {
        if (focusedIndex === null) return;
        const item = items[focusedIndex];
        if (!item) return;
        event.preventDefault();
        onEnter?.(item);
        return;
      }

      if (event.key === ' ') {
        if (focusedIndex === null) return;
        const item = items[focusedIndex];
        if (!item) return;
        event.preventDefault();
        onSpace?.(item);
        return;
      }

      if (event.key === 'Escape') {
        if (focusedIndex === null) return;
        event.preventDefault();
        setFocusedIndex(null);
        onEscape?.();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
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

