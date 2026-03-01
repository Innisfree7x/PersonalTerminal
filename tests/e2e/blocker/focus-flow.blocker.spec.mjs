import { expect, test } from '@playwright/test';
import { hasE2ECredentials, login } from '../helpers/auth.mjs';

test.describe('@blocker focus flow', () => {
  test.skip(
    !hasE2ECredentials('blocker'),
    'Set E2E_BLOCKER_EMAIL/E2E_BLOCKER_PASSWORD (fallback: E2E_EMAIL/E2E_PASSWORD).'
  );

  test('user can toggle Lucian and start a custom focus session on /focus', async ({ page }) => {
    await login(page, { mode: 'blocker' });
    await page.goto('/focus');
    await expect(page.getByTestId('focus-screen-root')).toBeVisible({ timeout: 15_000 });

    const lucianToggle = page.getByTestId('focus-lucian-toggle');
    await expect(lucianToggle).toBeVisible();

    const toggleLabelBefore = await lucianToggle.innerText();
    await lucianToggle.click();
    await expect(lucianToggle).not.toHaveText(toggleLabelBefore);

    await page.getByTestId('focus-custom-minutes-input').fill('17');
    await page.getByTestId('focus-start-custom-button').click();

    await expect(page.getByRole('button', { name: /stop/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('focus-timer-readout')).toHaveText(/1[67]:[0-5][0-9]/, { timeout: 10_000 });
  });
});
