-- Server-side OTP session binding.
-- The browser receives only a random opaque token; the provider session ID
-- and verified phone number remain in this server-only table.

create table if not exists public.phone_otp_sessions (
  token_hash text primary key check (length(token_hash) = 64),
  firebase_uid text not null,
  phone text not null check (phone ~ '^\+91[6-9][0-9]{9}$'),
  provider_session_id text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists phone_otp_sessions_user_created_idx
  on public.phone_otp_sessions (firebase_uid, created_at desc);

create index if not exists phone_otp_sessions_expires_at_idx
  on public.phone_otp_sessions (expires_at);

alter table public.phone_otp_sessions enable row level security;
revoke all on table public.phone_otp_sessions from public, anon, authenticated;
grant select, insert, update, delete on table public.phone_otp_sessions to service_role;
