# The Social Scene — Current System Status

This document records the implemented platform state and current operational decisions. It is intentionally not a speculative product roadmap.

## Platform

- Public website and private dashboard are separate Next.js applications.
- Public production domain: `www.thesocialscene.club`.
- Dashboard production domain: `admin.thesocialscene.club`.
- Hosting: Vercel.
- Primary frontend region: Mumbai (`bom1`) with configured failover.

## Authentication

- Public identity: Firebase Authentication.
- Phone verification: 2Factor OTP.
- Google sign-in is available through Firebase.
- Server-side session cookie is established through `/api/auth/session`.
- Session establishment returns the user's profile so the Navbar does not race the profile API immediately after login.
- Dashboard authentication uses Supabase SSR authentication.

## Database

- Current system of record: Supabase PostgreSQL.
- Canonical migrations: `backend/supabase/migrations/`.
- RLS and RPC security are part of the authorization boundary.
- Firebase UID is associated with the application profile model.
- Booking, payment, ticket, attendance and audit data remain relational records.

## Ticketing & Payments

- Current event booking model uses the existing registration/order/payment/ticket domain.
- Razorpay is the payment gateway.
- Server-side payment verification is required.
- Razorpay webhook processing uses idempotency records.
- Digital tickets contain QR data for check-in and may include barcode presentation.
- Check-in is validated by the database-backed procedure and duplicate entry is rejected.

## Host Applications

- Public applications are submitted through `/become-a-host`.
- Records are persisted in `host_applications`.
- Administrative email notification is sent through Resend to `support@thesocialscene.club`.
- The Resend call is awaited; failures are logged and returned as an explicit warning rather than silently ignored.

## RBAC

The platform supports multiple roles per user. Current role concepts include:

- `SUPER_ADMIN`
- `ADMIN`
- `HOST`
- `CHECKIN_STAFF`
- `USER`

Access status is separately represented, including `ACTIVE`, `DEACTIVATED` and `SUSPENDED` states.

## Performance

Current performance measures include:

- Next.js App Router navigation.
- Idle route prefetching.
- Client router stale times.
- Public server/data caching.
- Public HTTP cache headers where safe.
- Next.js image optimization.
- Database indexes for event/search paths.
- Immediate route-level loading skeleton.
- Reduced authentication request races.

The intended goal is fast perceived navigation, with sub-200 ms achievable for suitable cached/prefetched routes rather than guaranteed for all requests.

## Analytics

- Frontend web telemetry uses GA4.
- Dashboard operational analytics use application/database data.
- GA4 is not a financial source of truth.
- A Google Analytics realtime provider authentication failure has been observed in the dashboard and remains an integration-health item to verify independently from database performance.

## Current Engineering Rules

- Do not expose database service-role credentials to clients.
- Do not trust client-side payment success as final confirmation.
- Do not bypass server-side RBAC with UI-only checks.
- Do not introduce a second database source of truth.
- Do not mark an email notification as successful without checking the provider response.
- Do not make public pages unnecessarily dynamic when their data can be cached.
- Do not regress the global floating/rounded Navbar behavior while changing individual pages.

## Documentation Policy

Architecture documentation should describe the system that is actually implemented. Future proposals must be clearly separated and explicitly labeled as future planning.

Mermaid diagrams are preferred for architecture and process visuals because they remain editable in Markdown. Stable UI screenshots may be stored under `docs/images/` when available.
