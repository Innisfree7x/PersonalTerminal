-- Phase 11 Performance Indexes
-- Created: 2026-02-21
-- Purpose: Reduce latency on dashboard-heavy read patterns.

-- Daily Tasks: Today page + completion stats
create index if not exists idx_daily_tasks_user_date
  on public.daily_tasks(user_id, date, completed);

-- Exercise Progress: toggle + course progress fetch
create index if not exists idx_exercise_progress_user_course
  on public.exercise_progress(user_id, course_id, exercise_number);

-- Job Applications: career kanban + interview pipeline
create index if not exists idx_job_applications_user_status
  on public.job_applications(user_id, status, interview_date);

-- Goals: due-date filtering on dashboard widgets
create index if not exists idx_goals_user_target
  on public.goals(user_id, target_date);

-- Focus Sessions: analytics time-window scans
create index if not exists idx_focus_sessions_user_started
  on public.focus_sessions(user_id, started_at desc);
