import { expect, test } from '@playwright/test';
import { hasE2ECredentials, login } from './helpers/auth.mjs';

test.describe('Auth onboarding and settings flow', () => {
  test.skip(!hasE2ECredentials(), 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated E2E tests.');

  test('login flow lands on dashboard (with onboarding auto-complete if needed)', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByRole('heading', { name: /today/i })).toBeVisible();
  });

  test('user can update and persist display name in settings', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);
    const nextDisplayName = `E2E User ${suffix}`;

    await login(page);
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();

    const displayNameInput = page.getByTestId('settings-display-name');
    await displayNameInput.fill(nextDisplayName);
    await page.getByTestId('settings-save-profile').click();

    await expect(page.getByText(/profile updated/i)).toBeVisible({ timeout: 10_000 });
    await page.reload();

    await expect(page.getByTestId('settings-display-name')).toHaveValue(nextDisplayName);
  });
});
