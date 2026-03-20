import { expect, test } from '@playwright/test';
import { hasE2ECredentials, login } from './helpers/auth.mjs';

test.describe('University flow', () => {
  test.skip(!hasE2ECredentials(), 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated E2E tests.');

  test('user can login, create a course, and complete an exercise', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);
    const courseName = `E2E Course ${suffix}`;

    await login(page);
    await page.goto('/university?action=new-course');

    await expect(page.getByRole('dialog', { name: /add new course|neuen kurs hinzufügen/i })).toBeVisible();
    await page.locator('#course-name').fill(courseName);
    await page.locator('#course-ects').fill('6');
    await page.locator('#course-num-exercises').fill('3');
    await page.locator('#course-semester').fill('WS 2025/26');
    await page.getByTestId('course-modal-submit').click();

    await expect(page.getByRole('heading', { name: courseName })).toBeVisible({ timeout: 30_000 });

    const card = page.locator('[data-interactive="course"]').filter({ has: page.getByRole('heading', { name: courseName }) }).first();
    await card.getByTestId('course-expand-button').click();
    await card.getByTestId('course-exercise-1').click();

    await expect(card.getByText(/1\/3/)).toBeVisible({ timeout: 10_000 });

    await page.reload();
    const cardAfterReload = page
      .locator('[data-interactive="course"]')
      .filter({ has: page.getByRole('heading', { name: courseName }) })
      .first();
    await cardAfterReload.getByTestId('course-expand-button').click();
    await expect(cardAfterReload.getByText(/1\/3/)).toBeVisible({ timeout: 10_000 });

    await cardAfterReload.getByTestId('course-exercise-1').click();
    await expect(cardAfterReload.getByText(/0\/3/)).toBeVisible({ timeout: 10_000 });

    await page.reload();
    const cardAfterUntoggle = page
      .locator('[data-interactive="course"]')
      .filter({ has: page.getByRole('heading', { name: courseName }) })
      .first();
    await cardAfterUntoggle.getByTestId('course-expand-button').click();
    await expect(cardAfterUntoggle.getByText(/0\/3/)).toBeVisible({ timeout: 10_000 });
  });
});
