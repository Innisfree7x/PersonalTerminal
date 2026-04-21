-- Crisis Mode: extend trajectory_goals with commitment mode fields.
-- All existing rows default to 'flexible' (current behavior).
-- Date: 2026-04-19

begin;

alter table public.trajectory_goals
  add column if not exists commitment_mode text not null default 'flexible'
    check (commitment_mode in ('fixed', 'flexible', 'lead-time')),
  add column if not exists fixed_start_date date null,
  add column if not exists fixed_end_date date null,
  add column if not exists lead_time_weeks integer null
    check (lead_time_weeks is null or lead_time_weeks between 1 and 104);

alter table public.trajectory_goals
  drop constraint if exists trajectory_goals_mode_fields;

alter table public.trajectory_goals
  add constraint trajectory_goals_mode_fields check (
    (commitment_mode = 'fixed'
      and fixed_start_date is not null
      and fixed_end_date is not null
      and fixed_end_date >= fixed_start_date) or
    (commitment_mode = 'flexible'
      and due_date is not null) or
    (commitment_mode = 'lead-time'
      and due_date is not null
      and lead_time_weeks is not null)
  );

commit;
