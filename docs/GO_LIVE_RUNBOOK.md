# Go-Live Runbook (INNIS)

Last updated: 2026-02-21

Operational playbook for deploying INNIS to production safely.
Use together with `docs/RELEASE_CHECKLIST.md`.

## Fast Path (Solo Daily Use)

1. Confirm latest `main` commit and green CI.
2. Verify production env vars in Vercel.
3. Redeploy latest `main`.
4. Run short smoke test (`/today`, one write action).
5. Accept release if healthy.

---

## 1. Roles (if team release)

- Release Owner: executes deployment + go/no-go call.
- Technical Backup: validates critical steps in parallel.
- Incident Comms Owner: posts status if rollback needed.

## 2. Pre-Deploy (T-30)

### 2.1 Confirm Target

- Branch/commit SHA fixed.
- Required checks green.
- Scope documented.

### 2.2 Local Validation Commands

```bash
npm run type-check
npm run lint
npx vitest run
```

CI blocker suite should also be green:

```bash
npm run test:e2e:blocker
```

### 2.3 Production Config Check

In Vercel (`Production`) verify:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CRON_SECRET`
- `NEXT_PUBLIC_SITE_URL` (recommended)
- Google OAuth vars (if Calendar enabled)

In Supabase verify:

- Latest SQL migrations applied (including phase11 performance indexes)
- RLS policies active for user data tables

## 3. Deploy (T-0)

1. Trigger deploy from approved `main` commit.
2. Wait for Vercel status `Ready`.
3. Stop if build fails (fix first, then redeploy).

## 4. Smoke Test (T+0 to T+10)

### 4.1 Auth + Onboarding

- Open `/`
- Login flow works
- New user onboarding reaches `/today`

### 4.2 Core Product

- Today: create one task
- University: create course + toggle exercise
- Career: create application + move stage
- Settings: profile update + email notifications toggle

### 4.3 Optional Cron Sanity

Call with `Authorization: Bearer <CRON_SECRET>`:

- `GET /api/cron/deadline-reminders`
- `GET /api/cron/weekly-report`

Expect JSON with `ok: true` (or meaningful processed counts).

## 5. Monitoring Window (T+10 to T+30)

Watch:

- 4xx/5xx spikes
- auth loops
- runtime errors
- abnormal latency on dashboard endpoints

If stable for 20 min, release is healthy.

## 6. Rollback Procedure

Trigger rollback for:

- reproducible auth outage
- critical write-path failure
- data safety risk

Steps:

1. Identify last stable SHA.
2. Redeploy previous SHA in Vercel.
3. Run mini smoke (`login`, `/today`, one write flow).
4. Post incident update.

## Incident Update Template

```text
Release Incident: INNIS
Time (UTC):
Impact:
Detected by:
Action taken:
Current status:
Next update ETA:
```

## Release Log Template

- Date/Time (UTC):
- Release SHA:
- Deployed by:
- Smoke test result:
- Monitoring result:
- Rollback needed: yes/no
- Notes:
