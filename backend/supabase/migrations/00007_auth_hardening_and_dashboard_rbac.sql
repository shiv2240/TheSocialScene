-- The Social Scene: auth hardening and dashboard RBAC

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (auth_user_id, full_name, phone, email)
  VALUES (
    NEW.id,
    NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')), ''),
    NULLIF(BTRIM(COALESCE(NEW.phone, '')), ''),
    LOWER(NULLIF(BTRIM(COALESCE(NEW.email, '')), ''))
  )
  ON CONFLICT (auth_user_id) DO UPDATE
  SET email = COALESCE(EXCLUDED.email, public.profiles.email),
      phone = COALESCE(EXCLUDED.phone, public.profiles.phone)
  WHERE public.profiles.email IS NULL OR public.profiles.phone IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.protect_profile_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id THEN
    RAISE EXCEPTION 'auth_user_id cannot be changed';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'status cannot be changed by the profile owner';
  END IF;
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'email cannot be changed through profile update';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_identity ON public.profiles;
CREATE TRIGGER protect_profile_identity
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_identity();

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

REVOKE ALL ON TABLE public.roles FROM anon, authenticated;
REVOKE ALL ON TABLE public.user_roles FROM anon, authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
