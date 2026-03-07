import { beforeEach, describe, expect, it } from 'vitest';
import { getTodayKey, loadDismissedIds, persistDismissedIds } from '@/lib/dashboard/nbaDismissals';
import { LEGACY_STORAGE_KEYS, STORAGE_KEYS } from '@/lib/storage/keys';

function createStorageMock(initial: Record<string, string> = {}) {
  const data = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
    dump: () => Object.fromEntries(data.entries()),
  };
}

describe('nba dismissals storage', () => {
  beforeEach(() => {
    const localStorageMock = createStorageMock();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: localStorageMock,
    });
  });

  it('persists and reloads dismissed ids for a specific day', () => {
    const day = '2026-03-07';
    persistDismissedIds(new Set(['a', 'b']), day);

    const loaded = loadDismissedIds(day);
    expect(Array.from(loaded).sort()).toEqual(['a', 'b']);
  });

  it('migrates legacy dismiss map to canonical key', () => {
    const today = getTodayKey();
    const legacyKey = LEGACY_STORAGE_KEYS.nbaDismissed[0] ?? 'prism:nba:dismissed';
    window.localStorage.setItem(legacyKey, JSON.stringify({ [today]: ['legacy-id'] }));

    const loaded = loadDismissedIds(today);

    expect(Array.from(loaded)).toEqual(['legacy-id']);
    expect(window.localStorage.getItem(STORAGE_KEYS.nbaDismissed)).toContain('legacy-id');
    expect(window.localStorage.getItem(legacyKey)).toBeNull();
  });

  it('trims persisted day-map to a bounded history window', () => {
    for (let i = 1; i <= 30; i += 1) {
      const day = `2026-03-${String(i).padStart(2, '0')}`;
      persistDismissedIds(new Set([`id-${i}`]), day);
    }

    const raw = window.localStorage.getItem(STORAGE_KEYS.nbaDismissed);
    expect(raw).not.toBeNull();

    const parsed = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    expect(Object.keys(parsed).length).toBeLessThanOrEqual(21);
    expect(parsed['2026-03-30']).toEqual(['id-30']);
  });
});
