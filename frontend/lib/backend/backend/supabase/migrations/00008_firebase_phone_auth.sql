-- Migration 00008: Firebase + external OTP authentication fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_firebase_uid ON public.profiles(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
