import { expect, test } from '@playwright/test';
import { hasE2ECredentials, login } from '../helpers/auth.mjs';

test.describe('@blocker login', () => {
  test.skip(!hasE2ECredentials(), 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated E2E tests.');

  test('user can login and reach /today', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByRole('heading', { name: /today/i })).toBeVisible();
  });
});
