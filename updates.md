# The Social Scene — Future Updates Roadmap

This file tracks improvements that are intentionally deferred until the platform has more users, events, operational complexity, or revenue volume.

## Recent Platform Updates (August 2026)

- **Multi-Role RBAC Architecture:** Deployed migrations `00016_dashboard_access_status_rbac.sql` and `00017_multi_role_rbac.sql`.
- **Concurrent Roles & Access Management:** System now supports users holding multiple roles concurrently (e.g. `HOST` + `ADMIN`) with fine-grained route protection (`DashboardRouteGuard`), access action controls (`AccessActionMenu`), and role management endpoints (`/api/roles`, `/api/hosts`, `/api/users`).

## Current Product Decisions

- Authentication remains Firebase-based.
- **Primary login:** mobile number → 2Factor OTP → Firebase.
- **Alternative login:** email → Firebase passwordless magic/login link.
- Google sign-in remains available as an additional Firebase provider.
- A user may browse and use the platform after email login without adding a phone number.
- A user who logs in through email and wants to book a ticket must add a mobile number to their account and verify it through **2Factor OTP** before booking.
- Phone-login users already have their verified number and do not need to repeat verification during booking.
- The verified booking phone number is retained on the user's profile so the team can contact the attendee if an event is cancelled or materially changed.
- The ticket model remains **one General ticket type per event** for the current stage.
- Razorpay remains the payment gateway.
- Supabase/PostgreSQL remains the system of record for profiles, events, registrations, orders, payments, tickets, attendance, and audit data.

## Stage 2 — Ticketing Expansion

Implement when individual events need different pricing or inventory tiers.

### Ticket Types

Move from:

```text
Event
└── General Ticket
```

to:

```text
Event
├── Early Bird
├── General
└── VIP
```

Planned capabilities:

- Ticket type name
- Description
- Price
- Capacity
- Sales start/end time
- Per-user purchase limit
- Active/inactive status
- Ticket-type-specific QR/pass metadata
- Inventory locking per ticket type

Do not implement until there is a real business requirement for multiple ticket tiers.

## Stage 2 — Booking & Inventory Improvements

- Stronger reservation/hold expiry handling
- Explicit inventory ledger
- Better concurrent-booking protection
- Registration timeout cleanup
- Failed-payment recovery
- Payment reconciliation dashboard
- Refund workflow
- Event cancellation workflow with attendee notification tracking

## Stage 2 — Customer Communication

Expand the current contact-phone requirement into a full communication layer.

Potential channels:

- SMS
- Email
- WhatsApp, subject to provider/business requirements

Capabilities:

- Event cancellation notifications
- Event time/venue changes
- Payment confirmations
- Ticket delivery
- Refund notifications
- Reminder notifications
- Communication history/audit trail

## Stage 2 — Promotions

When the platform starts running larger campaigns:

- Coupon codes
- Percentage discounts
- Fixed discounts
- Usage limits
- Per-user limits
- Expiry dates
- Event-specific coupons
- Campaign attribution

## Stage 2 — Host & Event Operations

- More granular host permissions
- Event-specific staff assignment
- Bulk attendee operations
- Bulk ticket cancellation/refund
- Event duplication/templates
- Scheduled publishing
- Scheduled registration opening/closing
- Advanced event analytics

## Stage 3 — Ticketing Marketplace Features

Only after the core booking model is stable at scale:

- Multiple ticket classes by default
- Dynamic pricing
- Waitlist automation
- Ticket transfers
- Resale/secondary ticketing, if legally and commercially appropriate
- Group bookings
- Add-ons
- Seat maps where relevant

## Stage 3 — Platform Scale & Architecture

- Formal shared backend package
- Remove duplicated legacy backend copies after dependency verification
- CI/CD quality gates
- Automated integration tests
- Payment contract tests
- End-to-end booking tests
- Centralized observability
- Error tracking
- Background job/queue infrastructure where required
- Rate-limit strategy by endpoint and risk level

## Deferred Architecture Cleanup

The repository currently contains duplicated copies of the backend package under:

- `backend/`
- `frontend/lib/backend/`
- `dashboard/lib/backend/`

The root `backend/` directory is the intended canonical location. The nested copies appear to be legacy/duplicated material and should not become a second source of truth.

Before deletion, verify there are no imports or build-time references to `@backend/*` or the nested directories. Then:

1. Remove the duplicate nested backend copies.
2. Remove obsolete `@backend/*` TypeScript path aliases.
3. Keep `backend/supabase/migrations/` as the canonical migration source.
4. Regenerate database types from the live Supabase schema.
5. Run frontend and dashboard production builds.
6. Verify authentication, checkout, payment, ticket generation, and scanner flows.

## Authentication Evolution

Do not migrate to Supabase Auth merely for architectural simplicity.

The current decision is to keep Firebase authentication and 2Factor phone verification.

If authentication is redesigned later, evaluate account linking carefully so users do not end up with duplicate identities across phone/email providers.

## Admin Subdomain

Target production separation:

```text
thesocialscene.club          → public website
admin.thesocialscene.club    → admin/dashboard application
```

The dashboard should be deployed as its own application/project rather than exposed under a public `/dashboard` path.

DNS and hosting configuration must point `admin.thesocialscene.club` to the dashboard deployment and use HTTPS.

## Operational Rule

Do not implement deferred roadmap items only because they are technically possible. Promote an item into the active development queue when there is a concrete product, revenue, operational, security, or scale requirement for it.
