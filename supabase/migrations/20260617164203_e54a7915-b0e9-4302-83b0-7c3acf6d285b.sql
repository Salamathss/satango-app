
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
