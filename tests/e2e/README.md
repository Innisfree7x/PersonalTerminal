# E2E Tests (Playwright)

## Covered Flows

- `tests/e2e/university-course.spec.mjs`
  - Login, create a course, complete an exercise.
- `tests/e2e/career-kanban.spec.mjs`
  - Login, create application, drag card from Applied to Interview.
- `tests/e2e/auth-onboarding-settings.spec.mjs`
  - Login with onboarding fallback, land on dashboard.
  - Update display name in settings and verify persistence after reload.

## Requirements

- A valid test user:
  - `E2E_EMAIL`
  - `E2E_PASSWORD`
- Playwright browsers installed:
  - `npx playwright install`

If credentials are missing, authenticated specs are skipped by design.

## Run

- `npm run test:e2e`
- `npm run test:e2e:headed`
- `npm run test:e2e:ui`

## Notes

- The login helper auto-completes onboarding if the account is not onboarded yet.
- Default base URL is `http://127.0.0.1:3000` (from `playwright.config.mjs`).
- Use `PLAYWRIGHT_BASE_URL` to point tests at another environment.
