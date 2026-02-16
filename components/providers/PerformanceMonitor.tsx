'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';

declare global {
  interface Window {
    __PRISM_PERF__?: Array<Record<string, unknown>>;
  }
}

function pushMetric(metric: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const existing = window.__PRISM_PERF__ || [];
  window.__PRISM_PERF__ = [...existing, metric].slice(-200);
}

export default function PerformanceMonitor() {
  useReportWebVitals((metric) => {
    pushMetric({
      type: 'web-vital',
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      ts: Date.now(),
    });

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug('[Perf][WebVital]', metric.name, metric.value, metric.rating);
    }
  });

  useEffect(() => {
    const navEntries = performance.getEntriesByType('navigation');
    const nav = navEntries[0] as PerformanceNavigationTiming | undefined;
    if (!nav) return;

    pushMetric({
      type: 'navigation',
      dnsMs: nav.domainLookupEnd - nav.domainLookupStart,
      connectMs: nav.connectEnd - nav.connectStart,
      ttfbMs: nav.responseStart - nav.requestStart,
      domContentLoadedMs: nav.domContentLoadedEventEnd - nav.fetchStart,
      loadEventMs: nav.loadEventEnd - nav.fetchStart,
      ts: Date.now(),
    });
  }, []);

  return null;
}
