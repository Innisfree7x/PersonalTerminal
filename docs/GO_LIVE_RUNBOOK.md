# Go-Live Runbook

Operational playbook for deploying Prism to production safely.

Pair this with `docs/RELEASE_CHECKLIST.md`:
- Checklist = what must be true
- Runbook = how to execute on release day

## 1. Roles

- Release Owner: runs deployment and final decision.
- Technical Backup: shadow operator, validates each step.
- Incident Comms Owner: posts status if rollback/incident is needed.

## 2. Pre-Deploy (T-30 min)

## 2.1 Confirm Release Target

- Target branch and commit SHA are final.
- PR merged and CI green.
- Changelog/release notes prepared.

## 2.2 Local Validation Commands

Run on release commit:

```bash
npm run type-check
npm run lint
npm run test -- --run
```

Optional (recommended with credentials):

```bash
E2E_EMAIL="..." E2E_PASSWORD="..." npm run test:e2e
```

## 2.3 Production Config Sanity

In Vercel project settings verify:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_CLIENT_ID` (if Calendar enabled)
- `GOOGLE_CLIENT_SECRET` (if Calendar enabled)
- `GOOGLE_REDIRECT_URI` (if Calendar enabled)

In Supabase verify:

- Required migrations already applied.
- RLS policies enabled and user-scoped.

## 3. Deploy (T-0)

## 3.1 Trigger Deploy

- Deploy from the approved commit SHA.
- Wait for Vercel build to complete.
- Confirm build status is `Ready`.

## 3.2 Hard Stop Criteria

Do **not** continue to smoke tests if:

- Build fails.
- Missing env var errors appear.
- Migration mismatch errors appear.

Fix and redeploy before proceeding.

## 4. Production Smoke Test (T+0 to T+10)

Use one real test account.

## 4.1 Auth + Onboarding

- Open app root `/`.
- If signed out: redirected to `/auth/login`.
- Login.
- If first-time/unonboarded user: redirected to `/onboarding`.
- Complete onboarding.
- Confirm redirect to `/today`.

## 4.2 Core Dashboard

- `/today` loads without runtime errors.
- Header + sidebar render correctly.
- Command palette opens via `Cmd/Ctrl + K`.

## 4.3 Functional Flows

- Goals:
  - Create, edit, delete one goal.
- University:
  - Create one course.
  - Toggle one exercise completion.
- Career:
  - Create application.
  - Move card to another Kanban column.
- Settings:
  - Update display name.
  - Reload page and verify persistence.

## 4.4 Command Bar Actions

From command bar:
- New Goal opens correctly.
- New Course opens correctly.
- New Application opens correctly.
- Theme cycle works.
- Focus presets (25m/50m) start timer.

## 5. Monitoring Window (T+10 to T+30)

Monitor for 20 minutes:

- HTTP error rates (4xx/5xx).
- Auth redirect loops.
- Frontend runtime exceptions.
- Performance regressions (Web Vitals/Speed Insights).

If stable for 20 minutes, mark release as healthy.

## 6. Rollback Procedure

## 6.1 Trigger Conditions

Rollback immediately if:

- Reproducible auth blocking issue.
- Data corruption risk.
- Critical core flows failing for multiple users.

## 6.2 Rollback Steps

1. Identify previous stable commit SHA.
2. Redeploy previous SHA on Vercel.
3. Re-run mini smoke test:
- login
- today
- goals create
- settings save
4. Announce rollback status in team channel.

## 6.3 Incident Note Template

Use this format:

```text
Release Incident: Prism
Time (UTC):
Impact:
Detected by:
Action taken: Rolled back to <SHA>
Current status:
Next update ETA:
```

## 7. Release Log Template

Capture after every go-live:

- Date/Time (UTC):
- Release SHA:
- Deployed by:
- Smoke test result:
- Monitoring result:
- Rollback needed: yes/no
- Notes:
