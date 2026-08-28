-- Migration 00017: Multi-role dashboard RBAC
-- Keeps the existing primary-role function for backwards compatibility while
-- exposing the complete role set for authorization and navigation.

CREATE OR REPLACE FUNCTION public.get_my_dashboard_roles()
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    ARRAY_AGG(r.name ORDER BY CASE r.name
      WHEN 'SUPER_ADMIN' THEN 1
      WHEN 'ADMIN' THEN 2
      WHEN 'FINANCE' THEN 3
      WHEN 'EVENT_MANAGER' THEN 4
      WHEN 'HOST' THEN 5
      WHEN 'CHECKIN_STAFF' THEN 6
      WHEN 'EDITOR' THEN 7
      WHEN 'SUPPORT' THEN 8
      ELSE 99 END),
    ARRAY[]::text[]
  )
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE p.auth_user_id = auth.uid()
    AND p.status = 'ACTIVE'
    AND r.name IN ('SUPER_ADMIN','ADMIN','HOST','EVENT_MANAGER','CHECKIN_STAFF','EDITOR','FINANCE','SUPPORT');
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_dashboard_roles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_dashboard_roles() TO authenticated;

-- The application currently uses role_permissions in the schema, so seed the
-- canonical role -> permission mappings from the dashboard RBAC definition.
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.key = ANY (
  CASE r.name
    WHEN 'SUPER_ADMIN' THEN ARRAY[
      'EVENT_CREATE','EVENT_VIEW','EVENT_EDIT','EVENT_DELETE','EVENT_PUBLISH',
      'REGISTRATION_VIEW','REGISTRATION_EXPORT','REGISTRATION_MANAGE',
      'CHECKIN_VIEW','CHECKIN_CREATE','HOST_VIEW','HOST_CREATE','HOST_EDIT','HOST_DELETE',
      'USER_VIEW','USER_MANAGE','PAYMENT_VIEW','REFUND_MANAGE','ANALYTICS_VIEW','SETTINGS_MANAGE','AUDIT_LOG_VIEW'
    ]
    WHEN 'ADMIN' THEN ARRAY[
      'EVENT_CREATE','EVENT_VIEW','EVENT_EDIT','EVENT_DELETE','EVENT_PUBLISH',
      'REGISTRATION_VIEW','REGISTRATION_EXPORT','REGISTRATION_MANAGE',
      'CHECKIN_VIEW','CHECKIN_CREATE','HOST_VIEW','HOST_CREATE','HOST_EDIT','HOST_DELETE',
      'USER_VIEW','USER_MANAGE','PAYMENT_VIEW','REFUND_MANAGE','ANALYTICS_VIEW','AUDIT_LOG_VIEW'
    ]
    WHEN 'HOST' THEN ARRAY[
      'EVENT_CREATE','EVENT_VIEW','EVENT_EDIT','REGISTRATION_VIEW','CHECKIN_VIEW','CHECKIN_CREATE','ANALYTICS_VIEW'
    ]
    WHEN 'EVENT_MANAGER' THEN ARRAY[
      'EVENT_CREATE','EVENT_VIEW','EVENT_EDIT','EVENT_PUBLISH',
      'REGISTRATION_VIEW','REGISTRATION_EXPORT','REGISTRATION_MANAGE',
      'CHECKIN_VIEW','CHECKIN_CREATE','ANALYTICS_VIEW'
    ]
    WHEN 'CHECKIN_STAFF' THEN ARRAY['EVENT_VIEW','REGISTRATION_VIEW','CHECKIN_VIEW','CHECKIN_CREATE']
    WHEN 'EDITOR' THEN ARRAY['EVENT_CREATE','EVENT_VIEW','EVENT_EDIT']
    WHEN 'FINANCE' THEN ARRAY['EVENT_VIEW','REGISTRATION_VIEW','PAYMENT_VIEW','REFUND_MANAGE','ANALYTICS_VIEW']
    WHEN 'SUPPORT' THEN ARRAY['EVENT_VIEW','REGISTRATION_VIEW','REGISTRATION_MANAGE']
    ELSE ARRAY[]::text[]
  END
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_my_dashboard_permissions()
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(ARRAY_AGG(DISTINCT p.key ORDER BY p.key), ARRAY[]::text[])
  FROM public.user_roles ur
  JOIN public.profiles profile ON profile.id = ur.user_id
  JOIN public.role_permissions rp ON rp.role_id = ur.role_id
  JOIN public.permissions p ON p.id = rp.permission_id
  WHERE profile.auth_user_id = auth.uid()
    AND profile.status = 'ACTIVE';
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_dashboard_permissions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_dashboard_permissions() TO authenticated;

-- Make the legacy scalar role resolver respect the same active-account rule.
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
