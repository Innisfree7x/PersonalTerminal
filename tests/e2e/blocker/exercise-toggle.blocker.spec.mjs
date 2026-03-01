import { expect, test } from '@playwright/test';
import { hasE2ECredentials, login } from '../helpers/auth.mjs';

test.describe('@blocker exercise toggle', () => {
  test.skip(
    !hasE2ECredentials('blocker'),
    'Set E2E_BLOCKER_EMAIL/E2E_BLOCKER_PASSWORD (fallback: E2E_EMAIL/E2E_PASSWORD).'
  );

  test('user can create course, toggle exercise complete, and persist state', async ({ page }) => {
    test.setTimeout(60_000);
    const suffix = Date.now().toString().slice(-6);
    const courseName = `E2E Blocker Course ${suffix}`;

    await login(page, { mode: 'blocker' });
    await page.goto('/university?action=new-course');

    await expect(page.getByRole('heading', { name: /add new course/i })).toBeVisible();
    await page.locator('#course-name').fill(courseName);
    await page.locator('#course-ects').fill('6');
    await page.locator('#course-num-exercises').fill('3');
    await page.locator('#course-semester').fill('WS 2025/26');
    await page.getByTestId('course-modal-submit').click();

    await expect(page.getByRole('heading', { name: courseName })).toBeVisible({ timeout: 30_000 });

    const card = page
      .locator('[data-interactive="course"]')
      .filter({ has: page.getByRole('heading', { name: courseName }) })
      .first();

    await card.getByRole('button', { name: /expand/i }).click();
    await card.getByText('Blatt 1').click();
    await expect(card.getByText(/1\/3/)).toBeVisible({ timeout: 10_000 });

    await page.reload();
    const cardAfterReload = page
      .locator('[data-interactive="course"]')
      .filter({ has: page.getByRole('heading', { name: courseName }) })
      .first();
    await cardAfterReload.getByRole('button', { name: /expand/i }).click();
    await expect(cardAfterReload.getByText(/1\/3/)).toBeVisible({ timeout: 10_000 });
  });
});
