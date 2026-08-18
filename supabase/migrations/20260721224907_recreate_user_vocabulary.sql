-- Recreate user_vocabulary with additional fields for vocabulary lab
DROP TABLE IF EXISTS public.user_vocabulary CASCADE;

CREATE TABLE public.user_vocabulary (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_key text NOT NULL,
  word text NOT NULL,
  definition text,
  translation text,
  example text,
  status text NOT NULL DEFAULT 'saved',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, word_key)
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_vocabulary TO authenticated;
GRANT ALL ON public.user_vocabulary TO service_role;

-- Row Level Security
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

-- Trigger for updated_at if function exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE TRIGGER update_user_vocabulary_updated_at
      BEFORE UPDATE ON public.user_vocabulary
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_vocabulary_user ON public.user_vocabulary(user_id, status);
