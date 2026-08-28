-- Migration 00015: enforce dashboard access through profile status
-- Suspended dashboard users must not retain access merely because a role mapping exists.

CREATE OR REPLACE FUNCTION public.get_my_dashboard_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.name
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE p.auth_user_id = auth.uid()
    AND p.status = 'ACTIVE'
    AND r.name IN ('SUPER_ADMIN','ADMIN','HOST','EVENT_MANAGER','CHECKIN_STAFF','EDITOR','FINANCE','SUPPORT')
  ORDER BY CASE r.name
    WHEN 'SUPER_ADMIN' THEN 1
    WHEN 'ADMIN' THEN 2
    WHEN 'FINANCE' THEN 3
    WHEN 'EVENT_MANAGER' THEN 4
    WHEN 'HOST' THEN 5
    WHEN 'CHECKIN_STAFF' THEN 6
    WHEN 'EDITOR' THEN 7
    WHEN 'SUPPORT' THEN 8
    ELSE 99 END
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_dashboard_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_dashboard_role() TO authenticated;
