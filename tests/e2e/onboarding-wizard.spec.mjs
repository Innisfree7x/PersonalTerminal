import { expect, test } from '@playwright/test';
import { hasE2ECredentials, loginWithoutOnboarding } from './helpers/auth.mjs';

test.describe('Onboarding wizard flow', () => {
  test.skip(!hasE2ECredentials(), 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated E2E tests.');

  test('user can complete the full onboarding wizard and land on dashboard', async ({ page }) => {
    await loginWithoutOnboarding(page);

    test.skip(!page.url().endsWith('/onboarding'), 'E2E account is already onboarded. Use a fresh account for this test.');

    await expect(page.getByRole('button', { name: /loslegen/i })).toBeVisible();
    await page.getByRole('button', { name: /loslegen/i }).click();

    await expect(page.getByLabel(/anzeigename/i)).toBeVisible();
    await page.getByLabel(/anzeigename/i).fill(`E2E Wizard ${Date.now().toString().slice(-5)}`);
    await page.getByRole('button', { name: /^weiter$/i }).click();

    await expect(page.getByLabel(/kursname/i)).toBeVisible();
    await page.getByLabel(/kursname/i).fill(`E2E Wizard Course ${Date.now().toString().slice(-4)}`);
    await page.getByRole('button', { name: /kurs.*anlegen.*weiter/i }).click();

    await expect(page.getByLabel(/^aufgabe$/i)).toBeVisible();
    await page.getByLabel(/^aufgabe$/i).fill(`E2E Wizard Task ${Date.now().toString().slice(-4)}`);
    await page.getByRole('button', { name: /aufgabe.*anlegen.*weiter/i }).click();

    await expect(page.getByText(/Lucian ist jetzt aktiv/i)).toBeVisible();
    await page.getByRole('button', { name: /zum dashboard/i }).click();

    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByRole('heading', { name: /today/i })).toBeVisible();
  });
});
