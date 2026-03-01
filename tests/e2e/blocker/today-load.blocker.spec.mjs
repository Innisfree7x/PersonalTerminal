import { expect, test } from '@playwright/test';
import { hasE2ECredentials, login } from '../helpers/auth.mjs';

const DEFAULT_SLO_MS = 2000;

function getTodayLoadSloMs() {
  const parsed = Number(process.env.E2E_BLOCKER_TODAY_LOAD_SLO_MS || DEFAULT_SLO_MS);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_SLO_MS;
  return Math.round(parsed);
}

test.describe('@blocker today load', () => {
  test.skip(
    !hasE2ECredentials('blocker'),
    'Set E2E_BLOCKER_EMAIL/E2E_BLOCKER_PASSWORD (fallback: E2E_EMAIL/E2E_PASSWORD).'
  );

  test('user can open /today within p95 budget', async ({ page }) => {
    const sloMs = getTodayLoadSloMs();
    await login(page, { mode: 'blocker' });

    const startedAt = Date.now();
    await page.goto('/today', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('today-page-root')).toBeVisible({ timeout: 15_000 });

    const domContentLoadedMs = await page.evaluate(() => {
      const [entry] = performance.getEntriesByType('navigation');
      if (!entry) return null;
      return Math.round(entry.domContentLoadedEventEnd - entry.startTime);
    });

    const measuredMs =
      typeof domContentLoadedMs === 'number' && domContentLoadedMs > 0
        ? domContentLoadedMs
        : Date.now() - startedAt;

    test.info().annotations.push({
      type: 'today_load_ms',
      description: `${measuredMs}`,
    });

    expect(measuredMs).toBeLessThan(sloMs);
  });
});
