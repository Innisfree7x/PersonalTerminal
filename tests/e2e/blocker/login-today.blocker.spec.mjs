import { expect, test } from '@playwright/test';
import { hasE2ECredentials, login } from '../helpers/auth.mjs';

test.describe('@blocker login', () => {
  test.skip(
    !hasE2ECredentials('blocker'),
    'Set E2E_BLOCKER_EMAIL/E2E_BLOCKER_PASSWORD (fallback: E2E_EMAIL/E2E_PASSWORD).'
  );

  test('user can login and reach /today', async ({ page }) => {
    await login(page, { mode: 'blocker' });
    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByTestId('today-page-root')).toBeVisible();
  });
});
