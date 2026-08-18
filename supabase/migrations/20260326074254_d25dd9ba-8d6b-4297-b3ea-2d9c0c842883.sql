
ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS streak_freeze_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mock_exam_tickets integer NOT NULL DEFAULT 0;
