-- Admin audit logs for operational actions
-- Date: 2026-02-16

begin;

create table if not exists admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  resource text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_logs_actor_user_id on admin_audit_logs(actor_user_id);
create index if not exists idx_admin_audit_logs_created_at on admin_audit_logs(created_at desc);

alter table admin_audit_logs enable row level security;
alter table admin_audit_logs force row level security;

drop policy if exists "Admins can insert audit logs" on admin_audit_logs;
drop policy if exists "Admins can read audit logs" on admin_audit_logs;

create policy "Admins can insert audit logs"
  on admin_audit_logs
  for insert
  with check (
    auth.uid() = actor_user_id
    and coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'admin'
  );

create policy "Admins can read audit logs"
  on admin_audit_logs
  for select
  using (
    coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'admin'
  );

commit;
