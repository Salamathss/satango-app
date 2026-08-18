CREATE TABLE public.user_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);

CREATE INDEX idx_user_errors_user ON public.user_errors(user_id);

GRANT SELECT, INSERT, DELETE ON public.user_errors TO authenticated;
GRANT ALL ON public.user_errors TO service_role;

ALTER TABLE public.user_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own errors"
  ON public.user_errors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own errors"
  ON public.user_errors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own errors"
  ON public.user_errors FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);