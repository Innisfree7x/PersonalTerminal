-- Persistent runtime error events for restart-safe monitoring
-- Date: 2026-03-07

begin;

create table if not exists public.ops_error_events (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null,
  severity text not null check (severity in ('info', 'warning', 'error', 'critical')),
  source text not null check (source in ('client', 'server', 'api')),
  message text not null,
  error_name text,
  stack text,
  context jsonb not null default '{}'::jsonb,
  request_path text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ops_error_events_created_at
  on public.ops_error_events(created_at desc);

create index if not exists idx_ops_error_events_severity_created_at
  on public.ops_error_events(severity, created_at desc);

create index if not exists idx_ops_error_events_fingerprint_created_at
  on public.ops_error_events(fingerprint, created_at desc);

alter table public.ops_error_events enable row level security;
alter table public.ops_error_events force row level security;

drop policy if exists "Admins can read persistent error events" on public.ops_error_events;
create policy "Admins can read persistent error events"
  on public.ops_error_events
  for select
  to authenticated
  using (coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'admin');

commit;
