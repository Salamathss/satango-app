
CREATE TABLE public.level_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  unit_id INTEGER NOT NULL,
  level_id INTEGER NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  score_correct INTEGER NOT NULL DEFAULT 0,
  score_total INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  gems_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, unit_id, level_id)
);

ALTER TABLE public.level_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own level progress"
  ON public.level_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own level progress"
  ON public.level_progress FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own level progress"
  ON public.level_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
