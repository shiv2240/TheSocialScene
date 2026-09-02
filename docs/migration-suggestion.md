# The Social Scene — Supabase to Neon Migration Suggestion

**Status:** Planning only — no migration should be performed yet.

**Current production database:** Supabase PostgreSQL  
**Target database:** Neon PostgreSQL  
**Authentication:** Firebase remains the authentication provider.  
**Applications:** `frontend/` (public website) and `dashboard/` (operations/admin portal)

---

## 1. Objective

Move The Social Scene's PostgreSQL database workload from Supabase to Neon while preserving production data, IDs, relationships, constraints, indexes, database functions, triggers, payment integrity, ticketing behaviour, host applications, analytics, and dashboard RBAC.

This is a **database and data-access migration**, not an authentication migration. Firebase authentication remains in place. Supabase should remain available as the rollback source until the Neon production deployment has been fully verified.

---

## 2. Current Architecture

```text
Firebase Authentication
        |
        v
Next.js Frontend + Next.js Dashboard
        |
        v
Supabase PostgreSQL
```

The target architecture is:

```text
Firebase Authentication
        |
        v
Next.js Frontend + Next.js Dashboard
        |
        v
Neon PostgreSQL
```

The application should no longer depend on Supabase client/SSR libraries for database access after the migration is complete.

---

## 3. Why This Must Not Be a Simple URL Swap

The current system uses Supabase-specific functionality in addition to ordinary PostgreSQL:

- Supabase client and SSR database access
- Supabase admin/service-role access
- Row-Level Security policies
- `auth.uid()` inside PostgreSQL functions and policies
- `SECURITY DEFINER` functions
- PostgreSQL triggers
- PostgreSQL enums
- atomic ticket/capacity operations
- dashboard RBAC policies
- payment webhook protection

Neon provides PostgreSQL, but it does not reproduce Supabase Auth or Supabase's API/RLS execution model. Therefore Supabase-specific authorization must be moved into the application's authenticated server/API layer while preserving the existing authorization rules.

---

## 4. Migration Scope

### Core data

Preserve all production tables, records, UUIDs, timestamps, relationships and important metadata, including:

- `profiles`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `event_categories`
- `venues`
- `events`
- `event_images`
- `event_hosts`
- `event_schedules`
- `registrations`
- `registration_items`
- `tickets`
- `checkins`
- `attendance_events`
- `waitlists`
- `orders`
- `payments`
- `refunds`
- `coupons`
- `coupon_redemptions`
- `reviews`
- `notifications`
- `audit_logs`
- `payment_webhook_events`
- `host_applications`
- `event_tags`
- `event_tag_mappings`
- `event_wishlists`

### Database behaviour

Recreate or replace as appropriate:

- `updated_at` triggers
- event capacity locking
- pending registration creation
- paid registration confirmation
- ticket generation
- ticket check-in validation
- attendance logging
- username generation
- completed-profile identity protection
- payment webhook idempotency
- dashboard role/permission resolution
- relevant search indexes and PostgreSQL extensions
- foreign keys, unique constraints, check constraints and indexes

---

## 5. Authentication Strategy

**Do not migrate authentication to Neon as part of this project.**

Firebase remains the source of identity because the existing application already uses Firebase authentication and stores the Firebase identity against `profiles.firebase_uid`.

The target flow is:

```text
Firebase login
    |
    v
Firebase ID/session verification in Next.js
    |
    v
Resolve application profile by Firebase UID / auth identity
    |
    v
Check role + account status in Neon
    |
    v
Authorize request
    |
    v
Execute Neon query
```

No user IDs should be regenerated merely because the database provider changes.

---

## 6. Migration Phases

### Phase 0 — Freeze and backup

1. Record the current production schema and migration state.
2. Export the complete Supabase database.
3. Record table counts and important business totals.
4. Preserve a known-good Supabase rollback point.
5. Do not modify production application behaviour yet.

### Phase 1 — Build Neon schema

1. Create a Neon development branch/database.
2. Recreate PostgreSQL extensions required by the application.
3. Recreate enum types.
4. Recreate tables and relationships.
5. Recreate indexes and constraints.
6. Recreate compatible triggers and functions.
7. Replace Supabase-specific `auth.uid()` dependencies with application/server authorization where required.

### Phase 2 — Copy production data

1. Copy tables in dependency order.
2. Preserve UUID primary keys.
3. Preserve foreign-key relationships.
4. Preserve timestamps and business state.
5. Preserve payment and webhook records exactly.
6. Preserve roles and permissions.
7. Preserve host applications and their review state.

### Phase 3 — Data verification

Compare Supabase and Neon for:

- table count
- row count per table
- primary keys
- foreign-key relationships
- unique constraints
- enum values
- important indexes
- event counts
- registration counts
- ticket counts
- payment/order counts
- host application counts
- user/profile counts
- role assignments
- payment webhook events

Business-critical records must match before application cutover.

### Phase 4 — Application migration

Replace Supabase data access in both applications with a server-side Neon/PostgreSQL data layer.

Target principles:

- database credentials are server-only
- no `NEXT_PUBLIC_DATABASE_URL`
- no browser-to-Neon direct database connection
- all authenticated writes go through controlled server/API code
- authorization is checked before database mutations
- transactions are used for payment/ticket/capacity-critical operations
- existing API contracts should remain stable where possible

### Phase 5 — Testing

Test at minimum:

#### Website

- Google login
- phone authentication
- onboarding
- profile retrieval/update
- event listing
- category filtering
- event detail pages
- search
- wishlist
- checkout
- Razorpay order creation
- payment verification
- webhook processing
- ticket creation
- ticket wallet
- host application submission
- host application email notification

#### Dashboard

- dashboard login
- session establishment
- RBAC
- multi-role users
- user management
- event creation/editing
- host management
- registrations
- payments
- analytics
- host applications
- assigned users CRUD
- scanner
- check-in/check-out
- audit logs

### Phase 6 — Production cutover

1. Schedule a controlled cutover.
2. Temporarily prevent writes if required for a final consistency snapshot.
3. Perform final data synchronization.
4. Verify final row counts.
5. Change Vercel environment variables to Neon.
6. Deploy frontend and dashboard.
7. Run smoke tests against production.
8. Verify payment and webhook flows.
9. Verify authentication and RBAC.
10. Keep Supabase intact for rollback.

### Phase 7 — Rollback window

Do not delete or suspend the Supabase project immediately.

Keep it available until:

- production traffic is stable
- login is verified
- ticket purchases are verified
- Razorpay webhooks are verified
- dashboard RBAC is verified
- scanner/check-in is verified
- host applications are verified
- data integrity has been confirmed

Only then should Supabase retirement be considered.

---

## 7. Environment Variables After Migration

### Main Website

Remove Supabase database variables:

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Add:

```env
DATABASE_URL=<Neon pooled connection string>
DATABASE_URL_UNPOOLED=<Neon direct connection string, server/migration use only>
```

`DATABASE_URL_UNPOOLED` is optional if the deployment/migration workflow does not require it.

Keep existing non-Supabase variables such as Firebase, Firebase Admin, Razorpay, Resend, 2Factor, analytics and application URLs.

### Dashboard

Remove:

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Add:

```env
DATABASE_URL=<Neon pooled connection string>
DATABASE_URL_UNPOOLED=<Neon direct connection string, server/migration use only>
```

Keep existing Firebase, Resend and application URL configuration.

### Security rule

Never expose a Neon connection string through a `NEXT_PUBLIC_` variable. Database credentials must remain server-side.

---

## 8. Vercel Configuration

The applications are deployed on Vercel.

Environment variables must be updated separately for:

1. Main website project
2. Dashboard project

Apply the variables to the correct environments (`Production`, `Preview`, and `Development`) as required.

Do not remove the Supabase variables until the Neon-backed deployment has been built and verified, unless the code has already been switched completely to Neon.

---

## 9. Performance Considerations

Neon is not automatically faster simply because it is a different provider.

The application should be measured after migration for:

- connection acquisition latency
- database query latency
- Vercel-to-Neon round-trip latency
- cold-start behaviour
- pooled connection behaviour
- transaction latency
- search latency
- dashboard query latency

The current Vercel deployment is configured primarily for Mumbai (`bom1`), while the planned Neon project is in AWS Singapore. This geographic difference should be benchmarked before deciding whether the Neon region should change.

The existing application-level caching and Next.js navigation optimizations should remain intact during the database migration.

---

## 10. Critical Data Integrity Rules

The migration must never:

- regenerate production UUIDs
- lose payment records
- lose ticket records
- duplicate registrations
- duplicate webhook events
- change ticket codes
- change Razorpay order IDs
- break profile-to-Firebase mappings
- weaken dashboard authorization
- expose database credentials to the browser
- remove rollback capability before verification

For payment and ticket operations, database transactions and idempotency must be preserved.

---

## 11. Recommended Target Data Layer

A clean long-term structure is:

```text
frontend/
  lib/
    db/
      client.ts
      queries/
      transactions/
      repositories/

dashboard/
  lib/
    db/
      client.ts
      queries/
      transactions/
      repositories/
```

Prefer a single shared database package if the monorepo architecture permits it, so frontend and dashboard use the same database primitives and transaction semantics.

The database layer should use a PostgreSQL-compatible driver/ORM only where it improves maintainability. Avoid introducing an ORM solely for the migration if the existing SQL model is already well-defined.

---

## 12. Supabase-Specific Code to Remove

Search the entire repository for:

```text
@supabase/supabase-js
@supabase/ssr
createClient(
createServerClient(
SUPABASE_
auth.uid()
service_role
supabase.from(
supabase.rpc(
```

Every occurrence should be classified as:

1. database access to migrate
2. authentication logic to retain/replace with Firebase
3. documentation to update
4. migration history that should remain as historical reference

Historical migration files do not need to be rewritten merely to erase their history. New Neon migration files should clearly document the target schema and replacement behaviour.

---

## 13. Documentation Updates

Once the migration actually begins, update documentation to distinguish:

- current production state
- migration state
- target architecture
- Neon environment variables
- Firebase authentication architecture
- database migration procedure
- rollback procedure
- production verification checklist

Do not describe Neon as production until the cutover has been completed and verified.

---

## 14. Final Acceptance Checklist

Before declaring the migration complete:

- [ ] Neon schema matches production requirements
- [ ] All required extensions exist
- [ ] All required enums exist
- [ ] All tables migrated
- [ ] All production records migrated
- [ ] IDs preserved
- [ ] Foreign keys verified
- [ ] Unique/check constraints verified
- [ ] Indexes verified
- [ ] Triggers verified
- [ ] Database functions verified
- [ ] Firebase authentication works
- [ ] Website profile flow works
- [ ] Dashboard authentication works
- [ ] RBAC works
- [ ] Event CRUD works
- [ ] Registration flow works
- [ ] Razorpay order flow works
- [ ] Razorpay webhook flow works
- [ ] Ticket generation works
- [ ] Scanner/check-in works
- [ ] Host applications work
- [ ] Host application email works
- [ ] Analytics works
- [ ] Search works
- [ ] Wishlist works
- [ ] Audit logging works
- [ ] Production latency benchmark completed
- [ ] Vercel Production variables updated
- [ ] Production smoke test completed
- [ ] Supabase rollback source retained
- [ ] Final rollback window completed

---

## 15. Decision

**For now: do nothing to production.**

Keep Supabase as the active production database. This document is the migration plan to use later when the Neon cutover is intentionally started.

The migration should be executed as a staged, reversible change rather than a single deployment.
