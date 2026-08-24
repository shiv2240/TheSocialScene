# The Social Scene — Event Discovery & Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-emerald?logo=supabase)](https://supabase.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Phone_Auth-orange?logo=firebase)](https://firebase.google.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Test_Mode-blue)](https://razorpay.com/)

> **Official Brand Motto:** *Come Solo. Leave With Stories.*

**Production:** `https://thesocialscene.club`  
**Admin dashboard:** `https://admin.thesocialscene.club`

## Architecture

This repository is a monorepo:

```text
.
├── frontend/                     # Public Next.js application
│   ├── app/                      # Discovery, events, checkout, phone OTP, profile, tickets
│   ├── components/               # Navbar, footer, account and event UI
│   └── lib/                      # Firebase, Supabase and server utilities
├── dashboard/                    # Admin/host operations dashboard
│   ├── app/                      # Events, registrations, payments, scanner and analytics
│   └── components/               # Dashboard UI
└── backend/                      # Supabase migrations, services and shared types
```

## Authentication

The production user authentication model is **phone-first**:

```text
Mobile number
   ↓
2Factor SMS OTP
   ↓
OTP session verification
   ↓
Firebase user
   ↓
Firebase session cookie
   ↓
Supabase profile
```

Email is an **optional profile/contact field**. Adding an email does not change the user's phone-based authentication method. Email verification is tracked separately and is not assumed to be complete merely because an address was saved.

The navbar reads the authenticated Firebase session through the server-backed profile API and displays `Hi, <first name>` when the profile has a name. Profile updates notify the navbar immediately.

## Payments, Tickets and Attendance

The payment flow is designed around server-side Razorpay order creation and verification:

```text
Event registration
   ↓
Pending order
   ↓
Razorpay Checkout
   ↓
Signature verification
   ↓
Confirmed registration
   ↓
Ticket creation
   ↓
QR ticket
   ↓
Dashboard scanner
   ↓
Check-in / attendance
```

Razorpay test credentials must remain server-side. The webhook endpoint is `/api/payments/webhook`.

The dashboard contains a dedicated scanner and supports event-aware ticket validation and duplicate check-in prevention.

## Environment Variables

Never commit real secrets. Start from `frontend/.env.example` and configure the corresponding variables in Vercel for production.

### Public variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_ADMIN_URL`

### Server-only variables

- `TWOFACTOR_API_KEY`
- `TWOFACTOR_OTP_TEMPLATE_NAME`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

`SUPABASE_SERVICE_ROLE_KEY`, Firebase Admin credentials, 2Factor API credentials and Razorpay secrets must never be prefixed with `NEXT_PUBLIC_` or exposed to browser code.

## Local Development

```bash
cd frontend
npm install
npm run dev
```

The dashboard runs separately:

```bash
cd dashboard
npm install
npm run dev -- -p 3001
```

Use the environment template rather than copying production credentials into source control.

## Supabase

The database contains the event, registration, payment, ticket, check-in, profile, RBAC and audit primitives used by the applications. Apply migrations from `backend/supabase/migrations/` through the Supabase SQL Editor when provisioning a new project.

## Production Deployment

The public frontend is deployed through Vercel from the `main` branch. A push to `main` triggers a production deployment. After changing environment variables, trigger a fresh production deployment so the serverless functions receive the new values.

Before treating a release as production-ready, verify:

1. Phone OTP is delivered by the configured 2Factor SMS flow.
2. OTP verification creates/loads the Firebase user and establishes the Firebase session cookie.
3. Profile name and contact email can be saved independently of phone authentication.
4. Navbar changes from `Sign In` to the user's greeting.
5. Razorpay test order creation and payment signature verification succeed.
6. Confirmed payment creates a ticket and QR.
7. Dashboard scanner validates the ticket against the selected event.
8. Duplicate scans are rejected and attendance is recorded.
