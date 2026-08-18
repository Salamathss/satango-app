
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
