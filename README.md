# The Social Scene — Event Discovery & Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-emerald?logo=supabase)](https://supabase.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Phone_Auth-orange?logo=firebase)](https://firebase.google.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payments-blue?logo=razorpay)](https://razorpay.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

> **Official Brand Motto:** *Come Solo. Leave With Stories.*  
> **Production Domains:**  
> - Public Discovery Website: `https://thesocialscene.club`  
> - Admin & Host Operations Dashboard: `https://admin.thesocialscene.club`

---

## 📁 Repository Structure (Monorepo)

```
.
├── frontend/                     # Public Audience Discovery Site (thesocialscene.club)
│   ├── app/                      # Next.js App Router (Homepage, Events, Checkout, OTP, Tickets)
│   ├── components/               # Navbar, Footer, EventCard, ProfileEditor, TicketStubs
│   ├── lib/                      # Client utilities, Firebase SDK, Supabase admin & services
│   └── package.json
│
├── dashboard/                    # Operations & Host Dashboard (admin.thesocialscene.club)
│   ├── app/                      # Overview, Events, 9-Section Wizard, Scanner, Registrations
│   ├── components/               # DashboardSidebar, DashboardHeader
│   ├── lib/                      # Dashboard utilities & Supabase admin module
│   └── package.json
│
└── backend/                      # Core Relational Database & Shared Business Logic
    ├── supabase/
    │   ├── migrations/           # 00001 to 00009 SQL migrations (Schema, RLS, Auth, Razorpay)
    │   └── seed.sql              # System roles, granular permissions, categories, venues
    ├── services/                 # Event, Ticket, Checkin, Payment, Notification, Analytics, Audit
    ├── lib/                      # Zod validation schemas & RBAC permission matrix
    └── types/                    # Shared DB TypeScript interfaces
```

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies

In each workspace directory:

```bash
cd frontend && npm install
cd ../dashboard && npm install
```

### 2. Environment Setup

Copy `.env.example` to `frontend/.env.local` and `dashboard/.env.local`:

```bash
# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://jkzlowhvromnaracfyja.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=***REMOVED***
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SECRET_SERVICE_ROLE_KEY
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.jkzlowhvromnaracfyja.supabase.co:5432/postgres

# Firebase Phone Auth
NEXT_PUBLIC_FIREBASE_API_KEY=***REMOVED***
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=the-social-scene-2fd72.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=the-social-scene-2fd72

# 2Factor SMS OTP
TWOFACTOR_API_KEY=***REMOVED***
TWOFACTOR_OTP_TEMPLATE_NAME=The Social Scene OTP

# Razorpay Payments
RAZORPAY_KEY_ID=rzp_test_TTWSYM56qr5YYi
RAZORPAY_KEY_SECRET=***REMOVED***

# Resend Email Integration
RESEND_API_KEY=***REMOVED***

# Domains
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
```

### 3. Run Local Dev Servers

```bash
# Terminal 1 — Public Website (http://localhost:3000)
cd frontend && npm run dev

# Terminal 2 — Admin Dashboard (http://localhost:3001)
cd dashboard && npm run dev -- -p 3001
```

---

## 🗄️ Database Migrations (Supabase PostgreSQL)

Apply the migrations in `backend/supabase/migrations/` in sequence (00001 to 00009):

1. `00001_initial_schema.sql` — Initial 25 tables.
2. `00002_functions_triggers.sql` — Capacity lock function `reserve_event_ticket()`.
3. `00003_auth_profile_and_rls.sql` — Profiles & RLS policies.
4. `00004_public_event_access.sql` — Public experience visibility.
5. `00007_auth_hardening_and_dashboard_rbac.sql` — Dashboard access control.
6. `00008_firebase_phone_auth.sql` — Firebase phone auth bridge.
7. `00009_razorpay_and_checkin.sql` — Razorpay payment orders & checkin functions.

---

## ✨ Features Implemented

- **GoFlow Public Discovery:** Live ticker marquee, retro emblem hero, interactive vibe pills, attendee avatar stacks.
- **Firebase & 2Factor Phone Auth:** SMS OTP verification with automatic profile creation and session cookies.
- **Razorpay Payments & Tickets:** Order generation, payment verification, webhook handlers, and instant digital pass generation.
- **Physical Ticket Stub View:** Notched tear cutouts, barcode, QR code renderer, and seat metadata.
- **Admin Dashboard & Scanner:** Recharts telemetry, 9-step event wizard, camera check-in scanner, attendee exports.
- **Google Analytics Integration:** Built-in telemetry (`G-G4D8JB1ZBW`).
