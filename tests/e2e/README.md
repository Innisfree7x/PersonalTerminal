# E2E Tests (Playwright)

## Covered Flows

- `tests/e2e/university-course.spec.mjs`
  - Login, create a course, complete an exercise.
- `tests/e2e/career-kanban.spec.mjs`
  - Login, create application, drag card from Applied to Interview.
- `tests/e2e/auth-onboarding-settings.spec.mjs`
  - Login with onboarding fallback, land on dashboard.
  - Update display name in settings and verify persistence after reload.
- `tests/e2e/onboarding-wizard.spec.mjs`
  - Full onboarding wizard flow (welcome → profile → course → first task → complete) for a fresh test account.

## Requirements

- A valid test user:
  - `E2E_EMAIL`
  - `E2E_PASSWORD`
- Dedicated blocker user (recommended for reliable release gates):
  - `E2E_BLOCKER_EMAIL`
  - `E2E_BLOCKER_PASSWORD`
- Playwright browsers installed:
  - `npx playwright install`

If credentials are missing, authenticated specs are skipped by design.

## Run

- `npm run test:e2e`
- `npm run test:e2e:headed`
- `npm run test:e2e:ui`
- `npm run test:e2e:blocker`
- `npm run test:e2e:blocker:ci` (JSON report + flake gate, default threshold 2%)
- `npm run seed:e2e:blocker` (create/update blocker user and reset E2E-tagged test data)

## Notes

- The login helper auto-completes onboarding if the account is not onboarded yet.
- The onboarding wizard spec skips itself when the configured account is already onboarded.
- Blocker specs prefer `E2E_BLOCKER_*` credentials and fall back to `E2E_*`.
- Default base URL is `http://127.0.0.1:3000` (from `playwright.config.mjs`).
- Use `PLAYWRIGHT_BASE_URL` to point tests at another environment.
- `/today` blocker latency threshold defaults to `2000ms` and can be overridden with `E2E_BLOCKER_TODAY_LOAD_SLO_MS`.
- Flake gate threshold defaults to `2%` and can be overridden with `E2E_BLOCKER_FLAKE_THRESHOLD` (e.g. `0.015`).
