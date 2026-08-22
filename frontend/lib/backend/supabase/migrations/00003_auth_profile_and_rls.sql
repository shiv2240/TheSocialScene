-- Migration 00003: Supabase Auth integration, profile provisioning and baseline RLS

-- Profiles are created automatically when a Supabase Auth user is created.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (auth_user_id, full_name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), 'The Social Scene Member'),
    NEW.phone,
    NEW.email
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- Keep profile phone/email synchronized if Supabase Auth changes them.
CREATE OR REPLACE FUNCTION public.handle_auth_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    phone = NEW.phone,
    email = NEW.email,
    updated_at = NOW()
  WHERE auth_user_id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF phone, email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_update();

-- Enable RLS on user-owned tables. Existing privileged server operations can use
-- the Supabase secret/service-role key and therefore bypass these policies.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "registrations_select_own" ON public.registrations;
CREATE POLICY "registrations_select_own"
  ON public.registrations FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "registration_items_select_own" ON public.registration_items;
CREATE POLICY "registration_items_select_own"
  ON public.registration_items FOR SELECT
  TO authenticated
  USING (
    registration_id IN (
      SELECT r.id
      FROM public.registrations r
      JOIN public.profiles p ON p.id = r.user_id
      WHERE p.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "tickets_select_own" ON public.tickets;
CREATE POLICY "tickets_select_own"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "checkins_select_own" ON public.checkins;
CREATE POLICY "checkins_select_own"
  ON public.checkins FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));
