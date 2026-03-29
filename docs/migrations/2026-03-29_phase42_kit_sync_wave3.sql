begin;

create table if not exists public.kit_ilias_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_id text not null,
  title text not null,
  semester_label text,
  course_url text,
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kit_ilias_favorites_user_external_unique unique (user_id, external_id)
);

create table if not exists public.kit_ilias_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  favorite_id uuid not null references public.kit_ilias_favorites(id) on delete cascade,
  external_id text not null,
  item_type text not null default 'other' check (item_type in ('announcement', 'document', 'folder', 'link', 'other')),
  title text not null,
  item_url text,
  summary text,
  published_at timestamptz,
  source_updated_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kit_ilias_items_user_external_unique unique (user_id, external_id)
);

create index if not exists idx_kit_ilias_favorites_user on public.kit_ilias_favorites(user_id);
create index if not exists idx_kit_ilias_items_user on public.kit_ilias_items(user_id);
create index if not exists idx_kit_ilias_items_favorite on public.kit_ilias_items(favorite_id);
create index if not exists idx_kit_ilias_items_first_seen on public.kit_ilias_items(user_id, first_seen_at desc);
create index if not exists idx_kit_ilias_items_acknowledged on public.kit_ilias_items(user_id, acknowledged_at);

alter table public.kit_ilias_favorites enable row level security;
alter table public.kit_ilias_items enable row level security;

create or replace function public.set_kit_ilias_favorites_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_kit_ilias_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_kit_ilias_favorites_updated_at on public.kit_ilias_favorites;
create trigger trg_kit_ilias_favorites_updated_at
before update on public.kit_ilias_favorites
for each row
execute function public.set_kit_ilias_favorites_updated_at();

drop trigger if exists trg_kit_ilias_items_updated_at on public.kit_ilias_items;
create trigger trg_kit_ilias_items_updated_at
before update on public.kit_ilias_items
for each row
execute function public.set_kit_ilias_items_updated_at();

drop policy if exists "kit_ilias_favorites_select_own" on public.kit_ilias_favorites;
create policy "kit_ilias_favorites_select_own"
  on public.kit_ilias_favorites
  for select
  using (auth.uid() = user_id);

drop policy if exists "kit_ilias_favorites_insert_own" on public.kit_ilias_favorites;
create policy "kit_ilias_favorites_insert_own"
  on public.kit_ilias_favorites
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "kit_ilias_favorites_update_own" on public.kit_ilias_favorites;
create policy "kit_ilias_favorites_update_own"
  on public.kit_ilias_favorites
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "kit_ilias_favorites_delete_own" on public.kit_ilias_favorites;
create policy "kit_ilias_favorites_delete_own"
  on public.kit_ilias_favorites
  for delete
  using (auth.uid() = user_id);

drop policy if exists "kit_ilias_items_select_own" on public.kit_ilias_items;
create policy "kit_ilias_items_select_own"
  on public.kit_ilias_items
  for select
  using (auth.uid() = user_id);

drop policy if exists "kit_ilias_items_insert_own" on public.kit_ilias_items;
create policy "kit_ilias_items_insert_own"
  on public.kit_ilias_items
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "kit_ilias_items_update_own" on public.kit_ilias_items;
create policy "kit_ilias_items_update_own"
  on public.kit_ilias_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "kit_ilias_items_delete_own" on public.kit_ilias_items;
create policy "kit_ilias_items_delete_own"
  on public.kit_ilias_items
  for delete
  using (auth.uid() = user_id);

commit;
