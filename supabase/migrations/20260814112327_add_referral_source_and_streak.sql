-- Add referral_source and streak_days columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_source TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_days INTEGER NOT NULL DEFAULT 0;

-- Trigger function to keep profiles.streak_days in sync with user_progress.streak
CREATE OR REPLACE FUNCTION public.sync_profile_streak_days()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET streak_days = COALESCE(NEW.streak, 0)
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER tr_sync_profile_streak_days
AFTER INSERT OR UPDATE OF streak ON public.user_progress
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_streak_days();
