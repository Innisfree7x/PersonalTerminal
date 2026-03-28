import { describe, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  serverEnv: {
    CRON_SECRET: undefined as string | undefined,
    NODE_ENV: 'test' as string,
  },
}));

vi.mock('@/lib/env', () => ({
  serverEnv: mocks.serverEnv,
}));

import { requireCronAuth } from '@/lib/api/cron';

describe('requireCronAuth', () => {
  test('erlaubt lokale Aufrufe ohne Secret ausserhalb von production', () => {
    mocks.serverEnv.CRON_SECRET = undefined;
    mocks.serverEnv.NODE_ENV = 'development';

    const request = new NextRequest('https://innis.ai/api/cron/test');

    expect(requireCronAuth(request)).toBeNull();
  });

  test('liefert 500 wenn in production kein Secret gesetzt ist', async () => {
    mocks.serverEnv.CRON_SECRET = undefined;
    mocks.serverEnv.NODE_ENV = 'production';

    const request = new NextRequest('https://innis.ai/api/cron/test');
    const response = requireCronAuth(request);

    expect(response?.status).toBe(500);
    await expect(response?.json()).resolves.toEqual({
      error: {
        code: 'CRON_SECRET_MISSING',
        message: 'CRON_SECRET is not configured',
      },
    });
  });

  test('liefert 401 bei falschem Bearer Token', async () => {
    mocks.serverEnv.CRON_SECRET = 'top-secret';
    mocks.serverEnv.NODE_ENV = 'production';

    const request = new NextRequest('https://innis.ai/api/cron/test', {
      headers: { authorization: 'Bearer nope' },
    });
    const response = requireCronAuth(request);

    expect(response?.status).toBe(401);
    await expect(response?.json()).resolves.toEqual({
      error: {
        code: 'CRON_UNAUTHORIZED',
        message: 'Invalid cron authorization',
      },
    });
  });

  test('akzeptiert den korrekten Bearer Token', () => {
    mocks.serverEnv.CRON_SECRET = 'top-secret';
    mocks.serverEnv.NODE_ENV = 'production';

    const request = new NextRequest('https://innis.ai/api/cron/test', {
      headers: { authorization: 'Bearer top-secret' },
    });

    expect(requireCronAuth(request)).toBeNull();
  });
});
