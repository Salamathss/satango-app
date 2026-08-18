
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
