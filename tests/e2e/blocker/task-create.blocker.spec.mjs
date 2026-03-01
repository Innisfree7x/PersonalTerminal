import { expect, test } from '@playwright/test';
import { hasE2ECredentials, login } from '../helpers/auth.mjs';

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
    await expect(page.getByRole('heading', { level: 1, name: /today/i })).toBeVisible();

    await page.getByRole('button', { name: /add task/i }).click();
    await expect(page.getByPlaceholder(/task title/i)).toBeVisible();

    await page.getByPlaceholder(/task title/i).fill(title);
    await page.getByPlaceholder(/time \(e\.g\./i).fill('15m');
    await page.getByRole('button', { name: /^add$/i }).click();

    await expect(page.getByText(title)).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await expect(page.getByText(title)).toBeVisible({ timeout: 15_000 });
  });
});
