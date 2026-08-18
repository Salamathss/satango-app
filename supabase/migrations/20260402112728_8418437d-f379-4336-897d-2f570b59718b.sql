
-- Add module field to questions
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS module integer NOT NULL DEFAULT 1;

-- Create module_progress table for tracking unit completion and jump test state
CREATE TABLE public.module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module integer NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  is_unlocked boolean NOT NULL DEFAULT false,
  jump_test_failed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, module)
);

ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own module progress" ON public.module_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own module progress" ON public.module_progress
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own module progress" ON public.module_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Update existing questions with module assignments based on topic and difficulty
-- Module 1 (Foundation): Linear Equations, Central Ideas - difficulty 1
UPDATE public.questions SET module = 1 WHERE topic IN ('linear-equations', 'central-ideas') AND difficulty = 1;
-- Module 2 (Foundation): Standard Conventions, Percentages - difficulty 1
UPDATE public.questions SET module = 2 WHERE topic IN ('standard-conventions', 'percentages') AND difficulty = 1;
-- Module 3 (Foundation): Words in Context, Ratios & Rates - difficulty 1
UPDATE public.questions SET module = 3 WHERE topic IN ('words-in-context', 'ratios-rates') AND difficulty = 1;
-- Module 4 (Intermediate): Systems of Equations, Text Structure - difficulty 2
UPDATE public.questions SET module = 4 WHERE topic IN ('systems-of-equations', 'text-structure') AND difficulty = 2;
-- Module 5 (Intermediate): Statistics, Expression of Ideas - difficulty 2
UPDATE public.questions SET module = 5 WHERE topic IN ('statistics', 'expression-of-ideas') AND difficulty = 2;
-- Module 6 (Intermediate): Quadratics, Rhetorical Synthesis - difficulty 2
UPDATE public.questions SET module = 6 WHERE topic IN ('quadratics', 'rhetorical-synthesis') AND difficulty = 2;
-- Module 7 (Advanced): Advanced Math, Command of Evidence - difficulty 3
UPDATE public.questions SET module = 7 WHERE topic IN ('advanced-math', 'command-of-evidence') AND difficulty = 3;
-- Module 8 (Advanced): Geometry, Standard Conventions advanced - difficulty 3
UPDATE public.questions SET module = 8 WHERE topic IN ('geometry', 'standard-conventions') AND difficulty = 3;
-- Module 9 (Advanced): All remaining difficulty 3 questions
UPDATE public.questions SET module = 9 WHERE difficulty = 3 AND module = 1;

-- Assign remaining difficulty 1 questions to modules 1-3
UPDATE public.questions SET module = 1 WHERE difficulty = 1 AND module = 1 AND topic NOT IN ('linear-equations', 'central-ideas');
-- Reassign: spread remaining d1 to early modules  
UPDATE public.questions SET module = 2 WHERE topic IN ('geometry', 'statistics') AND difficulty = 1;
UPDATE public.questions SET module = 3 WHERE topic IN ('quadratics', 'systems-of-equations', 'advanced-math') AND difficulty = 1;

-- Assign remaining difficulty 2 questions to modules 4-6
UPDATE public.questions SET module = 4 WHERE topic IN ('linear-equations', 'ratios-rates', 'percentages') AND difficulty = 2;
UPDATE public.questions SET module = 5 WHERE topic IN ('words-in-context', 'central-ideas', 'command-of-evidence') AND difficulty = 2;
UPDATE public.questions SET module = 6 WHERE topic IN ('geometry', 'advanced-math') AND difficulty = 2;

-- Trigger for updated_at
CREATE TRIGGER update_module_progress_updated_at
  BEFORE UPDATE ON public.module_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
