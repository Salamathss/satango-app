
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
