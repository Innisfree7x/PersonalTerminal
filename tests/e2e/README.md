# E2E Tests (Playwright)

## Requirements

- `E2E_EMAIL` and `E2E_PASSWORD` for a valid Prism user.
- Playwright installed locally:
  - `npm i -D @playwright/test`
  - `npx playwright install`

## Run

- `npm run test:e2e`
- `npm run test:e2e:headed`
- `npm run test:e2e:ui`

If credentials are missing, authenticated specs are skipped by design.
