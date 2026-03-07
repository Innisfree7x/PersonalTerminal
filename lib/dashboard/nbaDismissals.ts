'use client';

import { LEGACY_STORAGE_KEYS, readStorageValueWithLegacy, STORAGE_KEYS } from '@/lib/storage/keys';

type DismissMap = Record<string, string[]>;

const MAX_DAYS_TO_KEEP = 21;

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

function sanitizeDismissMap(value: unknown): DismissMap {
  if (!value || typeof value !== 'object') return {};
  const map = value as Record<string, unknown>;
  const result: DismissMap = {};
  for (const [dateKey, ids] of Object.entries(map)) {
    if (!Array.isArray(ids)) continue;
    result[dateKey] = ids.filter((id): id is string => typeof id === 'string' && id.length > 0);
  }
  return result;
}

function trimOldDays(map: DismissMap): DismissMap {
  const keys = Object.keys(map).sort();
  if (keys.length <= MAX_DAYS_TO_KEEP) return map;
  const keep = keys.slice(-MAX_DAYS_TO_KEEP);
  const trimmed: DismissMap = {};
  for (const key of keep) trimmed[key] = map[key] ?? [];
  return trimmed;
}

export function loadDismissedIds(dayKey = getTodayKey()): Set<string> {
  if (typeof window === 'undefined') return new Set<string>();

  try {
    const raw = readStorageValueWithLegacy(
      window.localStorage,
      STORAGE_KEYS.nbaDismissed,
      LEGACY_STORAGE_KEYS.nbaDismissed
    );
    if (!raw) return new Set<string>();
    const parsed = sanitizeDismissMap(JSON.parse(raw));
    return new Set(parsed[dayKey] ?? []);
  } catch {
    return new Set<string>();
  }
}

export function persistDismissedIds(ids: Set<string>, dayKey = getTodayKey()): void {
  if (typeof window === 'undefined') return;

  try {
    const raw = readStorageValueWithLegacy(
      window.localStorage,
      STORAGE_KEYS.nbaDismissed,
      LEGACY_STORAGE_KEYS.nbaDismissed
    );
    const parsed = raw ? sanitizeDismissMap(JSON.parse(raw)) : {};
    parsed[dayKey] = Array.from(ids);
    const compact = trimOldDays(parsed);
    window.localStorage.setItem(STORAGE_KEYS.nbaDismissed, JSON.stringify(compact));
  } catch {
    // Ignore storage failures (private mode or blocked storage).
  }
}
