-- ============================================================
-- SATANGO — Full Database Schema
-- Generated: 2026-07-30 12:32 UTC
-- All migrations concatenated in chronological order
-- ============================================================

-- --------------------------------------------------------
-- Migration: 20260320152822_f0e9c78d-70da-4e42-a522-bc064d3ece1f.sql
-- --------------------------------------------------------

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User progress table
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  gems INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Progress viewable by everyone" ON public.user_progress FOR SELECT USING (true);
CREATE POLICY "Users can insert own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create progress on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_progress()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_progress (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_progress
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_progress();

-- Questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('math', 'reading_writing')),
  topic TEXT NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL CHECK (correct_answer BETWEEN 0 AND 3),
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questions viewable by authenticated" ON public.questions FOR SELECT TO authenticated USING (true);

-- User answers table
CREATE TABLE public.user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('casual', 'focus')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own answers" ON public.user_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own answers" ON public.user_answers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Topic progress table
CREATE TABLE public.topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  category TEXT NOT NULL,
  completed_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  is_unlocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic)
);

ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own topic progress" ON public.topic_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own topic progress" ON public.topic_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own topic progress" ON public.topic_progress FOR UPDATE USING (auth.uid() = user_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON public.user_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_topic_progress_updated_at BEFORE UPDATE ON public.topic_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- --------------------------------------------------------
-- Migration: 20260323075806_0219bba3-781a-4196-b4a2-21dde4067215.sql
-- --------------------------------------------------------
ALTER TABLE public.topic_progress ADD COLUMN IF NOT EXISTS current_difficulty text NOT NULL DEFAULT 'medium';

-- --------------------------------------------------------
-- Migration: 20260323080456_2e8e4a48-c042-4258-ab88-909b13109288.sql
-- --------------------------------------------------------
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0;
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS difficulty_anchor integer NOT NULL DEFAULT 1;

-- --------------------------------------------------------
-- Migration: 20260325101912_1174afcb-3142-46c6-8ad3-a61692c9648b.sql
-- --------------------------------------------------------

-- Add hearts column to user_progress
ALTER TABLE public.user_progress 
  ADD COLUMN IF NOT EXISTS hearts integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS hearts_updated_at timestamp with time zone NOT NULL DEFAULT now();


-- --------------------------------------------------------
-- Migration: 20260326074254_d25dd9ba-8d6b-4297-b3ea-2d9c0c842883.sql
-- --------------------------------------------------------

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS streak_freeze_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mock_exam_tickets integer NOT NULL DEFAULT 0;


-- --------------------------------------------------------
-- Migration: 20260327140031_5bfdcf8e-d25e-4b48-88f1-3d5a091b7679.sql
-- --------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nickname text DEFAULT '',
  ADD COLUMN IF NOT EXISTS sat_goal text DEFAULT '',
  ADD COLUMN IF NOT EXISTS current_level text DEFAULT '',
  ADD COLUMN IF NOT EXISTS intensity text DEFAULT '',
  ADD COLUMN IF NOT EXISTS daily_xp_target integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;


-- --------------------------------------------------------
-- Migration: 20260401154210_fd3158bd-109b-4961-86d5-d077b72f136d.sql
-- --------------------------------------------------------
ALTER TABLE public.user_progress 
  ADD COLUMN IF NOT EXISTS full_exam_tickets integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS section_exam_tickets integer NOT NULL DEFAULT 0;

-- --------------------------------------------------------
-- Migration: 20260402112728_8418437d-f379-4336-897d-2f570b59718b.sql
-- --------------------------------------------------------

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


-- --------------------------------------------------------
-- Migration: 20260404170021_87824b15-8392-4a07-8ca1-4027cf1d3cb1.sql
-- --------------------------------------------------------

ALTER TABLE public.user_progress
ADD COLUMN IF NOT EXISTS daily_check_in_streak integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_check_in_date date DEFAULT NULL;


-- --------------------------------------------------------
-- Migration: 20260405063309_700a3e4b-2826-4a0d-b859-0183710bbe36.sql
-- --------------------------------------------------------

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


-- --------------------------------------------------------
-- Migration: 20260601103132_b7be4ef8-050a-42ad-a023-fd86bbd331b9.sql
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- Migration: 20260603181422_11820bab-6085-46f3-8cf8-6d2c6c67563b.sql
-- --------------------------------------------------------

-- Tighten profiles SELECT: only authenticated users (no anon)
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);

-- Tighten user_progress SELECT: only authenticated users (no anon)
DROP POLICY IF EXISTS "Progress viewable by everyone" ON public.user_progress;
CREATE POLICY "Progress viewable by authenticated"
  ON public.user_progress FOR SELECT TO authenticated USING (true);

-- Revoke anon grants so Data API blocks unauthenticated reads
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.user_progress FROM anon;

-- SECURITY DEFINER trigger functions should not be callable by API roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_progress() FROM anon, authenticated, public;


-- --------------------------------------------------------
-- Migration: 20260603181535_b8b84733-5173-4aba-85eb-0da1daadd694.sql
-- --------------------------------------------------------

-- Restrict profiles SELECT to own row
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Restrict user_progress SELECT to own row
DROP POLICY IF EXISTS "Progress viewable by authenticated" ON public.user_progress;
CREATE POLICY "Users can view own progress"
  ON public.user_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Leaderboard exposure: SECURITY DEFINER function returning only safe columns
CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit int DEFAULT 50)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  xp int,
  level int,
  streak int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT up.user_id,
         COALESCE(p.display_name, 'Anonymous') AS display_name,
         up.xp,
         up.level,
         up.streak
    FROM public.user_progress up
    LEFT JOIN public.profiles p ON p.user_id = up.user_id
   ORDER BY up.xp DESC
   LIMIT GREATEST(1, LEAST(_limit, 100));
$$;

REVOKE EXECUTE ON FUNCTION public.get_leaderboard(int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(int) TO authenticated;


-- --------------------------------------------------------
-- Migration: 20260603181642_5ba72114-cc52-4b6a-bd4f-9acc2ceb01ff.sql
-- --------------------------------------------------------

-- user_progress
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
CREATE POLICY "Users can insert own progress" ON public.user_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.user_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- level_progress
DROP POLICY IF EXISTS "Users can insert own level progress" ON public.level_progress;
CREATE POLICY "Users can insert own level progress" ON public.level_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- module_progress
DROP POLICY IF EXISTS "Users can insert own module progress" ON public.module_progress;
CREATE POLICY "Users can insert own module progress" ON public.module_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- topic_progress
DROP POLICY IF EXISTS "Users can insert own topic progress" ON public.topic_progress;
DROP POLICY IF EXISTS "Users can update own topic progress" ON public.topic_progress;
DROP POLICY IF EXISTS "Users can view own topic progress" ON public.topic_progress;
CREATE POLICY "Users can insert own topic progress" ON public.topic_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own topic progress" ON public.topic_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own topic progress" ON public.topic_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_answers
DROP POLICY IF EXISTS "Users can insert own answers" ON public.user_answers;
DROP POLICY IF EXISTS "Users can view own answers" ON public.user_answers;
CREATE POLICY "Users can insert own answers" ON public.user_answers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own answers" ON public.user_answers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- profiles INSERT/UPDATE tighten to authenticated
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);


-- --------------------------------------------------------
-- Migration: 20260616094029_765ecdeb-21da-4c8e-a99c-b014496327d8.sql
-- --------------------------------------------------------

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


-- --------------------------------------------------------
-- Migration: 20260617164203_e54a7915-b0e9-4302-83b0-7c3acf6d285b.sql
-- --------------------------------------------------------

-- 1) Prevent client-side tampering with is_premium via a BEFORE UPDATE trigger.
CREATE OR REPLACE FUNCTION public.prevent_premium_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow privileged roles (service_role, postgres) to change is_premium.
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' IN ('service_role') THEN
    RETURN NEW;
  END IF;
  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
    RAISE EXCEPTION 'is_premium cannot be modified from the client';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_premium_self_update ON public.profiles;
CREATE TRIGGER profiles_prevent_premium_self_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_premium_self_update();

REVOKE EXECUTE ON FUNCTION public.prevent_premium_self_update() FROM PUBLIC, anon, authenticated;

-- 2) Atomic, server-side AI Tutor quota check + consume.
CREATE OR REPLACE FUNCTION public.consume_ai_tutor_request(_limit integer DEFAULT 3)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _is_premium boolean := false;
  _today date := (now() at time zone 'utc')::date;
  _count integer := 0;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'unauthenticated');
  END IF;

  SELECT COALESCE(is_premium, false) INTO _is_premium
    FROM public.profiles WHERE user_id = _uid;

  IF _is_premium THEN
    RETURN jsonb_build_object('allowed', true, 'premium', true, 'remaining', -1);
  END IF;

  INSERT INTO public.ai_tutor_usage (user_id, usage_date, count)
  VALUES (_uid, _today, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET count = public.ai_tutor_usage.count + 1
  WHERE public.ai_tutor_usage.count < _limit
  RETURNING count INTO _count;

  IF _count IS NULL THEN
    SELECT count INTO _count FROM public.ai_tutor_usage
     WHERE user_id = _uid AND usage_date = _today;
    RETURN jsonb_build_object('allowed', false, 'premium', false, 'remaining', 0, 'count', _count);
  END IF;

  RETURN jsonb_build_object('allowed', true, 'premium', false, 'remaining', GREATEST(0, _limit - _count), 'count', _count);
END;
$$;

-- Ensure uniqueness for ON CONFLICT.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'ai_tutor_usage_user_date_key'
  ) THEN
    ALTER TABLE public.ai_tutor_usage
      ADD CONSTRAINT ai_tutor_usage_user_date_key UNIQUE (user_id, usage_date);
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.consume_ai_tutor_request(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_ai_tutor_request(integer) TO authenticated, service_role;


-- --------------------------------------------------------
-- Migration: 20260618063137_c05b2f71-d875-4e58-a28f-ee506f3b05bd.sql
-- --------------------------------------------------------

-- ============================================================
--  Lock down user_progress + level_progress against client tampering
-- ============================================================

-- 1) Drop client-side mutation policies
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update own level progress" ON public.level_progress;
DROP POLICY IF EXISTS "Users can insert own level progress" ON public.level_progress;

REVOKE UPDATE ON public.user_progress FROM authenticated;
REVOKE INSERT, UPDATE ON public.level_progress FROM authenticated;

-- SELECT + (initial) INSERT on user_progress remain so the new-user trigger and dashboards keep working.

-- ============================================================
--  Server-side RPCs (SECURITY DEFINER, owned by postgres → bypass RLS)
-- ============================================================

-- Set adaptive difficulty (Onboarding + Quiz)
CREATE OR REPLACE FUNCTION public.up_set_difficulty(_anchor int, _correct_streak int DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _anchor < 1 OR _anchor > 5 THEN RAISE EXCEPTION 'invalid anchor'; END IF;
  UPDATE public.user_progress
     SET difficulty_anchor = _anchor,
         current_streak    = COALESCE(_correct_streak, current_streak)
   WHERE user_id = _uid;
END $$;

-- Decrement hearts (premium users bypass)
CREATE OR REPLACE FUNCTION public.up_lose_heart()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _premium bool; _h int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  SELECT COALESCE(is_premium,false) INTO _premium FROM public.profiles WHERE user_id = _uid;
  IF _premium THEN RETURN jsonb_build_object('hearts', 5, 'premium', true); END IF;
  UPDATE public.user_progress
     SET hearts = GREATEST(0, hearts - 1),
         hearts_updated_at = now()
   WHERE user_id = _uid
   RETURNING hearts INTO _h;
  RETURN jsonb_build_object('hearts', _h);
END $$;

-- Restore one heart (perfect practice / rewarded ad)
CREATE OR REPLACE FUNCTION public.up_restore_heart()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _h int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  UPDATE public.user_progress
     SET hearts = LEAST(5, hearts + 1),
         hearts_updated_at = now()
   WHERE user_id = _uid
   RETURNING hearts INTO _h;
  RETURN jsonb_build_object('hearts', _h);
END $$;

-- Spend gems to refill hearts
CREATE OR REPLACE FUNCTION public.up_refill_hearts_with_gems(_cost int DEFAULT 150)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _g int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _cost < 0 OR _cost > 500 THEN RAISE EXCEPTION 'invalid cost'; END IF;
  UPDATE public.user_progress
     SET gems = gems - _cost,
         hearts = 5,
         hearts_updated_at = now()
   WHERE user_id = _uid AND gems >= _cost
   RETURNING gems INTO _g;
  IF _g IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  RETURN jsonb_build_object('ok', true, 'gems', _g, 'hearts', 5);
END $$;

-- Buy a shop item (streak freeze or exam ticket)
CREATE OR REPLACE FUNCTION public.up_purchase_item(_item text, _cost int, _quantity int DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _g int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _cost < 0 OR _cost > 5000 THEN RAISE EXCEPTION 'invalid cost'; END IF;
  IF _quantity < 1 OR _quantity > 10 THEN RAISE EXCEPTION 'invalid qty'; END IF;
  IF _item NOT IN ('streak_freeze_count','mock_exam_tickets','full_exam_tickets','section_exam_tickets') THEN
    RAISE EXCEPTION 'invalid item';
  END IF;
  EXECUTE format(
    'UPDATE public.user_progress SET gems = gems - $1, %1$I = %1$I + $2 WHERE user_id = $3 AND gems >= $1 RETURNING gems',
    _item
  ) INTO _g USING _cost, _quantity, _uid;
  IF _g IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  RETURN jsonb_build_object('ok', true, 'gems', _g);
END $$;

-- Consume one exam ticket
CREATE OR REPLACE FUNCTION public.up_consume_ticket(_ticket text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _v int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _ticket NOT IN ('mock_exam_tickets','full_exam_tickets','section_exam_tickets') THEN
    RAISE EXCEPTION 'invalid ticket';
  END IF;
  EXECUTE format(
    'UPDATE public.user_progress SET %1$I = %1$I - 1 WHERE user_id = $1 AND %1$I > 0 RETURNING %1$I',
    _ticket
  ) INTO _v USING _uid;
  IF _v IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  RETURN jsonb_build_object('ok', true);
END $$;

-- Spend gems (jump-test retry, generic spend)
CREATE OR REPLACE FUNCTION public.up_spend_gems(_amount int)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _g int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _amount <= 0 OR _amount > 5000 THEN RAISE EXCEPTION 'invalid amount'; END IF;
  UPDATE public.user_progress SET gems = gems - _amount
   WHERE user_id = _uid AND gems >= _amount
   RETURNING gems INTO _g;
  IF _g IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  RETURN jsonb_build_object('ok', true, 'gems', _g);
END $$;

-- Award a small bounded gem bonus (e.g. error-queue completion)
CREATE OR REPLACE FUNCTION public.up_award_gems(_amount int, _reason text DEFAULT 'bonus')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _g int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _amount <= 0 OR _amount > 200 THEN RAISE EXCEPTION 'invalid amount'; END IF;
  IF _reason NOT IN ('error_queue_clear','bonus','daily_chest') THEN
    RAISE EXCEPTION 'invalid reason';
  END IF;
  UPDATE public.user_progress SET gems = gems + _amount WHERE user_id = _uid RETURNING gems INTO _g;
  RETURN jsonb_build_object('ok', true, 'gems', _g);
END $$;

-- Daily check-in
CREATE OR REPLACE FUNCTION public.up_daily_check_in()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _rewards int[] := ARRAY[10,15,20,30,40,60,100];
  _today date := (now() at time zone 'utc')::date;
  _yesterday date := _today - 1;
  _last date; _streak int; _reward int; _new_streak int; _idx int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  SELECT last_check_in_date, daily_check_in_streak INTO _last, _streak
    FROM public.user_progress WHERE user_id = _uid;
  IF _last = _today THEN RETURN jsonb_build_object('reward', 0); END IF;
  IF _last = _yesterday THEN
    _new_streak := COALESCE(_streak,0) + 1;
    _idx := LEAST(COALESCE(_streak,0), 6) + 1;
  ELSE
    _new_streak := 1; _idx := 1;
  END IF;
  _reward := _rewards[_idx];
  UPDATE public.user_progress
     SET gems = gems + _reward,
         daily_check_in_streak = _new_streak,
         last_check_in_date = _today
   WHERE user_id = _uid;
  RETURN jsonb_build_object('reward', _reward, 'streak', _new_streak);
END $$;

-- Bump streak on any quiz activity
CREATE OR REPLACE FUNCTION public.up_bump_streak_on_activity()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _last date; _streak int; _new_streak int;
  _today date := (now() at time zone 'utc')::date;
  _yesterday date := _today - 1;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  SELECT last_activity_date, streak INTO _last, _streak
    FROM public.user_progress WHERE user_id = _uid;
  IF _last = _today THEN RETURN jsonb_build_object('streak', _streak); END IF;
  _new_streak := CASE WHEN _last = _yesterday THEN COALESCE(_streak,0) + 1 ELSE 1 END;
  UPDATE public.user_progress
     SET streak = _new_streak, last_activity_date = _today
   WHERE user_id = _uid;
  RETURN jsonb_build_object('streak', _new_streak);
END $$;

-- Streak freeze auto-burn (Dashboard)
CREATE OR REPLACE FUNCTION public.up_use_streak_freeze()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _count int; _last date;
  _today date := (now() at time zone 'utc')::date;
  _yesterday date := _today - 1;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  SELECT streak_freeze_count, last_activity_date INTO _count, _last
    FROM public.user_progress WHERE user_id = _uid;
  IF COALESCE(_count,0) < 1 THEN RETURN jsonb_build_object('used', false); END IF;
  IF _last IS NOT NULL AND _last >= _yesterday THEN RETURN jsonb_build_object('used', false); END IF;
  UPDATE public.user_progress
     SET streak_freeze_count = streak_freeze_count - 1,
         last_activity_date  = _yesterday
   WHERE user_id = _uid;
  RETURN jsonb_build_object('used', true);
END $$;

-- Complete a quiz level. Server computes XP & gem rewards from the score.
-- _mode: 'standard' | 'boss' | 'theory' | 'review'
CREATE OR REPLACE FUNCTION public.complete_level(
  _unit_id int,
  _level_id int,
  _score_correct int DEFAULT 0,
  _score_total int DEFAULT 0,
  _mode text DEFAULT 'standard'
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() at time zone 'utc')::date;
  _yesterday date := _today - 1;
  _xp int := 0;
  _gems int := 0;
  _is_perfect bool;
  _existing_completed bool;
  _prog record;
  _new_xp int; _new_level int; _new_streak int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _score_correct < 0 OR _score_total < 0 OR _score_correct > _score_total OR _score_total > 50 THEN
    RAISE EXCEPTION 'invalid score';
  END IF;
  IF _mode NOT IN ('standard','boss','theory','review') THEN
    RAISE EXCEPTION 'invalid mode';
  END IF;

  _is_perfect := _score_total > 0 AND _score_correct = _score_total;

  SELECT is_completed INTO _existing_completed FROM public.level_progress
    WHERE user_id = _uid AND unit_id = _unit_id AND level_id = _level_id;

  -- Server-side reward formula
  IF _mode = 'theory' THEN
    _xp := 20; _gems := 15;
  ELSIF _mode = 'review' THEN
    _xp := LEAST(_score_correct * 2, 40);
    _gems := LEAST(_score_correct * 2, 40);
  ELSIF _mode = 'boss' THEN
    _xp := 20 + _score_correct * 5;
    _gems := 15 + _score_correct * 2;
    IF _is_perfect THEN _gems := _gems * 2; END IF;
    IF COALESCE(_existing_completed,false) = false AND _score_total > 0
       AND _score_correct::numeric / _score_total >= 0.7 THEN
      _xp := _xp + 100;
      _gems := _gems + 100;
    END IF;
  ELSE -- standard
    _xp := 20 + _score_correct * 5;
    _gems := 15 + _score_correct * 2;
    IF _is_perfect THEN _gems := _gems * 2; END IF;
  END IF;

  -- Upsert level_progress (review doesn't overwrite, but still marks attempted)
  IF _mode <> 'review' THEN
    INSERT INTO public.level_progress
      (user_id, unit_id, level_id, is_completed, score_correct, score_total, xp_earned, gems_earned)
    VALUES (_uid, _unit_id, _level_id, true, _score_correct, _score_total, _xp, _gems)
    ON CONFLICT (user_id, unit_id, level_id) DO UPDATE SET
      is_completed  = true,
      score_correct = GREATEST(public.level_progress.score_correct, EXCLUDED.score_correct),
      score_total   = GREATEST(public.level_progress.score_total,   EXCLUDED.score_total),
      xp_earned     = GREATEST(public.level_progress.xp_earned,     EXCLUDED.xp_earned),
      gems_earned   = GREATEST(public.level_progress.gems_earned,   EXCLUDED.gems_earned),
      updated_at    = now();
  END IF;

  -- Bump user_progress rewards (review always; others only on first completion)
  IF _mode = 'review' OR COALESCE(_existing_completed,false) = false THEN
    SELECT * INTO _prog FROM public.user_progress WHERE user_id = _uid;
    _new_xp := COALESCE(_prog.xp,0) + _xp;
    _new_level := GREATEST(1, _new_xp / 100 + 1);
    _new_streak := CASE
      WHEN _prog.last_activity_date = _today THEN _prog.streak
      WHEN _prog.last_activity_date = _yesterday THEN _prog.streak + 1
      ELSE 1
    END;
    UPDATE public.user_progress
       SET xp                 = _new_xp,
           level              = _new_level,
           gems               = COALESCE(gems,0) + _gems,
           streak             = _new_streak,
           last_activity_date = _today
     WHERE user_id = _uid;
  END IF;

  RETURN jsonb_build_object(
    'xp_earned', _xp,
    'gems_earned', _gems,
    'first_time', COALESCE(_existing_completed,false) = false,
    'perfect', _is_perfect
  );
END $$;

-- Restrict execute to authenticated users (and service_role)
REVOKE EXECUTE ON FUNCTION public.up_set_difficulty(int,int)         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.up_lose_heart()                    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.up_restore_heart()                 FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.up_refill_hearts_with_gems(int)    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.up_purchase_item(text,int,int)     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.up_consume_ticket(text)            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.up_spend_gems(int)                 FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.up_award_gems(int,text)            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.up_daily_check_in()                FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.up_bump_streak_on_activity()       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.up_use_streak_freeze()             FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.complete_level(int,int,int,int,text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.up_set_difficulty(int,int)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.up_lose_heart()                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.up_restore_heart()                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.up_refill_hearts_with_gems(int)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.up_purchase_item(text,int,int)     TO authenticated;
GRANT EXECUTE ON FUNCTION public.up_consume_ticket(text)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.up_spend_gems(int)                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.up_award_gems(int,text)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.up_daily_check_in()                TO authenticated;
GRANT EXECUTE ON FUNCTION public.up_bump_streak_on_activity()       TO authenticated;
GRANT EXECUTE ON FUNCTION public.up_use_streak_freeze()             TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_level(int,int,int,int,text) TO authenticated;


-- --------------------------------------------------------
-- Migration: 20260618063641_4b359dc0-3acd-4007-8ed6-e2753d8efe03.sql
-- --------------------------------------------------------

-- Drop client write policies on progress tables
DROP POLICY IF EXISTS "Users can insert own module progress" ON public.module_progress;
DROP POLICY IF EXISTS "Users can update own module progress" ON public.module_progress;
DROP POLICY IF EXISTS "Users can insert own topic progress" ON public.topic_progress;
DROP POLICY IF EXISTS "Users can update own topic progress" ON public.topic_progress;
DROP POLICY IF EXISTS "Users can insert own answers" ON public.user_answers;

REVOKE INSERT, UPDATE, DELETE ON public.module_progress FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.topic_progress  FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_answers    FROM authenticated;

-- RPC: record an answer; correctness is computed server-side from questions
CREATE OR REPLACE FUNCTION public.ua_record_answer(
  _question_id uuid,
  _selected_answer integer,
  _mode text DEFAULT 'casual'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _correct int;
  _is_correct boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _selected_answer IS NULL OR _selected_answer < 0 OR _selected_answer > 3 THEN
    RAISE EXCEPTION 'invalid selected_answer';
  END IF;
  IF _mode NOT IN ('casual','focus') THEN
    RAISE EXCEPTION 'invalid mode';
  END IF;
  SELECT correct_answer INTO _correct FROM public.questions WHERE id = _question_id;
  IF _correct IS NULL THEN RAISE EXCEPTION 'unknown question'; END IF;
  _is_correct := (_selected_answer = _correct);
  INSERT INTO public.user_answers (user_id, question_id, selected_answer, is_correct, mode)
  VALUES (_uid, _question_id, _selected_answer, _is_correct, _mode);
  RETURN jsonb_build_object('is_correct', _is_correct);
END $$;

-- RPC: record topic progress (difficulty / unlock managed server-side)
CREATE OR REPLACE FUNCTION public.tp_record_progress(
  _topic text,
  _category text,
  _correct integer,
  _total integer,
  _difficulty text DEFAULT 'medium'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _correct < 0 OR _total < 0 OR _correct > _total OR _total > 100 THEN
    RAISE EXCEPTION 'invalid score';
  END IF;
  IF _category NOT IN ('math','reading_writing') THEN RAISE EXCEPTION 'invalid category'; END IF;
  IF _difficulty NOT IN ('easy','medium','hard') THEN RAISE EXCEPTION 'invalid difficulty'; END IF;
  IF length(_topic) = 0 OR length(_topic) > 200 THEN RAISE EXCEPTION 'invalid topic'; END IF;

  INSERT INTO public.topic_progress
    (user_id, topic, category, completed_questions, correct_answers, is_unlocked, current_difficulty)
  VALUES (_uid, _topic, _category, _total, _correct, true, _difficulty)
  ON CONFLICT (user_id, topic) DO UPDATE SET
    completed_questions = public.topic_progress.completed_questions + EXCLUDED.completed_questions,
    correct_answers     = public.topic_progress.correct_answers     + EXCLUDED.correct_answers,
    is_unlocked         = true,
    current_difficulty  = EXCLUDED.current_difficulty,
    category            = EXCLUDED.category,
    updated_at          = now();
END $$;

-- RPC: mark a module complete and unlock the next one. Server validates that all
-- levels in the unit are already completed in level_progress (which is server-controlled).
CREATE OR REPLACE FUNCTION public.mp_complete_module(_module integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid(); _completed int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _module < 1 OR _module > 9 THEN RAISE EXCEPTION 'invalid module'; END IF;

  SELECT COUNT(*) INTO _completed
    FROM public.level_progress
   WHERE user_id = _uid AND unit_id = _module AND is_completed = true;

  IF _completed < 1 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_levels_completed');
  END IF;

  INSERT INTO public.module_progress (user_id, module, is_completed, is_unlocked)
  VALUES (_uid, _module, true, true)
  ON CONFLICT (user_id, module) DO UPDATE SET
    is_completed = true, is_unlocked = true, updated_at = now();

  IF _module < 9 THEN
    INSERT INTO public.module_progress (user_id, module, is_unlocked)
    VALUES (_uid, _module + 1, true)
    ON CONFLICT (user_id, module) DO UPDATE SET
      is_unlocked = true, updated_at = now();
  END IF;

  RETURN jsonb_build_object('ok', true);
END $$;

-- RPC: jump test pass — server enforces threshold (75%) and minimum question count
CREATE OR REPLACE FUNCTION public.mp_pass_jump_test(
  _module integer,
  _score_correct integer,
  _score_total integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid(); i int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _module < 1 OR _module > 9 THEN RAISE EXCEPTION 'invalid module'; END IF;
  IF _score_total < 10 OR _score_total > 50 OR _score_correct < 0 OR _score_correct > _score_total THEN
    RAISE EXCEPTION 'invalid score';
  END IF;
  IF (_score_correct::numeric / _score_total) < 0.75 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'below_threshold');
  END IF;
  FOR i IN 1.._module LOOP
    INSERT INTO public.module_progress (user_id, module, is_completed, is_unlocked)
    VALUES (_uid, i, (i < _module), true)
    ON CONFLICT (user_id, module) DO UPDATE SET
      is_completed = (i < _module) OR public.module_progress.is_completed,
      is_unlocked = true,
      updated_at = now();
  END LOOP;
  RETURN jsonb_build_object('ok', true);
END $$;

-- RPC: jump test fail — records cooldown
CREATE OR REPLACE FUNCTION public.mp_fail_jump_test(_module integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _module < 1 OR _module > 9 THEN RAISE EXCEPTION 'invalid module'; END IF;
  INSERT INTO public.module_progress (user_id, module, jump_test_failed_at)
  VALUES (_uid, _module, now())
  ON CONFLICT (user_id, module) DO UPDATE SET
    jump_test_failed_at = now(), updated_at = now();
END $$;

-- RPC: clear jump-test cooldown by spending gems (server-validated cost & balance)
CREATE OR REPLACE FUNCTION public.mp_clear_jump_cooldown(_module integer, _cost integer DEFAULT 300)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid(); _g int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _module < 1 OR _module > 9 THEN RAISE EXCEPTION 'invalid module'; END IF;
  IF _cost < 0 OR _cost > 1000 THEN RAISE EXCEPTION 'invalid cost'; END IF;

  UPDATE public.user_progress SET gems = gems - _cost
    WHERE user_id = _uid AND gems >= _cost
    RETURNING gems INTO _g;
  IF _g IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_gems'); END IF;

  UPDATE public.module_progress SET jump_test_failed_at = NULL, updated_at = now()
   WHERE user_id = _uid AND module = _module;
  RETURN jsonb_build_object('ok', true, 'gems', _g);
END $$;

GRANT EXECUTE ON FUNCTION public.ua_record_answer(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tp_record_progress(text, text, integer, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mp_complete_module(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mp_pass_jump_test(integer, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mp_fail_jump_test(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mp_clear_jump_cooldown(integer, integer) TO authenticated;


-- --------------------------------------------------------
-- Migration: 20260618063702_9b8567a6-51c2-40be-97ef-a85584ae36c6.sql
-- --------------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.ua_record_answer(uuid, integer, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.tp_record_progress(text, text, integer, integer, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mp_complete_module(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mp_pass_jump_test(integer, integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mp_fail_jump_test(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mp_clear_jump_cooldown(integer, integer) FROM PUBLIC, anon;


-- --------------------------------------------------------
-- Migration: 20260619061544_a2628cc3-4061-4270-97f5-b0f16d4b9483.sql
-- --------------------------------------------------------

-- 1. Drop overly permissive RLS policies
DROP POLICY IF EXISTS "Users insert their own ai tutor usage" ON public.ai_tutor_usage;
DROP POLICY IF EXISTS "Users update their own ai tutor usage" ON public.ai_tutor_usage;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;

REVOKE INSERT, UPDATE ON public.ai_tutor_usage FROM authenticated;
REVOKE INSERT ON public.user_progress FROM authenticated;

-- 2. Track once-per-day error-queue clear bonus
ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS last_error_queue_clear_date date;

-- 3. Drop old client-cost RPCs (will recreate without _cost)
DROP FUNCTION IF EXISTS public.up_purchase_item(text, integer, integer);
DROP FUNCTION IF EXISTS public.up_refill_hearts_with_gems(integer);
DROP FUNCTION IF EXISTS public.mp_clear_jump_cooldown(integer, integer);
DROP FUNCTION IF EXISTS public.up_award_gems(integer, text);

-- 4. Server-priced refill hearts (fixed 150 gems)
CREATE OR REPLACE FUNCTION public.up_refill_hearts_with_gems()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid(); _g int; _cost int := 150;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  UPDATE public.user_progress
     SET gems = gems - _cost,
         hearts = 5,
         hearts_updated_at = now()
   WHERE user_id = _uid AND gems >= _cost
   RETURNING gems INTO _g;
  IF _g IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  RETURN jsonb_build_object('ok', true, 'gems', _g, 'hearts', 5);
END $$;

-- 5. Server-priced purchase with built-in exam-ticket discount logic
CREATE OR REPLACE FUNCTION public.up_purchase_item(_item text, _quantity integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _base_cost int;
  _cost int;
  _g int;
  _modules_done int;
  _is_master bool := false;
  _total_ans int;
  _correct_ans int;
  _has_scholarship bool := false;
  _discount numeric := 0;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _quantity < 1 OR _quantity > 10 THEN RAISE EXCEPTION 'invalid qty'; END IF;

  _base_cost := CASE _item
    WHEN 'streak_freeze_count'    THEN 200
    WHEN 'mock_exam_tickets'      THEN 400
    WHEN 'section_exam_tickets'   THEN 400
    WHEN 'full_exam_tickets'      THEN 850
    ELSE NULL
  END;
  IF _base_cost IS NULL THEN RAISE EXCEPTION 'invalid item'; END IF;

  -- Server-side discount: only on exam tickets
  IF _item IN ('mock_exam_tickets','section_exam_tickets','full_exam_tickets') THEN
    SELECT COUNT(*) INTO _modules_done
      FROM public.module_progress
     WHERE user_id = _uid AND is_completed = true AND module BETWEEN 1 AND 9;
    _is_master := _modules_done >= 9;

    IF NOT _is_master THEN
      SELECT COUNT(*), COUNT(*) FILTER (WHERE is_correct)
        INTO _total_ans, _correct_ans
        FROM public.user_answers WHERE user_id = _uid;
      _has_scholarship := _total_ans >= 10 AND (_correct_ans::numeric / _total_ans) >= 0.9;
    END IF;

    _discount := CASE
      WHEN _is_master THEN 0.5
      WHEN _has_scholarship THEN 0.2
      ELSE 0
    END;
  END IF;

  _cost := GREATEST(0, ROUND(_base_cost * _quantity * (1 - _discount)))::int;

  EXECUTE format(
    'UPDATE public.user_progress SET gems = gems - $1, %1$I = %1$I + $2 WHERE user_id = $3 AND gems >= $1 RETURNING gems',
    _item
  ) INTO _g USING _cost, _quantity, _uid;

  IF _g IS NULL THEN RETURN jsonb_build_object('ok', false, 'cost', _cost); END IF;
  RETURN jsonb_build_object('ok', true, 'gems', _g, 'cost', _cost, 'discount', _discount);
END $$;

-- 6. Server-priced jump-test cooldown bypass (fixed 300 gems)
CREATE OR REPLACE FUNCTION public.mp_clear_jump_cooldown(_module integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid(); _g int; _cost int := 300;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _module < 1 OR _module > 9 THEN RAISE EXCEPTION 'invalid module'; END IF;

  UPDATE public.user_progress SET gems = gems - _cost
    WHERE user_id = _uid AND gems >= _cost
    RETURNING gems INTO _g;
  IF _g IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_gems'); END IF;

  UPDATE public.module_progress SET jump_test_failed_at = NULL, updated_at = now()
   WHERE user_id = _uid AND module = _module;
  RETURN jsonb_build_object('ok', true, 'gems', _g);
END $$;

-- 7. Replace open up_award_gems with a condition-checked error-queue clear bonus
CREATE OR REPLACE FUNCTION public.up_clear_error_queue_bonus()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() at time zone 'utc')::date;
  _last date;
  _remaining int;
  _bonus int := 50;
  _g int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  SELECT COUNT(*) INTO _remaining FROM public.user_errors WHERE user_id = _uid;
  IF _remaining > 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'queue_not_empty');
  END IF;

  SELECT last_error_queue_clear_date INTO _last
    FROM public.user_progress WHERE user_id = _uid;
  IF _last = _today THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed');
  END IF;

  UPDATE public.user_progress
     SET gems = gems + _bonus,
         last_error_queue_clear_date = _today
   WHERE user_id = _uid
   RETURNING gems INTO _g;

  RETURN jsonb_build_object('ok', true, 'gems', _g, 'bonus', _bonus);
END $$;

-- 8. Lock down EXECUTE on every public SECURITY DEFINER function: revoke from anon/PUBLIC, grant to authenticated only
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS sig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.prosecdef
       AND p.proname NOT IN ('handle_new_user','handle_new_user_progress','prevent_premium_self_update','update_updated_at_column')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;


-- --------------------------------------------------------
-- Migration: 20260716170615_44dcf03f-17bf-4710-9ecb-47517aaf4dde.sql
-- --------------------------------------------------------

-- 1. Email subscriptions
CREATE TABLE public.email_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.email_subscriptions TO anon, authenticated;
GRANT ALL ON public.email_subscriptions TO service_role;

ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON public.email_subscriptions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND length(email) <= 254
  );

-- 2. CTA click events
CREATE TABLE public.cta_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event TEXT NOT NULL,
  path TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.cta_events TO anon, authenticated;
GRANT ALL ON public.cta_events TO service_role;

ALTER TABLE public.cta_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log CTA events"
  ON public.cta_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (length(event) BETWEEN 1 AND 80);


-- --------------------------------------------------------
-- Migration: 20260717063939_6d355329-0b6e-49a1-9aab-999f4c6f0731.sql
-- --------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS target_score integer,
  ADD COLUMN IF NOT EXISTS daily_minutes integer,
  ADD COLUMN IF NOT EXISTS diagnostic_score integer,
  ADD COLUMN IF NOT EXISTS initial_level text;


-- --------------------------------------------------------
-- Migration: 20260718153310_120f7fed-a8b5-4056-bc6a-0912043db97f.sql
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- Migration: 20260721224907_recreate_user_vocabulary.sql
-- --------------------------------------------------------
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


-- --------------------------------------------------------
-- Migration: 20260721235545_create_promo_codes.sql
-- --------------------------------------------------------
-- Create promo_codes and attempts tables
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  is_used boolean NOT NULL DEFAULT false,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamptz,
  duration_days int NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promo_code_attempts (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  attempt_count int NOT NULL DEFAULT 1
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_attempts ENABLE ROW LEVEL SECURITY;

-- Deny SELECT / ALL to users on promo_codes (no policy allows select, so it's fully denied by default under RLS)
-- Service role has full permissions automatically in Supabase, but let's explicitly grant ALL to service_role and deny to authenticated/anon
GRANT ALL ON public.promo_codes TO service_role;
GRANT ALL ON public.promo_code_attempts TO service_role;

-- Secure SQL RPC function check_and_apply_promo_code
CREATE OR REPLACE FUNCTION public.check_and_apply_promo_code(input_code TEXT)
RETURNS jsonb
SECURITY DEFINER -- Runs with owner privileges to read promo_codes & update profiles
AS $$
DECLARE
  v_code_id UUID;
  v_is_used BOOLEAN;
  v_user_id UUID;
  v_last_attempt TIMESTAMPTZ;
  v_attempt_count INT;
BEGIN
  -- Get active user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Unauthorized');
  END IF;

  -- Rate Limiting: Prevent brute force (max 5 attempts per 1 minute)
  SELECT last_attempt_at, attempt_count INTO v_last_attempt, v_attempt_count
  FROM public.promo_code_attempts
  WHERE user_id = v_user_id;

  IF v_last_attempt IS NOT NULL AND v_last_attempt > now() - INTERVAL '1 minute' THEN
    IF v_attempt_count >= 5 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Too many attempts. Please wait 1 minute.');
    END IF;
  ELSE
    -- Reset attempt count if 1 minute has elapsed
    v_attempt_count := 0;
  END IF;

  -- Select code details from secured table
  SELECT id, is_used INTO v_code_id, v_is_used
  FROM public.promo_codes
  WHERE code = input_code;

  -- If code is not found
  IF v_code_id IS NULL THEN
    INSERT INTO public.promo_code_attempts (user_id, last_attempt_at, attempt_count)
    VALUES (v_user_id, now(), COALESCE(v_attempt_count, 0) + 1)
    ON CONFLICT (user_id) DO UPDATE
    SET last_attempt_at = EXCLUDED.last_attempt_at,
        attempt_count = public.promo_code_attempts.attempt_count + 1;

    RETURN jsonb_build_object('ok', false, 'error', 'Invalid promo code');
  END IF;

  -- If code is already used
  IF v_is_used THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Promo code already used');
  END IF;

  -- Valid code: Redeem it
  UPDATE public.promo_codes
  SET is_used = true,
      used_by = v_user_id,
      used_at = now()
  WHERE id = v_code_id;

  -- Activate premium on profile
  UPDATE public.profiles
  SET is_premium = true
  WHERE user_id = v_user_id;

  -- Reset attempt counter on success
  DELETE FROM public.promo_code_attempts WHERE user_id = v_user_id;

  RETURN jsonb_build_object('ok', true, 'message', 'Subscription activated successfully!');
END;
$$ LANGUAGE plpgsql;


