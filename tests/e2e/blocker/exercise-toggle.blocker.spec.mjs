import { expect, test } from '@playwright/test';
import { hasE2ECredentials, login, dismissDevOverlay } from '../helpers/auth.mjs';

test.describe('@blocker exercise toggle', () => {
  test.skip(
    !hasE2ECredentials('blocker'),
    'Set E2E_BLOCKER_EMAIL/E2E_BLOCKER_PASSWORD (fallback: E2E_EMAIL/E2E_PASSWORD).'
  );

  test('user can create course, toggle exercise complete, and persist state', async ({ page }) => {
    test.setTimeout(90_000);
    const suffix = Date.now().toString().slice(-6);
    const courseName = `E2E Blocker Course ${suffix}`;

    await login(page, { mode: 'blocker' });
    await page.goto('/university');
    await dismissDevOverlay(page);

    // Wait for initial data loads to finish before interacting
    await page.waitForLoadState('networkidle');

    await page.getByTestId('add-course-button').click({ timeout: 30_000 });
    const dialog = page.getByRole('dialog', { name: /add new course/i });
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Fill form with retry — animation and render passes can occasionally clear input state.
    async function fillAndVerify(locator, value, retries = 3) {
      for (let i = 0; i < retries; i++) {
        await locator.fill(value);
        await page.waitForTimeout(300);
        const actual = await locator.inputValue();
        if (actual === value) return;
      }
      throw new Error(`Failed to set field to "${value}"`);
    }

    // Wait for modal animation + initial useEffect reset to settle
    await page.waitForTimeout(1000);

    await fillAndVerify(dialog.getByLabel(/course name/i), courseName);
    await fillAndVerify(dialog.getByLabel(/ects/i), '6');
    await fillAndVerify(dialog.getByLabel(/number of exercises/i), '3');
    await fillAndVerify(dialog.getByLabel(/semester/i), 'WS 2025/26');

    await dialog.getByTestId('course-modal-submit').click();

    // Poll the API to verify the course was persisted before continuing.
    await expect(async () => {
      const resp = await page.request.get('/api/courses');
      const courses = await resp.json();
      const found = courses.some((c) => c.name === courseName);
      expect(found).toBe(true);
    }).toPass({ timeout: 30_000, intervals: [500, 1000, 2000, 3000] });

    const card = page
      .locator('[data-interactive="course"]')
      .filter({ has: page.getByRole('heading', { name: courseName }) })
      .first();

    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByRole('button', { name: /expand/i }).click();
    await card.getByText('Blatt 1').click();
    await expect(card.getByText(/1\/3/)).toBeVisible({ timeout: 10_000 });

    // Poll exercise completion state via API before reloading
    await expect(async () => {
      const resp = await page.request.get('/api/courses');
      const courses = await resp.json();
      const course = courses.find((c) => c.name === courseName);
      const completed = course?.exercises?.filter((e) => e.completed).length;
      expect(completed).toBe(1);
    }).toPass({ timeout: 15_000, intervals: [500, 1000, 2000] });

    await page.reload();
    const cardAfterReload = page
      .locator('[data-interactive="course"]')
      .filter({ has: page.getByRole('heading', { name: courseName }) })
      .first();
    await cardAfterReload.getByRole('button', { name: /expand/i }).click();
    await expect(cardAfterReload.getByText(/1\/3/)).toBeVisible({ timeout: 10_000 });
  });
});
