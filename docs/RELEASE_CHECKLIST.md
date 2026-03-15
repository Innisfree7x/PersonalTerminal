# Release Checklist (INNIS)

Last updated: 2026-03-05

Use this checklist before promoting a build to production.
Execution steps live in `docs/GO_LIVE_RUNBOOK.md`.

## 0. Repository Guardrails (must exist)

- [ ] Branch protection active on `main` (no direct push; PR merge only).
- [ ] Required status checks configured:
  - [ ] `Quality Checks`
  - [ ] `E2E Blocker Suite (Authenticated, Serial)`
- [ ] `CODEOWNERS` requires Core review for:
  - [ ] `.github/workflows/**`
  - [ ] `app/api/**`
  - [ ] `lib/ops/**`
  - [ ] `docs/RELEASE_CHECKLIST.md`

## Fast Track (Solo)

- [ ] `main` latest commit deployed (no local-only changes).
- [ ] CI on `main` green.
- [ ] `npm run type-check`, `npm run lint`, `npx vitest run`, `npm run build` pass.
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
- [ ] `npm run test:evals` passes.
- [ ] `npm run build` passes (compile/import integrity).
- [ ] Blocker E2E suite is green in CI (`npm run test:e2e:blocker:ci`, flake < 2%).
- [ ] No failing required checks on the release commit.
- [ ] Required checks on `main` are enforced as branch protection contexts:
  - [ ] `Quality Checks`
  - [ ] `E2E Blocker Suite (Authenticated, Serial)`
- [ ] No direct push to `main` (PR-only merge path enforced in branch protection).
- [ ] Merge commit SHA equals deployed commit SHA for the release.

## 2.1 Never-Again Guardrails (added 2026-03-01)

- [ ] CI workflow includes a mandatory production build step (`npm run build`) in `Quality Checks`.
- [ ] CI workflow includes mandatory AI eval step (`npm run test:evals`) in `Quality Checks`.
- [ ] No unresolved imports in changed files (`Module not found` class is release blocker).
- [ ] Before push: verify no critical new files remain untracked (`git status --short`), especially files referenced by new imports.
- [ ] Vercel must be verified on the **latest** commit SHA, not older failed deploy rows.
- [ ] If deploy fails: capture first compile error and map to commit/file before making more UI changes.

## 2.2 Incident Discipline (must follow on red CI/deploy)

- [ ] Incident freeze applied (no unrelated UI/feature commits while pipeline is red).
- [ ] Root cause captured with run id, first failing file, and failing step.
- [ ] Minimal fix commit applied (no bundled refactors).
- [ ] Verification evidence linked (local checks + green CI run id).
- [ ] Incident handoff filled in `docs/AGENT_WORKFLOW.md` template.

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
  - [ ] `GOOGLE_REDIRECT_URI` exakt auch in Supabase Auth > Providers > Google konfiguriert
  - [ ] `GOOGLE_REDIRECT_URI` ist eine App-Callback-URL (`https://<domain>/api/auth/google/callback`) und **keine** Dashboard-URL (z.B. `supabase.com/dashboard/...`)
  - [ ] `GOOGLE_REDIRECT_URI`-Origin passt zur aktiven Deployment-Origin (`NEXT_PUBLIC_SITE_URL` / aktuelle Vercel-URL) oder `GOOGLE_REDIRECT_URI` ist bewusst leer, damit request-origin-basiertes Fallback greift
  - [ ] Callback-URI ohne Doppel-Slash im Pfad (`...app//api/...` ist ungültig); exakter Wert muss `https://<domain>/api/auth/google/callback` sein

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

## 6.1 Authenticated Blocker E2E Gate

- [ ] Blocker E2E secrets vorhanden (GitHub Actions):
  - [ ] `E2E_BLOCKER_EMAIL`
  - [ ] `E2E_BLOCKER_PASSWORD`
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Flake-gate report zeigt `failed=0` (nicht nur niedrige flake rate).

## 7. Monitoring Window (First 30 min)

- [ ] No 5xx spike.
- [ ] No auth redirect loops.
- [ ] No critical runtime exceptions reported.

## 8. Rollback Readiness

- [ ] Previous stable SHA documented.
- [ ] Rollback redeploy path known.
- [ ] Owner for incident communication assigned.

## 9. CI/Deploy Incident Rule

- [ ] Every red CI/deploy run has an incident ticket created immediately from `.github/ISSUE_TEMPLATE/ci-deploy-incident.yml`.
- [ ] Ticket contains all mandatory fields:
  - [ ] Root-Cause Classification (`Build`/`Type`/`Lint`/`Test`/`Env`/`E2E`)
  - [ ] Repro step
  - [ ] First blocking trace (`file:line`)
  - [ ] Root cause (1 sentence)
  - [ ] Fix commit SHA
  - [ ] Prevention (1 sentence)

## Release Metadata (fill each release)

- Release ID:
- Date/Time (UTC):
- Commit SHA:
- Deployed by:
- Included scope:
- Known limitations:
- Rollback SHA:
