-- Security hardening for public functions.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reserve_event_ticket(uuid, uuid, text, numeric) FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.reserve_event_ticket(uuid, uuid, text, numeric) SET search_path = public;
