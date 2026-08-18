
-- Add hearts column to user_progress
ALTER TABLE public.user_progress 
  ADD COLUMN IF NOT EXISTS hearts integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS hearts_updated_at timestamp with time zone NOT NULL DEFAULT now();
