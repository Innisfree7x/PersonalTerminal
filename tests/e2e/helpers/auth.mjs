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

async function submitLogin(page, email, password) {
  await page.goto('/auth/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /anmelden/i }).click();
  await page.waitForURL(/\/(today|onboarding)$/, { timeout: 30_000 });
}

export async function completeOnboardingWizard(page) {
  if (!page.url().endsWith('/onboarding')) return;

  // Step 1: Welcome
  const startButton = page.getByRole('button', { name: /loslegen/i });
  if (await startButton.isVisible().catch(() => false)) {
    await startButton.click();
  }

  // Step 2: Profile
  const displayNameInput = page.getByLabel(/anzeigename/i);
  if (await displayNameInput.isVisible().catch(() => false)) {
    await displayNameInput.fill(`E2E INNIS User ${Date.now().toString().slice(-6)}`);
    await page.getByRole('button', { name: /^weiter$/i }).click();
  }

  // Step 3: Courses
  const courseNameInput = page.getByLabel(/kursname/i);
  if (await courseNameInput.isVisible().catch(() => false)) {
    await courseNameInput.fill(`E2E Wizard Course ${Date.now().toString().slice(-5)}`);
    await page.getByRole('button', { name: /kurs.*anlegen.*weiter/i }).click();
  } else {
    const continueCourses = page.getByRole('button', { name: /^weiter$/i });
    if (await continueCourses.isVisible().catch(() => false)) {
      await continueCourses.click();
    }
  }

  // Step 4: First task
  const taskInput = page.getByLabel(/^aufgabe$/i);
  if (await taskInput.isVisible().catch(() => false)) {
    await taskInput.fill(`E2E Wizard Task ${Date.now().toString().slice(-4)}`);
    await page.getByRole('button', { name: /aufgabe.*anlegen.*weiter/i }).click();
  } else {
    const continueTask = page.getByRole('button', { name: /^weiter$/i });
    if (await continueTask.isVisible().catch(() => false)) {
      await continueTask.click();
    }
  }

  // Step 5: Complete
  const finishButton = page.getByRole('button', { name: /zum dashboard/i });
  await finishButton.click();
  await page.waitForURL('**/today', { timeout: 30_000 });
}

export async function login(page) {
  const { email, password } = getE2ECredentials();
  await submitLogin(page, email, password);

  if (page.url().endsWith('/onboarding')) {
    await completeOnboardingWizard(page);
  }
}

export async function loginWithoutOnboarding(page) {
  const { email, password } = getE2ECredentials();
  await submitLogin(page, email, password);
}
