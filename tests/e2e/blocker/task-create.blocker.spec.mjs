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

    await page.getByRole('button', { name: /^add$/i }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 15_000 });

    // Wait for the server action to persist the task before reloading
    await page.waitForLoadState('networkidle');

    await page.reload();
    await expect(page.getByText(title)).toBeVisible({ timeout: 15_000 });
  });
});
