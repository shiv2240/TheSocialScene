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

Email is an **optional profile/contact field**. It does not replace phone authentication. Email verification is handled through Firebase and the verified address is then synchronized to the user's Supabase profile.

The navbar reads the authenticated server-backed profile and displays `Hi, <first name>` when a name is available.

## Payments, Tickets and Attendance

```text
Event registration
   ↓
Pending order
   ↓
Razorpay Checkout (test mode locally)
   ↓
Server-side signature verification
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

Razorpay credentials and the webhook secret are server-only. The webhook endpoint is `/api/payments/webhook`.

## Environment Configuration

Never commit `.env.local` or real secrets. The repository contains separate templates for each application:

- Root: `.env.example` — complete reference list.
- Public frontend: `frontend/.env.example` → copy to `frontend/.env.local`.
- Dashboard: `dashboard/.env.example` → copy to `dashboard/.env.local`.

### Frontend variables

**Supabase**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (optional; migrations/CLI)

**Firebase**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

**OTP**
- `TWOFACTOR_API_KEY`
- `TWOFACTOR_OTP_TEMPLATE_NAME`

**Razorpay**
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

**Application / analytics**
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_ADMIN_URL`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_POSTHOG_KEY`

`SUPABASE_SERVICE_ROLE_KEY`, Firebase Admin credentials, 2Factor credentials and Razorpay secrets must never use `NEXT_PUBLIC_` or be exposed to browser code.

## Local Development

### 1. Public frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local` from `frontend/.env.example`, fill every required value, then run:

```bash
npm run dev
```

Open `http://localhost:3000`.

### 2. Dashboard

In a second terminal:

```bash
cd dashboard
npm install
```

Create `dashboard/.env.local` from `dashboard/.env.example`, then run:

```bash
npm run dev -- -p 3001
```

Open `http://localhost:3001`.

### 3. Local OTP test

The local frontend uses the real 2Factor account when `TWOFACTOR_API_KEY` is configured. OTP verification uses the session ID returned by 2Factor and the server-side Firebase/Supabase integrations.

### 4. Local payment test

Use **Razorpay Test Mode** credentials locally. Do not put live Razorpay credentials in local development unless explicitly required.

For webhook testing, use a reachable HTTPS tunnel if Razorpay needs to call your local `/api/payments/webhook` endpoint.

## Supabase

The database contains the event, registration, payment, ticket, check-in, profile, RBAC and audit primitives used by the applications. Apply migrations from `backend/supabase/migrations/` through the Supabase SQL Editor when provisioning a new project.

## Production Deployment

The public frontend is deployed through Vercel from the `main` branch. After changing environment variables, a fresh production deployment is required for serverless functions to receive the new values.

Before treating a release as production-ready, verify:

1. Phone OTP is delivered by 2Factor as SMS.
2. OTP verification succeeds using the 2Factor session ID.
3. Firebase authentication and the server session cookie are established.
4. Profile name and contact email can be saved independently of phone authentication.
5. Email verification updates Firebase and then Supabase.
6. Navbar changes from `Sign In` to the user's greeting.
7. Razorpay test order creation and payment signature verification succeed.
8. Confirmed payment creates a ticket and QR.
9. Dashboard scanner validates the ticket against the selected event.
10. Duplicate scans are rejected and attendance is recorded.
