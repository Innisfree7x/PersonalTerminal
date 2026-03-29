begin;

create table if not exists public.kit_sync_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  campus_webcal_url_encrypted text,
  campus_webcal_url_masked text,
  campus_webcal_calendar_name text,
  campus_webcal_last_validated_at timestamptz,
  campus_webcal_last_synced_at timestamptz,
  campus_webcal_last_error text,
  campus_webcal_last_feed_fingerprint text,
  connector_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kit_sync_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('campus_webcal', 'campus_connector', 'ilias_connector')),
  trigger text not null check (trigger in ('manual', 'cron', 'connector')),
  status text not null check (status in ('running', 'success', 'partial', 'failed')),
  items_read integer not null default 0,
  items_written integer not null default 0,
  error_code text,
  error_message text,
  connector_version text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.kit_campus_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.kit_sync_profiles(id) on delete cascade,
  external_id text not null,
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  kind text not null check (kind in ('lecture', 'exercise', 'exam', 'deadline', 'other')) default 'other',
  source_updated_at timestamptz,
  content_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kit_campus_events_user_external_unique unique (user_id, external_id)
);

create index if not exists idx_kit_sync_runs_user_started on public.kit_sync_runs(user_id, started_at desc);
create index if not exists idx_kit_campus_events_user_starts on public.kit_campus_events(user_id, starts_at asc);
create index if not exists idx_kit_campus_events_profile on public.kit_campus_events(profile_id);

alter table public.kit_sync_profiles enable row level security;
alter table public.kit_sync_runs enable row level security;
alter table public.kit_campus_events enable row level security;

create or replace function public.set_kit_sync_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_kit_campus_events_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_kit_sync_profiles_updated_at on public.kit_sync_profiles;
create trigger trg_kit_sync_profiles_updated_at
before update on public.kit_sync_profiles
for each row
execute function public.set_kit_sync_profiles_updated_at();

drop trigger if exists trg_kit_campus_events_updated_at on public.kit_campus_events;
create trigger trg_kit_campus_events_updated_at
before update on public.kit_campus_events
for each row
execute function public.set_kit_campus_events_updated_at();

drop policy if exists "kit_sync_profiles_select_own" on public.kit_sync_profiles;
create policy "kit_sync_profiles_select_own"
  on public.kit_sync_profiles
  for select
  using (auth.uid() = user_id);

drop policy if exists "kit_sync_profiles_insert_own" on public.kit_sync_profiles;
create policy "kit_sync_profiles_insert_own"
  on public.kit_sync_profiles
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "kit_sync_profiles_update_own" on public.kit_sync_profiles;
create policy "kit_sync_profiles_update_own"
  on public.kit_sync_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "kit_sync_profiles_delete_own" on public.kit_sync_profiles;
create policy "kit_sync_profiles_delete_own"
  on public.kit_sync_profiles
  for delete
  using (auth.uid() = user_id);

drop policy if exists "kit_sync_runs_select_own" on public.kit_sync_runs;
create policy "kit_sync_runs_select_own"
  on public.kit_sync_runs
  for select
  using (auth.uid() = user_id);

drop policy if exists "kit_sync_runs_insert_own" on public.kit_sync_runs;
create policy "kit_sync_runs_insert_own"
  on public.kit_sync_runs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "kit_campus_events_select_own" on public.kit_campus_events;
create policy "kit_campus_events_select_own"
  on public.kit_campus_events
  for select
  using (auth.uid() = user_id);

drop policy if exists "kit_campus_events_insert_own" on public.kit_campus_events;
create policy "kit_campus_events_insert_own"
  on public.kit_campus_events
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "kit_campus_events_update_own" on public.kit_campus_events;
create policy "kit_campus_events_update_own"
  on public.kit_campus_events
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "kit_campus_events_delete_own" on public.kit_campus_events;
create policy "kit_campus_events_delete_own"
  on public.kit_campus_events
  for delete
  using (auth.uid() = user_id);

commit;
