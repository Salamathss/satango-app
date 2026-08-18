-- Fix: prevent_premium_self_update trigger incorrectly blocked SECURITY DEFINER RPC functions.
-- Root cause: JWT claims still show 'authenticated' even inside SECURITY DEFINER functions,
-- so the old check was too aggressive. We now use current_user (the DB role executing the
-- statement) instead of the JWT claim — SECURITY DEFINER functions run as 'postgres' (owner),
-- which passes the check.

CREATE OR REPLACE FUNCTION public.prevent_premium_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow if the DB-level role executing the statement is a privileged role.
  -- SECURITY DEFINER functions always execute as their owner (postgres/supabase_admin),
  -- so RPC calls like check_and_apply_promo_code will pass this check.
  IF current_user IN ('postgres', 'supabase_admin', 'service_role', 'supabase_auth_admin') THEN
    RETURN NEW;
  END IF;

  -- Block direct client attempts to modify is_premium.
  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
    RAISE EXCEPTION 'is_premium cannot be modified from the client';
  END IF;

  RETURN NEW;
END;
$$;

-- Re-lock execute permissions (unchanged).
REVOKE EXECUTE ON FUNCTION public.prevent_premium_self_update() FROM PUBLIC, anon, authenticated;
