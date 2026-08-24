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

```text
.
├── frontend/                     # Public Audience Discovery Site (thesocialscene.club)
├── dashboard/                    # Operations & Host Dashboard (admin.thesocialscene.club)
└── backend/                      # Core Relational Database & Shared Business Logic
```

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies

```bash
cd frontend && npm install
cd ../dashboard && npm install
```

### 2. Environment Setup

Copy the application-specific templates:

```bash
copy frontend\.env.example frontend\.env.local
copy dashboard\.env.example dashboard\.env.local
```

Then replace every placeholder with the corresponding value from your local development credentials. **Never commit `.env.local` files or real secrets.**

Server-only credentials include Firebase Admin credentials, the Supabase service-role key, 2Factor API key, Razorpay secret/webhook secret, and Resend API key. These must never be exposed through `NEXT_PUBLIC_*` variables.

### 3. Run Local Dev Servers

```bash
# Terminal 1 — Public Website
cd frontend && npm run dev
# http://localhost:3000

# Terminal 2 — Admin Dashboard
cd dashboard && npm run dev -- -p 3001
# http://localhost:3001
```

---

## 🗄️ Database Migrations (Supabase PostgreSQL)

Apply the migrations in `backend/supabase/migrations/` in sequence (00001 to 00009):

1. `00001_initial_schema.sql` — Initial schema.
2. `00002_functions_triggers.sql` — Capacity lock function.
3. `00003_auth_profile_and_rls.sql` — Profiles & RLS policies.
4. `00004_public_event_access.sql` — Public experience visibility.
5. `00007_auth_hardening_and_dashboard_rbac.sql` — Dashboard access control.
6. `00008_firebase_phone_auth.sql` — Firebase phone auth bridge.
7. `00009_razorpay_and_checkin.sql` — Razorpay payment orders & check-in functions.

---

## ✨ Features Implemented

- **GoFlow Public Discovery:** Live ticker marquee, retro emblem hero, interactive vibe pills, attendee avatar stacks.
- **Firebase & 2Factor Phone Auth:** SMS OTP verification with automatic profile creation and session cookies.
- **Optional Email Verification:** Firebase handles email verification while the verified email is synchronized to the user's Supabase profile.
- **Razorpay Payments & Tickets:** Order generation, payment verification, webhook handlers, and digital pass generation.
- **Physical Ticket Stub View:** Barcode, QR code renderer, and seat metadata.
- **Admin Dashboard & Scanner:** Recharts telemetry, event wizard, camera check-in scanner, attendee exports.
- **Google Analytics Integration:** Built-in telemetry.

---

## 🔐 Security Rules

- Never commit `.env.local`, service-account JSON files, private keys, API secrets, or webhook secrets.
- Keep Firebase Admin, Supabase service-role, 2Factor, Razorpay Secret, Razorpay webhook, and Resend credentials server-side.
- Use test-mode Razorpay credentials for local payment testing.
- If a secret is accidentally committed, rotate/revoke it immediately and remove it from the repository.
