import { expect, test } from '@playwright/test';
import { hasE2ECredentials, login } from './helpers/auth.mjs';

test.describe('University flow', () => {
  test.skip(!hasE2ECredentials(), 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated E2E tests.');

  test('user can login, create a course, and complete an exercise', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);
    const courseName = `E2E Course ${suffix}`;

    await login(page);
    await page.goto('/university?action=new-course');

    await expect(page.getByRole('heading', { name: /add new course/i })).toBeVisible();
    await page.locator('#course-name').fill(courseName);
    await page.locator('#course-ects').fill('6');
    await page.locator('#course-num-exercises').fill('3');
    await page.locator('#course-semester').fill('WS 2025/26');
    await page.getByTestId('course-modal-submit').click();

    await expect(page.getByRole('heading', { name: courseName })).toBeVisible({ timeout: 30_000 });

    const card = page.locator('div').filter({ has: page.getByRole('heading', { name: courseName }) }).first();
    await card.getByRole('button', { name: /expand/i }).click();
    await card.getByText('Blatt 1').click();

    await expect(card.getByText(/1\/3/)).toBeVisible({ timeout: 10_000 });
  });
});
