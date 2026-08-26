# The Social Scene — QA & Production Hardening Audit

**Audit date:** 2026-08-26  
**Scope:** public website, authentication, booking, Razorpay test flow, ticketing, attendance, dashboard, Supabase database/security, event creation and media handling.

## Executive status

The application is not yet certified as a fully end-to-end production release because authenticated browser execution and Razorpay test checkout cannot be driven from the current agent environment. The code/database audit has nevertheless identified and fixed several production-critical issues.

| Area | Status | Notes |
|---|---|---|
| Firebase + 2Factor authentication | PASS (code) | Mobile OTP remains primary; email magic-link remains supported. |
| Email-only user booking contact | PASS (code) | Booking now requires a verified mobile number. |
| 2Factor account phone linking | PASS (code) | Dedicated authenticated flow exists; duplicate phone ownership is blocked. |
| Razorpay signature verification | PASS (code) | HMAC validation plus provider-side payment lookup. |
| Razorpay amount/currency/order validation | PASS (code) | Exact order, amount, currency and captured status checked. |
| Razorpay webhook idempotency | HARDENED | Duplicate events protected; stale PROCESSING records can recover. |
| Registration race conditions | HARDENED | Unique active registration constraint + race-safe RPC. |
| Ticket generation | PASS (code) | Ticket created only through server-side confirmation RPC. |
| QR payload | PASS (code) | Ticket code is the server-owned QR payload. |
| Check-in authorization | PASS (code) | Dashboard API checks staff roles before calling the DB function. |
| Duplicate check-in | PASS (code) | DB row lock + existing check-in check. |
| Admin event listing | PASS (code) | Reads real database events. |
| Admin event publishing | PASS (code) | Server-side role validation and audit logging. |
| Admin Create Event | FIXED | Replaced mock-only wizard with real API persistence. |
| Event image upload | FIXED | Added authenticated server-side upload to `event-images`, 5 MB limit and MIME allowlist. |
| Supabase DB security | HARDENED | Privileged RPCs restricted previously; remaining advisor items documented below. |
| Supabase performance | HARDENED | Missing FK indexes added; RLS init-plan warnings fixed. |
| Vercel dashboard build | BLOCKED FROM AGENT | Connected Vercel API does not expose the dashboard project; local network cannot reach GitHub. |
| Authenticated browser UAT | BLOCKED FROM AGENT | Requires the user's browser session/device. |

## Critical findings fixed

### 1. Booking could previously attach an unverified phone

The booking API accepted a syntactically valid 10-digit number and stored it before payment. The frontend displayed OTP verification, but the server did not enforce `phone_verified`.

**Fixed:** `/api/payments/create-order` now requires:

- profile exists;
- `phone` exists;
- `phone_verified = true`;
- request phone exactly matches the verified profile phone.

### 2. Email/Google users need a distinct phone-linking flow

The existing account-phone OTP endpoints operate against the currently authenticated Firebase user. This prevents a phone OTP from accidentally switching an email user's account to a different Firebase phone identity.

### 3. Event creation was a mock UI

The previous dashboard Create Event wizard only displayed an alert and redirected. It did not persist events.

**Fixed:** added authenticated `/api/events/create` with:

- role authorization;
- Zod validation;
- slug uniqueness check;
- date ordering validation;
- registration deadline validation;
- venue creation;
- event creation;
- publish/draft support;
- audit logging;
- rollback of a newly-created venue when event creation fails.

### 4. Event image upload was not implemented

The previous wizard accepted an image URL rather than an actual upload.

**Fixed:** added `/api/events/upload-image`:

- authenticated dashboard user required;
- event-management role required;
- JPG/PNG/WebP only;
- maximum 5 MB;
- random non-colliding object path;
- server-side Supabase Storage upload;
- public URL returned for event cover use.

A public `event-images` bucket was created in Supabase. Uploads remain server-side using the service role.

### 5. Registration concurrency

Two simultaneous checkout attempts could both create PENDING registrations before the application checked for an existing record.

**Fixed:** unique partial index:

`registrations(event_id, user_id) WHERE status IN ('PENDING','CONFIRMED')`

The `create_pending_registration` RPC now catches the race and returns the existing registration instead of surfacing a duplicate-key failure.

### 6. Webhook PROCESSING lock recovery

A webhook could become permanently stuck in `PROCESSING` if the function crashed after claiming the event.

**Fixed:** recent PROCESSING events remain protected against duplicate concurrent delivery; PROCESSING records older than 10 minutes become retryable.

## Database hardening applied

- Added indexes for previously unindexed foreign keys reported by Supabase Performance Advisor.
- Optimized profile/registration/ticket RLS policies to evaluate `auth.uid()` through a statement-level subquery.
- Added active-registration uniqueness protection.
- Added `event-images` Storage bucket.

## Remaining Supabase advisor items

### WARN — `get_my_dashboard_role()` SECURITY DEFINER exposed to authenticated users

This remains under review because existing dashboard code may still depend on the RPC. It should ultimately be removed from the exposed API surface once all callers are migrated to server-only role resolution.

### WARN — leaked password protection disabled

This is an Auth project configuration setting. It should be enabled in Supabase Auth settings before public launch.

### INFO — RLS enabled without policies

Several server-only tables intentionally have no client policies. This is preferable to creating broad policies merely to silence the advisor. The application uses server-side service-role access for these operations.

## Known UAT blockers

The agent cannot safely perform the following without the user's authenticated browser/device:

1. Complete dashboard login in the user's browser.
2. Upload a real image through the dashboard UI.
3. Create a real production event through the UI.
4. Run a Razorpay test checkout requiring the user's browser/payment simulation.
5. Scan a generated QR code using a physical/device camera.

These are **not marked PASS** until manually exercised.

## Recommended UAT sequence

1. Dashboard login.
2. Create a draft event.
3. Upload JPG/PNG/WebP cover under 5 MB.
4. Save draft and verify it appears in Events.
5. Publish event.
6. Open public event page.
7. Log in with email magic link.
8. Attempt checkout without phone — must be blocked.
9. Add phone and complete 2Factor OTP — must attach phone to the same account.
10. Create Razorpay test order.
11. Complete test payment.
12. Verify server-side payment confirmation.
13. Verify registration + General ticket + QR ticket.
14. Open dashboard guest list.
15. Scan QR once — CHECK_IN.
16. Scan same QR again — ALREADY_CHECKED_IN.
17. Try wrong event — WRONG_EVENT.
18. Try malformed/unknown ticket — INVALID_TICKET.
19. Verify ticket status becomes USED.
20. Verify audit/attendance record.

## Release recommendation

**Current classification: NOT YET FULLY CERTIFIED.**

The server/database architecture is materially stronger after this hardening pass, but release certification requires the final authenticated UAT sequence above, especially event creation/image upload, Razorpay test payment, ticket generation, and physical QR scanning.
