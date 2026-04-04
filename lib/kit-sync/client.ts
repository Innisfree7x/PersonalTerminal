'use client';

import type { KitSyncStatus } from '@/lib/kit-sync/types';

export async function fetchKitStatus(): Promise<KitSyncStatus> {
  const response = await fetch('/api/kit/status', { cache: 'no-store' });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? 'KIT Sync Status konnte nicht geladen werden.');
  }
  return response.json() as Promise<KitSyncStatus>;
}
