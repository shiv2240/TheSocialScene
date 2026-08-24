-- The Social Scene: Auth profile provisioning and user-owned RLS

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
    NULLIF(COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), ''),
    NEW.phone,
    NEW.email
  )
  ON CONFLICT (auth_user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP POLICY IF EXISTS users_view_own_profile ON public.profiles;
CREATE POLICY users_view_own_profile
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS users_update_own_profile ON public.profiles;
CREATE POLICY users_update_own_profile
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS users_view_own_registrations ON public.registrations;
CREATE POLICY users_view_own_registrations
  ON public.registrations
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS users_view_own_tickets ON public.tickets;
CREATE POLICY users_view_own_tickets
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.auth_user_id = auth.uid()
    )
  );
