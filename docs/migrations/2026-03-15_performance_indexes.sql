-- Performance indexes for frequently filtered columns
-- These address query patterns found in the DB performance audit (2026-03-15)

-- 1. Courses: exam_date filtering (used in dashboard queries.ts for sorting/filtering by exam date)
CREATE INDEX IF NOT EXISTS idx_courses_user_exam_date
  ON public.courses(user_id, exam_date);

-- 2. Exercise progress: completion + date filtering (dashboard daily loads)
CREATE INDEX IF NOT EXISTS idx_exercise_progress_user_completed_date
  ON public.exercise_progress(user_id, completed, completed_at DESC);

-- 3. Job applications: follow-up queries filter by status + application_date
CREATE INDEX IF NOT EXISTS idx_job_applications_user_status_app_date
  ON public.job_applications(user_id, status, application_date DESC);
