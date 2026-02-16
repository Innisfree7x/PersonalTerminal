# Production Runbook: User Isolation Migration

This runbook operationalizes `docs/migrations/2026-02-15_user-isolation.sql` safely in production.

## Scope
- Add `user_id` to tenant-owned tables.
- Backfill historical rows to an owning user.
- Enforce `NOT NULL` + RLS + owner-only policies.

## Preconditions
- Maintenance window scheduled.
- Full database backup/snapshot taken.
- You have the canonical owner user id from `auth.users.id`.

## 1. Preflight Checks
Run in Supabase SQL editor before migration:

```sql
select now() as ts;
select count(*) as goals_null from goals where user_id is null;
select count(*) as applications_null from job_applications where user_id is null;
select count(*) as courses_null from courses where user_id is null;
select count(*) as exercise_null from exercise_progress where user_id is null;
select count(*) as tasks_null from daily_tasks where user_id is null;
select count(*) as focus_null from focus_sessions where user_id is null;
```

## 2. Set Migration Owner
Use a valid `auth.users.id` UUID for existing legacy rows:

```sql
select set_config('app.migration_user_id', '<AUTH_USER_UUID>', false);
```

## 3. Execute Migration
Run the full SQL file:
- `docs/migrations/2026-02-15_user-isolation.sql`

The migration aborts automatically if any `user_id` stays `NULL`.

## 4. Post-Migration Validation
Run immediately after:

```sql
select count(*) as goals_null from goals where user_id is null;
select count(*) as applications_null from job_applications where user_id is null;
select count(*) as courses_null from courses where user_id is null;
select count(*) as exercise_null from exercise_progress where user_id is null;
select count(*) as tasks_null from daily_tasks where user_id is null;
select count(*) as focus_null from focus_sessions where user_id is null;
```

Expected: all counts are `0`.

Validate RLS and policies:

```sql
select tablename, rowsecurity, forcerowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'goals',
    'job_applications',
    'courses',
    'exercise_progress',
    'daily_tasks',
    'focus_sessions'
  )
order by tablename;
```

Expected: `rowsecurity = true`, `forcerowsecurity = true`.

## 5. App Verification
After deploy:
- Login with User A and create/update/delete one row in each module.
- Login with User B and confirm User A rows are not visible/editable.
- Verify dashboard endpoints return only current user data.

## 6. Rollback Plan
- If migration fails before `commit`, transaction auto-rolls back.
- If post-checks fail after successful commit:
  1. Put app in maintenance mode.
  2. Restore from the pre-migration backup/snapshot.
  3. Re-run after fixing invalid owner id or policy conflicts.

## 7. Operational Notes
- Seed script now requires: `SEED_USER_ID=<AUTH_USER_UUID> npm run seed`
- Keep all new API inserts explicitly setting `user_id`.
