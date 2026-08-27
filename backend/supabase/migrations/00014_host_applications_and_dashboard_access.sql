-- Migration 00014: Host applications, dashboard account onboarding, and host-scoped access

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TYPE host_application_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE IF NOT EXISTS public.host_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    organization_name TEXT,
    city TEXT,
    event_types TEXT[] NOT NULL DEFAULT '{}',
    experience TEXT,
    proposed_event TEXT,
    expected_frequency TEXT,
    social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
    why_host TEXT,
    status host_application_status NOT NULL DEFAULT 'PENDING',
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    credentials_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT host_application_email_valid CHECK (position('@' in email) > 1)
);

CREATE INDEX IF NOT EXISTS idx_host_applications_status ON public.host_applications(status);
CREATE INDEX IF NOT EXISTS idx_host_applications_created_at ON public.host_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_host_applications_email ON public.host_applications(lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS uq_host_applications_pending_email
  ON public.host_applications(lower(email))
  WHERE status = 'PENDING';

ALTER TABLE public.host_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dashboard_read_host_applications ON public.host_applications;
CREATE POLICY dashboard_read_host_applications
  ON public.host_applications
  FOR SELECT
  TO authenticated
  USING (get_my_dashboard_role() IN ('SUPER_ADMIN', 'ADMIN'));

DROP POLICY IF EXISTS dashboard_manage_host_applications ON public.host_applications;
CREATE POLICY dashboard_manage_host_applications
  ON public.host_applications
  FOR UPDATE
  TO authenticated
  USING (get_my_dashboard_role() IN ('SUPER_ADMIN', 'ADMIN'))
  WITH CHECK (get_my_dashboard_role() IN ('SUPER_ADMIN', 'ADMIN'));

-- Host-scoped read access. Dashboard APIs still enforce role + ownership server-side.
CREATE OR REPLACE FUNCTION public.my_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.my_profile_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_profile_id() TO authenticated;

DROP POLICY IF EXISTS dashboard_host_read_events ON public.events;
CREATE POLICY dashboard_host_read_events
  ON public.events
  FOR SELECT
  TO authenticated
  USING (
    host_id = public.my_profile_id()
    AND get_my_dashboard_role() = 'HOST'
  );

DROP POLICY IF EXISTS dashboard_host_update_events ON public.events;
CREATE POLICY dashboard_host_update_events
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (
    host_id = public.my_profile_id()
    AND get_my_dashboard_role() = 'HOST'
  )
  WITH CHECK (
    host_id = public.my_profile_id()
    AND get_my_dashboard_role() = 'HOST'
  );

DROP POLICY IF EXISTS dashboard_host_read_registrations ON public.registrations;
CREATE POLICY dashboard_host_read_registrations
  ON public.registrations
  FOR SELECT
  TO authenticated
  USING (
    get_my_dashboard_role() = 'HOST'
    AND event_id IN (SELECT id FROM public.events WHERE host_id = public.my_profile_id())
  );

DROP POLICY IF EXISTS dashboard_host_read_tickets ON public.tickets;
CREATE POLICY dashboard_host_read_tickets
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (
    get_my_dashboard_role() = 'HOST'
    AND event_id IN (SELECT id FROM public.events WHERE host_id = public.my_profile_id())
  );

DROP POLICY IF EXISTS dashboard_host_read_checkins ON public.checkins;
CREATE POLICY dashboard_host_read_checkins
  ON public.checkins
  FOR SELECT
  TO authenticated
  USING (
    get_my_dashboard_role() = 'HOST'
    AND event_id IN (SELECT id FROM public.events WHERE host_id = public.my_profile_id())
  );

DROP POLICY IF EXISTS dashboard_host_read_attendance_events ON public.attendance_events;
CREATE POLICY dashboard_host_read_attendance_events
  ON public.attendance_events
  FOR SELECT
  TO authenticated
  USING (
    get_my_dashboard_role() = 'HOST'
    AND event_id IN (SELECT id FROM public.events WHERE host_id = public.my_profile_id())
  );

DROP POLICY IF EXISTS dashboard_host_read_orders ON public.orders;
CREATE POLICY dashboard_host_read_orders
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    get_my_dashboard_role() = 'HOST'
    AND registration_id IN (
      SELECT r.id
      FROM public.registrations r
      JOIN public.events e ON e.id = r.event_id
      WHERE e.host_id = public.my_profile_id()
    )
  );

DROP POLICY IF EXISTS dashboard_host_read_payments ON public.payments;
CREATE POLICY dashboard_host_read_payments
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    get_my_dashboard_role() = 'HOST'
    AND order_id IN (
      SELECT o.id
      FROM public.orders o
      JOIN public.registrations r ON r.id = o.registration_id
      JOIN public.events e ON e.id = r.event_id
      WHERE e.host_id = public.my_profile_id()
    )
  );

-- Host event creation is intentionally limited to DRAFT. Publishing remains an admin action.
DROP POLICY IF EXISTS dashboard_host_insert_events ON public.events;
CREATE POLICY dashboard_host_insert_events
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_my_dashboard_role() = 'HOST'
    AND host_id = public.my_profile_id()
    AND created_by = public.my_profile_id()
    AND status = 'DRAFT'
  );

-- Basic role/permission assignments for the new access model.
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.key IN (
  'EVENT_CREATE','EVENT_VIEW','EVENT_EDIT','REGISTRATION_VIEW','REGISTRATION_EXPORT',
  'CHECKIN_VIEW','ANALYTICS_VIEW'
)
WHERE r.name = 'HOST'
ON CONFLICT (role_id, permission_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.update_host_application_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS host_applications_updated_at ON public.host_applications;
CREATE TRIGGER host_applications_updated_at
BEFORE UPDATE ON public.host_applications
FOR EACH ROW EXECUTE FUNCTION public.update_host_application_updated_at();

REVOKE EXECUTE ON FUNCTION public.update_host_application_updated_at() FROM PUBLIC, anon, authenticated;
