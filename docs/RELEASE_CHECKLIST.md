# Release Checklist

Use this checklist before promoting a build to production.
Execution steps live in `docs/GO_LIVE_RUNBOOK.md`.

## 1. Scope Freeze

- [ ] PR scope is final (no feature creep).
- [ ] Roadmap items included in this release are listed in release notes.
- [ ] Branch is up to date with target base branch.

## 2. Code Quality Gates

- [ ] `npm run type-check` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run test -- --run` passes.
- [ ] `npm run test:e2e` passes in an environment with `E2E_EMAIL` and `E2E_PASSWORD`.
- [ ] No failing CI checks on the release commit.

## 3. Auth + Onboarding

- [ ] Unauthenticated user is redirected to `/auth/login`.
- [ ] New/legacy user without onboarding is redirected to `/onboarding`.
- [ ] Onboarding completion redirects user to `/today`.
- [ ] Auth callback sends users to `/onboarding` or `/today` correctly.
- [ ] Settings display name save works and persists after reload.

## 4. Data Safety + Isolation

- [ ] Supabase migrations applied in production.
- [ ] RLS policies verified for all user data tables.
- [ ] No deprecated bare Supabase client usage in API routes (`lib/supabase/client.ts`).
- [ ] Server Actions that mutate data require auth and use user-scoped operations.

## 5. Configuration + Secrets

- [ ] Production env vars are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_CLIENT_ID` (if Calendar enabled)
- `GOOGLE_CLIENT_SECRET` (if Calendar enabled)
- `GOOGLE_REDIRECT_URI` (if Calendar enabled)
- [ ] Redirect URI matches production domain exactly.
- [ ] No secrets in repo or client-side logs.

## 6. UX/Performance Checks

- [ ] No white overscroll flashes or layout artifacts in production theme.
- [ ] Command Bar (`Cmd/Ctrl + K`) actions work:
- new goal
- new course
- new application
- theme cycle
- focus presets
- [ ] University card-to-modal layout transition behaves smoothly.
- [ ] Dashboard pages load without runtime errors.
- [ ] Vercel Analytics/Speed Insights events are being received.

## 7. API + Integrations

- [ ] Google Calendar connect/disconnect flow works in production.
- [ ] Calendar pages handle unauthorized state gracefully.
- [ ] CV upload and extraction endpoint works with expected payload limits.
- [ ] Error states return user-safe messages (no internal stack traces).

## 8. Deployment

- [ ] Release commit tagged (optional but recommended).
- [ ] Deploy from clean commit SHA.
- [ ] Vercel deployment succeeds (`npm run build` equivalent passes).
- [ ] Smoke test on live URL completed:
- login
- onboarding
- today
- goals create/edit/delete
- university create/toggle exercise
- career create/kanban move
- settings save profile

## 9. Post-Deploy Verification (First 30 Minutes)

- [ ] No spike in 4xx/5xx responses.
- [ ] No authentication loop reports.
- [ ] No major frontend runtime errors in browser console.
- [ ] Core actions remain responsive.

## 10. Rollback Plan

- [ ] Previous stable commit SHA documented.
- [ ] Rollback procedure tested by team:
- redeploy previous SHA
- verify auth and dashboard access
- [ ] Incident owner and communication channel assigned.

## Release Metadata Template

Fill this out for each release:

- Release ID:
- Date/Time (UTC):
- Commit SHA:
- Deployed by:
- Included features:
- Known limitations:
- Rollback SHA:
