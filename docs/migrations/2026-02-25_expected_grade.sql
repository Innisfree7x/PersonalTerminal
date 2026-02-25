-- Migration: Add expected_grade to courses
-- Date: 2026-02-25
-- Purpose: Allow users to record their expected exam grade after the exam date has passed.
--          The "exam written" state is derived from exam_date < now() — no boolean column needed.

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS expected_grade real;

-- Constraint: German grade scale 1.0–5.0
ALTER TABLE courses
  ADD CONSTRAINT courses_expected_grade_range
  CHECK (expected_grade IS NULL OR (expected_grade >= 1.0 AND expected_grade <= 5.0));

COMMENT ON COLUMN courses.expected_grade IS
  'User-entered expected grade (1.0–5.0, German scale). NULL = not yet entered. Only meaningful after exam_date has passed.';
