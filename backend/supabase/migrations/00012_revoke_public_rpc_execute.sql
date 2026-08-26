-- Migration 00012: Remove direct anon/authenticated execution of privileged RPCs

REVOKE EXECUTE ON FUNCTION public.checkin_ticket(TEXT, UUID, UUID, TEXT) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_paid_registration(UUID, TEXT, TEXT, TEXT) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_pending_registration(UUID, UUID, NUMERIC, TEXT) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_test_paid_ticket(UUID, UUID, NUMERIC) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_ticket_attendance(TEXT, UUID, TEXT, UUID, TEXT) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.checkin_ticket(TEXT, UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_paid_registration(UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_pending_registration(UUID, UUID, NUMERIC, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_test_paid_ticket(UUID, UUID, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_ticket_attendance(TEXT, UUID, TEXT, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_my_dashboard_role() TO authenticated;
