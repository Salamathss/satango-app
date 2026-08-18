
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
