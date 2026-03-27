import { expect, test } from '@playwright/test';
import { hasE2ECredentials, login, dismissDevOverlay } from '../helpers/auth.mjs';

async function openAddTaskForm(page) {
  const titleInput = page.getByPlaceholder(/task title/i);

  if (await titleInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    return titleInput;
  }

  const triggerCandidates = [
    page.getByTestId('today-add-task-trigger-empty'),
    page.getByTestId('today-add-task-trigger'),
  ];

  for (let attempt = 0; attempt < 3; attempt += 1) {
    for (const trigger of triggerCandidates) {
      const visible = await trigger.isVisible({ timeout: 1500 }).catch(() => false);
      if (!visible) continue;

      // Bypass occasional actionability races from animated dashboard surfaces.
      await trigger.dispatchEvent('click');
      const opened = await titleInput.isVisible({ timeout: 2500 }).catch(() => false);
      if (opened) return titleInput;
    }
  }

  throw new Error('Failed to open add-task form in blocker flow.');
}

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

    const titleInput = await openAddTaskForm(page);
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
