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
    await expect(page.getByTestId('today-page-root')).toBeVisible();

    const addEmptyStateBtn = page.getByTestId('today-add-task-trigger-empty');
    if (await addEmptyStateBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addEmptyStateBtn.click();
    } else {
      await page.getByTestId('today-add-task-trigger').click();
    }
    await expect(page.getByPlaceholder(/task title/i)).toBeVisible({ timeout: 10_000 });

    const titleInput = page.getByPlaceholder(/task title/i);
    const timeInput = page.getByPlaceholder(/time \(e\.g\./i);
    await titleInput.fill(title);
    await timeInput.fill('15m');

    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/daily-tasks') &&
        response.request().method() === 'POST' &&
        response.status() < 500
    );

    // Prefer keyboard submit to avoid flaky overlay/actionability states on animated buttons.
    await timeInput.press('Enter');
    const createResponse = await createResponsePromise;
    expect(createResponse.ok()).toBeTruthy();

    const dateCandidates = await page.evaluate(() => {
      const now = new Date();
      const formatLocal = (date) =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
          date.getDate()
        ).padStart(2, '0')}`;
      const previous = new Date(now);
      previous.setDate(now.getDate() - 1);
      const next = new Date(now);
      next.setDate(now.getDate() + 1);

      return Array.from(
        new Set([now.toISOString().slice(0, 10), formatLocal(now), formatLocal(previous), formatLocal(next)])
      );
    });

    const hasCreatedTask = async () => {
      for (const date of dateCandidates) {
        const response = await page.request.get(`/api/daily-tasks?date=${date}`);
        if (!response.ok()) continue;
        const tasks = await response.json();
        if (Array.isArray(tasks) && tasks.some((task) => task.title === title)) {
          return true;
        }
      }
      return false;
    };

    await expect.poll(hasCreatedTask, { timeout: 20_000 }).toBe(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect.poll(hasCreatedTask, { timeout: 20_000 }).toBe(true);
  });
});
