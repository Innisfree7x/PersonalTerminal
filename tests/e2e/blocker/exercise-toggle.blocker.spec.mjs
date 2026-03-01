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
    await expect(page.getByRole('heading', { name: /add new course/i })).toBeVisible({ timeout: 10_000 });

    // Fill form with retry — React re-renders can reset uncontrolled form values
    async function fillAndVerify(selector, value, retries = 3) {
      for (let i = 0; i < retries; i++) {
        await page.locator(selector).fill(value);
        await page.waitForTimeout(300);
        const actual = await page.locator(selector).inputValue();
        if (actual === value) return;
      }
      throw new Error(`Failed to set ${selector} to "${value}"`);
    }

    // Wait for modal animation + initial useEffect reset to settle
    await page.waitForTimeout(1000);

    await fillAndVerify('#course-name', courseName);
    await fillAndVerify('#course-ects', '6');
    await fillAndVerify('#course-num-exercises', '3');
    await fillAndVerify('#course-semester', 'WS 2025/26');

    await page.getByTestId('course-modal-submit').click({ force: true });
    await expect(page.getByRole('heading', { name: courseName })).toBeVisible({ timeout: 30_000 });

    // Poll the API to verify the course was persisted before continuing
    await expect(async () => {
      const resp = await page.request.get('/api/courses');
      const courses = await resp.json();
      const found = courses.some((c) => c.name === courseName);
      expect(found).toBe(true);
    }).toPass({ timeout: 15_000, intervals: [500, 1000, 2000] });

    const card = page
      .locator('[data-interactive="course"]')
      .filter({ has: page.getByRole('heading', { name: courseName }) })
      .first();

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
