import { expect, test } from '@playwright/test';
import { hasE2ECredentials, login, dismissDevOverlay } from '../helpers/auth.mjs';

test.describe('@blocker task creation', () => {
  test.skip(
    !hasE2ECredentials('blocker'),
    'Set E2E_BLOCKER_EMAIL/E2E_BLOCKER_PASSWORD (fallback: E2E_EMAIL/E2E_PASSWORD).'
  );

  test('user can create a task on /today and see it after reload', async ({ page }) => {
    test.setTimeout(60_000);
    const title = `E2E Blocker Task ${Date.now().toString().slice(-6)}`;

    await login(page, { mode: 'blocker' });
    await page.goto('/today');
    await dismissDevOverlay(page);
    await expect(page.getByRole('heading', { level: 1, name: /today/i })).toBeVisible();

    const addBtn = page.getByRole('button', { name: /aufgabe hinzufügen/i });
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
    } else {
      await page.getByRole('button', { name: /^add task$/i }).first().click();
    }
    await expect(page.getByPlaceholder(/task title/i)).toBeVisible({ timeout: 10_000 });

    await page.getByPlaceholder(/task title/i).fill(title);
    await page.getByPlaceholder(/time \(e\.g\./i).fill('15m');

    // Create the task via UI and verify it persists via the API
    await page.getByRole('button', { name: /^add$/i }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 15_000 });

    // Poll the API directly to verify the task was persisted to the database
    const today = new Date().toISOString().split('T')[0];
    await expect(async () => {
      const resp = await page.request.get(`/api/daily-tasks?date=${today}`);
      const tasks = await resp.json();
      const found = tasks.some((t) => t.title === title);
      expect(found).toBe(true);
    }).toPass({ timeout: 10_000, intervals: [500, 1000, 2000] });

    await page.reload();
    await expect(page.getByText(title)).toBeVisible({ timeout: 15_000 });
  });
});
