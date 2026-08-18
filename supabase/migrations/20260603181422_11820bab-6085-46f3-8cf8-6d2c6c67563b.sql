
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
