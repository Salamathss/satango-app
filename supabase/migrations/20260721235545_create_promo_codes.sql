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
