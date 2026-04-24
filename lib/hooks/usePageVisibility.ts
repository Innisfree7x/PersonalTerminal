'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document === 'undefined') return true;
    return document.visibilityState === 'visible';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleChange);
    return () => document.removeEventListener('visibilitychange', handleChange);
  }, []);

  return isVisible;
}

/**
 * True when animations should be skipped — either because the user prefers
 * reduced motion or because the page is currently hidden (background tab).
 * Centralising this keeps CPU-burning Infinity animations in sync with both
 * OS accessibility setting and tab visibility.
 */
export function useAnimationSuspended(): boolean {
  const reducedMotion = useReducedMotion();
  const isVisible = usePageVisibility();
  return Boolean(reducedMotion) || !isVisible;
}
