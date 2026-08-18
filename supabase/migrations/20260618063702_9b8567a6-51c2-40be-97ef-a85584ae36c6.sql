
REVOKE EXECUTE ON FUNCTION public.ua_record_answer(uuid, integer, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.tp_record_progress(text, text, integer, integer, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mp_complete_module(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mp_pass_jump_test(integer, integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mp_fail_jump_test(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mp_clear_jump_cooldown(integer, integer) FROM PUBLIC, anon;
