
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
