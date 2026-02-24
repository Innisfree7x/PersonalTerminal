# Release Checklist (INNIS)

Last updated: 2026-02-21

Use this checklist before promoting a build to production.
Execution steps live in `docs/GO_LIVE_RUNBOOK.md`.

## Fast Track (Solo)

- [ ] `main` latest commit deployed (no local-only changes).
- [ ] CI on `main` green.
- [ ] `npm run type-check`, `npm run lint`, `npx vitest run` pass.
- [ ] Production deploy status = `Ready`.
- [ ] 5-minute smoke test passed:
  - [ ] login works
  - [ ] `/today` loads
  - [ ] create one task/goal
  - [ ] settings update persists

## 1. Scope Freeze

- [ ] Scope for this release is final (no feature creep).
- [ ] Release notes/summary updated.
- [ ] Target commit SHA documented.

## 2. Quality Gates

- [ ] `npm run type-check` passes.
- [ ] `npm run lint` passes.
- [ ] `npx vitest run` passes.
- [ ] Blocker E2E suite is green in CI (`npm run test:e2e:blocker:ci`, flake < 2%).
- [ ] No failing required checks on the release commit.

## 3. Data Safety + Isolation

- [ ] Required SQL migrations applied in Supabase Production.
- [ ] RLS owner-only policies verified for user tables.
- [ ] Auth guards present on all mutating API routes.

## 4. Production Configuration (Vercel)

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `RESEND_API_KEY`
- [ ] `RESEND_FROM_EMAIL`
- [ ] `CRON_SECRET`
- [ ] `NEXT_PUBLIC_SITE_URL` (recommended)
- [ ] Google OAuth vars set if Calendar integration is used:
  - [ ] `GOOGLE_CLIENT_ID`
  - [ ] `GOOGLE_CLIENT_SECRET`
  - [ ] `GOOGLE_REDIRECT_URI`

## 5. Product Smoke (Core Flows)

- [ ] Auth: `/auth/login` -> `/today`
- [ ] Onboarding flow (new user) reaches dashboard
- [ ] Today: task create/update
- [ ] University: course create + exercise toggle
- [ ] Career: application create + stage move
- [ ] Settings: profile save + email notification toggle

## 6. Cron + Notifications

- [ ] `/api/cron/deadline-reminders` auth works with `CRON_SECRET`.
- [ ] `/api/cron/weekly-report` auth works with `CRON_SECRET`.
- [ ] At least one test email send path verified (Resend).

## 7. Monitoring Window (First 30 min)

- [ ] No 5xx spike.
- [ ] No auth redirect loops.
- [ ] No critical runtime exceptions reported.

## 8. Rollback Readiness

- [ ] Previous stable SHA documented.
- [ ] Rollback redeploy path known.
- [ ] Owner for incident communication assigned.

## Release Metadata (fill each release)

- Release ID:
- Date/Time (UTC):
- Commit SHA:
- Deployed by:
- Included scope:
- Known limitations:
- Rollback SHA:
