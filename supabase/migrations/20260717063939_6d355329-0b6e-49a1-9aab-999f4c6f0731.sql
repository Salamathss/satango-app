
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS target_score integer,
  ADD COLUMN IF NOT EXISTS daily_minutes integer,
  ADD COLUMN IF NOT EXISTS diagnostic_score integer,
  ADD COLUMN IF NOT EXISTS initial_level text;
