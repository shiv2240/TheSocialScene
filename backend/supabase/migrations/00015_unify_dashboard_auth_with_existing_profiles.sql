-- Migration 00015: Allow dashboard Supabase Auth identities to attach to existing main-site profiles
-- Main-site accounts may already have a Firebase-backed profile with the same email.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_profile_id UUID;
  existing_auth_user_id UUID;
BEGIN
  SELECT id, auth_user_id
  INTO existing_profile_id, existing_auth_user_id
  FROM public.profiles
  WHERE lower(email) = lower(NEW.email)
  LIMIT 1;

  IF existing_profile_id IS NOT NULL THEN
    IF existing_auth_user_id IS NOT NULL AND existing_auth_user_id <> NEW.id THEN
      RAISE EXCEPTION 'A dashboard identity is already linked to this email address';
    END IF;

    UPDATE public.profiles
    SET auth_user_id = NEW.id,
        full_name = COALESCE(NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'full_name'), ''), full_name),
        phone = COALESCE(NULLIF(BTRIM(NEW.phone), ''), phone),
        email = lower(NEW.email),
        updated_at = NOW()
    WHERE id = existing_profile_id;

    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (auth_user_id, full_name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'full_name'), ''), 'Dashboard User'),
    NULLIF(BTRIM(NEW.phone), ''),
    lower(NEW.email)
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

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
