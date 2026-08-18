
ALTER TABLE public.user_progress
ADD COLUMN IF NOT EXISTS daily_check_in_streak integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_check_in_date date DEFAULT NULL;
