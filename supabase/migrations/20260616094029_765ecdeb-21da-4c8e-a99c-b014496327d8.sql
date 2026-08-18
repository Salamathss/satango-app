
-- Premium subscription flag
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

-- Daily AI Tutor usage tracking
CREATE TABLE IF NOT EXISTS public.ai_tutor_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_tutor_usage TO authenticated;
GRANT ALL ON public.ai_tutor_usage TO service_role;

ALTER TABLE public.ai_tutor_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own ai tutor usage"
  ON public.ai_tutor_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own ai tutor usage"
  ON public.ai_tutor_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their own ai tutor usage"
  ON public.ai_tutor_usage FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_ai_tutor_usage_updated_at
  BEFORE UPDATE ON public.ai_tutor_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
