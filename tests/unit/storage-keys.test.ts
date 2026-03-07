import { describe, expect, it } from 'vitest';
import { readStorageValueWithLegacy } from '@/lib/storage/keys';

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
    snapshot: () => Object.fromEntries(data.entries()),
  };
}

describe('storage key migration helper', () => {
  it('returns direct value when canonical key exists', () => {
    const storage = createStorageMock({
      'innis:key': 'canonical',
      'legacy:key': 'legacy',
    });

    const value = readStorageValueWithLegacy(storage, 'innis:key', ['legacy:key']);

    expect(value).toBe('canonical');
    expect(storage.snapshot()).toEqual({
      'innis:key': 'canonical',
      'legacy:key': 'legacy',
    });
  });

  it('migrates legacy value to canonical key when direct key is missing', () => {
    const storage = createStorageMock({ 'legacy:key': 'legacy' });

    const value = readStorageValueWithLegacy(storage, 'innis:key', ['legacy:key']);

    expect(value).toBe('legacy');
    expect(storage.snapshot()).toEqual({ 'innis:key': 'legacy' });
  });

  it('returns null when neither canonical nor legacy key exists', () => {
    const storage = createStorageMock();
    const value = readStorageValueWithLegacy(storage, 'innis:key', ['legacy:key']);
    expect(value).toBeNull();
  });
});
