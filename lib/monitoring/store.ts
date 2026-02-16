import type { MonitoringSeverity } from '@/lib/monitoring';
import { alertCooldownMs } from '@/lib/monitoring/rules';

export interface MonitoringIncident {
  fingerprint: string;
  message: string;
  errorName: string;
  source: 'client' | 'server' | 'api';
  severity: MonitoringSeverity;
  count: number;
  firstSeenAt: string;
  lastSeenAt: string;
  lastAlertAt?: string;
  context?: Record<string, unknown>;
}

interface MonitoringStore {
  incidents: Map<string, MonitoringIncident>;
  ingress: Map<string, number[]>;
}

const store: MonitoringStore = {
  incidents: new Map(),
  ingress: new Map(),
};

const MAX_INCIDENTS = 500;
const MAX_INGRESS_KEYS = 500;
const INGRESS_WINDOW_MS = 60_000;
const INGRESS_LIMIT_PER_MINUTE = 120;

function pruneStoreIfNeeded(): void {
  if (store.incidents.size <= MAX_INCIDENTS) return;
  const sorted = Array.from(store.incidents.values()).sort(
    (a, b) => new Date(a.lastSeenAt).getTime() - new Date(b.lastSeenAt).getTime()
  );
  const toDelete = sorted.slice(0, store.incidents.size - MAX_INCIDENTS);
  toDelete.forEach((incident) => {
    store.incidents.delete(incident.fingerprint);
  });
}

function pruneIngress(now: number): void {
  if (store.ingress.size > MAX_INGRESS_KEYS) {
    const keys = Array.from(store.ingress.keys()).slice(0, store.ingress.size - MAX_INGRESS_KEYS);
    keys.forEach((key) => store.ingress.delete(key));
  }

  Array.from(store.ingress.entries()).forEach(([key, timestamps]) => {
    const filtered = timestamps.filter((ts: number) => now - ts <= INGRESS_WINDOW_MS);
    if (filtered.length === 0) {
      store.ingress.delete(key);
      return;
    }
    store.ingress.set(key, filtered);
  });
}

export function allowIngress(key: string): boolean {
  const now = Date.now();
  pruneIngress(now);
  const existing = store.ingress.get(key) || [];
  const filtered = existing.filter((ts) => now - ts <= INGRESS_WINDOW_MS);
  if (filtered.length >= INGRESS_LIMIT_PER_MINUTE) {
    store.ingress.set(key, filtered);
    return false;
  }
  filtered.push(now);
  store.ingress.set(key, filtered);
  return true;
}

export function upsertIncident(input: {
  fingerprint: string;
  message: string;
  errorName: string;
  source: 'client' | 'server' | 'api';
  severity: MonitoringSeverity;
  context?: Record<string, unknown>;
}): { incident: MonitoringIncident; shouldAlert: boolean } {
  const nowIso = new Date().toISOString();
  const existing = store.incidents.get(input.fingerprint);

  if (!existing) {
    const created: MonitoringIncident = {
      fingerprint: input.fingerprint,
      message: input.message,
      errorName: input.errorName,
      source: input.source,
      severity: input.severity,
      count: 1,
      firstSeenAt: nowIso,
      lastSeenAt: nowIso,
      ...(input.context ? { context: input.context } : {}),
    };
    store.incidents.set(input.fingerprint, created);
    pruneStoreIfNeeded();
    return {
      incident: created,
      shouldAlert: input.severity === 'critical' || input.severity === 'error',
    };
  }

  const merged: MonitoringIncident = {
    ...existing,
    severity: input.severity === 'critical' ? 'critical' : existing.severity,
    count: existing.count + 1,
    lastSeenAt: nowIso,
    ...(input.context ? { context: input.context } : {}),
  };

  const cooldown = alertCooldownMs(merged.severity);
  const lastAlertMs = merged.lastAlertAt ? new Date(merged.lastAlertAt).getTime() : 0;
  const shouldAlert =
    (merged.severity === 'critical' || merged.severity === 'error') &&
    Date.now() - lastAlertMs > cooldown;

  if (shouldAlert) {
    merged.lastAlertAt = nowIso;
  }

  store.incidents.set(input.fingerprint, merged);
  return { incident: merged, shouldAlert };
}

export function markIncidentAlerted(fingerprint: string): void {
  const existing = store.incidents.get(fingerprint);
  if (!existing) return;
  store.incidents.set(fingerprint, {
    ...existing,
    lastAlertAt: new Date().toISOString(),
  });
}

export function getMonitoringHealthSnapshot() {
  const incidents = Array.from(store.incidents.values()).sort(
    (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
  );

  const severityTotals: Record<MonitoringSeverity, number> = {
    info: 0,
    warning: 0,
    error: 0,
    critical: 0,
  };
  incidents.forEach((incident) => {
    severityTotals[incident.severity] += incident.count;
  });

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      incidents: incidents.length,
      events: incidents.reduce((sum, incident) => sum + incident.count, 0),
      bySeverity: severityTotals,
    },
    topIncidents: incidents.slice(0, 20),
  };
}
