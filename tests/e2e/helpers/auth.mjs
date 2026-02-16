export function getE2ECredentials() {
  return {
    email: process.env.E2E_EMAIL || '',
    password: process.env.E2E_PASSWORD || '',
  };
}

export function hasE2ECredentials() {
  const { email, password } = getE2ECredentials();
  return Boolean(email && password);
}

export async function login(page) {
  const { email, password } = getE2ECredentials();
  await page.goto('/auth/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/(today|onboarding)$/, { timeout: 30_000 });

  // If this account is not onboarded yet, complete onboarding first.
  if (page.url().endsWith('/onboarding')) {
    const fullNameInput = page.locator('#fullName');
    await fullNameInput.fill('E2E Prism User');
    await page.getByRole('button', { name: /continue to dashboard/i }).click();
    await page.waitForURL('**/today', { timeout: 30_000 });
  }
}
