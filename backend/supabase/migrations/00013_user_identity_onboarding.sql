-- Migration 00013: Stable public user identity + onboarding fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS age SMALLINT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_age_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_age_check CHECK (age IS NULL OR (age >= 13 AND age <= 120));

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique
  ON public.profiles (LOWER(username))
  WHERE username IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_social_username(p_full_name TEXT, p_profile_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_base TEXT;
  v_candidate TEXT;
BEGIN
  v_base := lower(trim(regexp_replace(coalesce(p_full_name, ''), '[^a-zA-Z0-9]+', '.', 'g')));
  v_base := trim(both '.' from v_base);
  IF v_base = '' THEN v_base := 'member'; END IF;
  v_base := left(v_base, 24);
  v_candidate := v_base || '_' || lower(substr(replace(p_profile_id::text, '-', ''), 1, 6));
  RETURN left(v_candidate, 32);
END;
$$;

UPDATE public.profiles
SET username = public.generate_social_username(full_name, id)
WHERE username IS NULL;

UPDATE public.profiles
SET onboarding_completed = TRUE
WHERE onboarding_completed = FALSE
  AND full_name IS NOT NULL
  AND trim(full_name) <> ''
  AND trim(full_name) <> 'The Social Scene Member';

CREATE OR REPLACE FUNCTION public.protect_completed_profile_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.onboarding_completed THEN
    IF NEW.full_name IS DISTINCT FROM OLD.full_name
       OR NEW.age IS DISTINCT FROM OLD.age
       OR NEW.username IS DISTINCT FROM OLD.username THEN
      RAISE EXCEPTION 'PROFILE_IDENTITY_IMMUTABLE';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_completed_profile_identity ON public.profiles;
CREATE TRIGGER trg_protect_completed_profile_identity
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_completed_profile_identity();
