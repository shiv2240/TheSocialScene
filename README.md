# The Social Scene — Event Discovery & Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-emerald?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

> **Official Brand Motto:** *Come Solo. Leave With Stories.*  
> **Domains:**  
> - Public Discovery Website: `https://thesocialscene.club`  
> - Admin & Host Operations Dashboard: `https://admin.thesocialscene.club`

---

## 📁 Repository Structure (Monorepo)

The codebase is organized into three clean, maintainable directories:

```
.
├── frontend/                     # Public Audience Discovery Site (thesocialscene.club)
│   ├── app/                      # Next.js App Router (Homepage, Events, Details, Phone OTP, Tickets)
│   ├── components/               # Navbar, Footer, EventCard, Layout UI
│   ├── lib/                      # Client utilities & backend service mirrors
│   └── package.json
│
├── dashboard/                    # Operations & Host Dashboard (admin.thesocialscene.club)
│   ├── app/                      # Overview, Events, 9-Section Wizard, Live Scanner, Registrations
│   ├── components/               # DashboardSidebar, DashboardHeader
│   ├── lib/                      # Dashboard utilities
│   └── package.json
│
└── backend/                      # Core Relational Database & Shared Business Logic
    ├── supabase/
    │   ├── migrations/           # 00001_initial_schema.sql (25 Tables), 00002_functions_triggers.sql
    │   └── seed.sql              # System roles, granular permissions, categories, venues
    ├── services/                 # Event, Ticket, Checkin, Payment, Notification, Analytics, Audit
    ├── lib/                      # Zod validation schemas & RBAC permission matrix
    └── types/                    # Shared DB TypeScript interfaces
```

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies

In the project root or inside each workspace directory:

```bash
# Frontend dependencies
cd frontend && npm install

# Dashboard dependencies
cd ../dashboard && npm install

# Backend dependencies
cd ../backend && npm install
```

### 2. Configure Environment Variables

Create `.env.local` inside `frontend/` and `dashboard/` using `.env.example` as reference:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://jkzlowhvromnaracfyja.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=***REMOVED***
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
```

### 3. Run Development Servers

Open two terminal windows:

#### Terminal 1 — Public Website (`http://localhost:3000`):
```bash
cd frontend
npm run dev
```

#### Terminal 2 — Admin Dashboard (`http://localhost:3001`):
```bash
cd dashboard
npm run dev -- -p 3001
```

---

## 🗄️ Database Migrations (Supabase PostgreSQL)

Apply the 3 SQL scripts in your **Supabase SQL Editor** in order:

1. `backend/supabase/migrations/00001_initial_schema.sql` — Creates 25 normalized tables & performance indexes.
2. `backend/supabase/migrations/00002_functions_triggers.sql` — Atomic `reserve_event_ticket()` capacity locks & RLS policies.
3. `backend/supabase/seed.sql` — Initial roles (`SUPER_ADMIN`, `HOST`, `CHECKIN_STAFF`), permissions matrix, categories & venues.

---

## 🔑 Key Features Built

- **GoFlow-Inspired Public Discovery:** High-impact hero, live scrolling ticker marquee, interactive vibe filters (`Mountain Treks`, `Sunset Runs`, `Acoustic Gigs`, `Tech Mixers`), and attendee avatar stacks.
- **Physical Ticket Stub & Barcode:** Digitally signed QR ticket passes (`TSS-2026-XXXXXXXX`) with notched tear cutouts and barcode toggles.
- **Multi-Section Event Creator Wizard:** 9-step administrative event configuration.
- **Live Event Check-in Scanner:** Dedicated operational scanner with camera feed simulation, manual ticket code input fallback, double check-in prevention, and real-time pass validation.
- **Role-Based Access Control (RBAC):** Server-enforced permissions for Admins, Hosts, and Check-in Staff.
