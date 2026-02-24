-- Track 6: Persistent flow metrics for SLO + error-budget tracking
-- Date: 2026-02-24

begin;

create table if not exists public.ops_flow_metrics (
  id uuid primary key default gen_random_uuid(),
  flow text not null check (flow in ('login', 'create_task', 'toggle_exercise', 'today_load')),
  status text not null check (status in ('success', 'failure')),
  duration_ms integer not null check (duration_ms >= 0 and duration_ms <= 120000),
  route text,
  request_id text,
  user_id uuid references auth.users(id) on delete set null,
  error_code text,
  context jsonb not null default '{}'::jsonb,
  measured_at timestamptz not null default now()
);

create index if not exists idx_ops_flow_metrics_flow_measured_at
  on public.ops_flow_metrics(flow, measured_at desc);

create index if not exists idx_ops_flow_metrics_status_measured_at
  on public.ops_flow_metrics(flow, status, measured_at desc);

create index if not exists idx_ops_flow_metrics_user_measured_at
  on public.ops_flow_metrics(user_id, measured_at desc);

alter table public.ops_flow_metrics enable row level security;
alter table public.ops_flow_metrics force row level security;

drop policy if exists "Authenticated users can insert own flow metrics" on public.ops_flow_metrics;
drop policy if exists "Anon can insert login flow metrics" on public.ops_flow_metrics;
drop policy if exists "Admins can read flow metrics" on public.ops_flow_metrics;

create policy "Authenticated users can insert own flow metrics"
  on public.ops_flow_metrics
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    or (flow = 'login' and user_id is null)
  );

create policy "Anon can insert login flow metrics"
  on public.ops_flow_metrics
  for insert
  to anon
  with check (
    flow = 'login'
    and user_id is null
    and route = '/auth/login'
  );

create policy "Admins can read flow metrics"
  on public.ops_flow_metrics
  for select
  to authenticated
  using (coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'admin');

commit;
