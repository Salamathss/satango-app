-- SAT vocabulary tracking per user
CREATE TABLE IF NOT EXISTS public.user_vocabulary (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_key text NOT NULL,
  status text NOT NULL DEFAULT 'studying' CHECK (status IN ('studying','mastered')),
  last_reviewed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, word_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_vocabulary TO authenticated;
GRANT ALL ON public.user_vocabulary TO service_role;

ALTER TABLE public.user_vocabulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own vocabulary"
  ON public.user_vocabulary FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own vocabulary"
  ON public.user_vocabulary FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own vocabulary"
  ON public.user_vocabulary FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own vocabulary"
  ON public.user_vocabulary FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_vocabulary_updated_at
  BEFORE UPDATE ON public.user_vocabulary
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_user_vocabulary_user ON public.user_vocabulary(user_id, status);