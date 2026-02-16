import { expect, test } from '@playwright/test';
import { hasE2ECredentials, login } from './helpers/auth.mjs';

test.describe('Career flow', () => {
  test.skip(!hasE2ECredentials(), 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated E2E tests.');

  test('user can create and drag an application from Applied to Interview', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);
    const company = `E2E Corp ${suffix}`;
    const position = `Engineer ${suffix}`;

    await login(page);
    await page.goto('/career?action=new-application');

    await expect(page.getByRole('heading', { name: /new application/i })).toBeVisible();
    await page.locator('#company').fill(company);
    await page.locator('#position').fill(position);
    await page.getByRole('button', { name: /^create$/i }).click();

    await expect(page.getByText(company)).toBeVisible({ timeout: 30_000 });

    const sourceCard = page.locator('[data-testid^="career-card-"]').filter({ hasText: company }).first();
    const targetColumn = page.getByTestId('career-column-interview');

    const sourceBox = await sourceCard.boundingBox();
    const targetBox = await targetColumn.boundingBox();
    if (!sourceBox || !targetBox) {
      throw new Error('Could not resolve drag-and-drop bounding boxes.');
    }

    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 80, { steps: 16 });
    await page.mouse.up();

    await expect(targetColumn.getByText(company)).toBeVisible({ timeout: 30_000 });
  });
});
