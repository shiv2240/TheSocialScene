-- Migration 00011: Restrict SECURITY DEFINER RPC execution and pin search_path

REVOKE ALL ON FUNCTION public.checkin_ticket(TEXT, UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.checkin_ticket(TEXT, UUID, UUID, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.confirm_paid_registration(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_paid_registration(UUID, TEXT, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.create_pending_registration(UUID, UUID, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_pending_registration(UUID, UUID, NUMERIC, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.create_test_paid_ticket(UUID, UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_test_paid_ticket(UUID, UUID, NUMERIC) TO service_role;

REVOKE ALL ON FUNCTION public.process_ticket_attendance(TEXT, UUID, TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_ticket_attendance(TEXT, UUID, TEXT, UUID, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.get_my_dashboard_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_dashboard_role() TO authenticated;

ALTER FUNCTION public.checkin_ticket(TEXT, UUID, UUID, TEXT) SET search_path = public, pg_temp;
ALTER FUNCTION public.confirm_paid_registration(UUID, TEXT, TEXT, TEXT) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_pending_registration(UUID, UUID, NUMERIC, TEXT) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_test_paid_ticket(UUID, UUID, NUMERIC) SET search_path = public, pg_temp;
ALTER FUNCTION public.process_ticket_attendance(TEXT, UUID, TEXT, UUID, TEXT) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_my_dashboard_role() SET search_path = public, pg_temp;
