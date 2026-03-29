begin;

alter table public.kit_campus_events
  add column if not exists source text;

update public.kit_campus_events
set source = 'campus_webcal'
where source is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'kit_campus_events_source_check'
  ) then
    alter table public.kit_campus_events
      add constraint kit_campus_events_source_check
      check (source in ('campus_webcal', 'campus_connector'));
  end if;
end
$$;

alter table public.kit_campus_events
  alter column source set not null;

create table if not exists public.kit_campus_modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_id text not null,
  module_code text,
  title text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'dropped', 'planned', 'unknown')),
  semester_label text,
  credits numeric(4,1),
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kit_campus_modules_user_external_unique unique (user_id, external_id)
);

create table if not exists public.kit_campus_grades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.kit_campus_modules(id) on delete cascade,
  external_grade_id text not null,
  grade_value numeric(4,2),
  grade_label text not null,
  exam_date date,
  published_at timestamptz,
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kit_campus_grades_user_external_unique unique (user_id, external_grade_id)
);

create index if not exists idx_kit_campus_modules_user on public.kit_campus_modules(user_id);
create index if not exists idx_kit_campus_modules_status on public.kit_campus_modules(user_id, status);
create index if not exists idx_kit_campus_grades_user_published on public.kit_campus_grades(user_id, published_at desc);
create index if not exists idx_kit_campus_grades_module on public.kit_campus_grades(module_id);

alter table public.kit_campus_modules enable row level security;
alter table public.kit_campus_grades enable row level security;

create or replace function public.set_kit_campus_modules_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_kit_campus_grades_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_kit_campus_modules_updated_at on public.kit_campus_modules;
create trigger trg_kit_campus_modules_updated_at
before update on public.kit_campus_modules
for each row
execute function public.set_kit_campus_modules_updated_at();

drop trigger if exists trg_kit_campus_grades_updated_at on public.kit_campus_grades;
create trigger trg_kit_campus_grades_updated_at
before update on public.kit_campus_grades
for each row
execute function public.set_kit_campus_grades_updated_at();

drop policy if exists "kit_campus_modules_select_own" on public.kit_campus_modules;
create policy "kit_campus_modules_select_own"
  on public.kit_campus_modules
  for select
  using (auth.uid() = user_id);

drop policy if exists "kit_campus_modules_insert_own" on public.kit_campus_modules;
create policy "kit_campus_modules_insert_own"
  on public.kit_campus_modules
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "kit_campus_modules_update_own" on public.kit_campus_modules;
create policy "kit_campus_modules_update_own"
  on public.kit_campus_modules
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "kit_campus_modules_delete_own" on public.kit_campus_modules;
create policy "kit_campus_modules_delete_own"
  on public.kit_campus_modules
  for delete
  using (auth.uid() = user_id);

drop policy if exists "kit_campus_grades_select_own" on public.kit_campus_grades;
create policy "kit_campus_grades_select_own"
  on public.kit_campus_grades
  for select
  using (auth.uid() = user_id);

drop policy if exists "kit_campus_grades_insert_own" on public.kit_campus_grades;
create policy "kit_campus_grades_insert_own"
  on public.kit_campus_grades
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "kit_campus_grades_update_own" on public.kit_campus_grades;
create policy "kit_campus_grades_update_own"
  on public.kit_campus_grades
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "kit_campus_grades_delete_own" on public.kit_campus_grades;
create policy "kit_campus_grades_delete_own"
  on public.kit_campus_grades
  for delete
  using (auth.uid() = user_id);

commit;
