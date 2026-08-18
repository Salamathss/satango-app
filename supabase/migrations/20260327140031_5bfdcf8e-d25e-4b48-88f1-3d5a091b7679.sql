
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nickname text DEFAULT '',
  ADD COLUMN IF NOT EXISTS sat_goal text DEFAULT '',
  ADD COLUMN IF NOT EXISTS current_level text DEFAULT '',
  ADD COLUMN IF NOT EXISTS intensity text DEFAULT '',
  ADD COLUMN IF NOT EXISTS daily_xp_target integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
