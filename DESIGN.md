# The Social Scene — Comprehensive UI/UX & Layout Architecture (`DESIGN.md`)

This document serves as the **authoritative UI layout reference** for **The Social Scene** monorepo. It details the precise component structure, section placements, wireframe blueprints, design tokens, and interactive elements across both applications:

1. **Public Discovery Website (`frontend`)** — Target Domain: `https://thesocialscene.club`
2. **Operations & Host Dashboard (`dashboard`)** — Target Domain: `https://admin.thesocialscene.club`

Use this reference when requesting UI modifications or feeding layout context to AI assistants.

---

## 🎨 1. Design System & Theme Tokens

### Color Palette

| Token Name | Hex Code | Purpose / Application |
| :--- | :--- | :--- |
| **Dark Canvas (Background)** | `#141217` | Primary page background for Frontend |
| **Dashboard Canvas** | `#0b0f19` | Deep navy background for Operations Dashboard |
| **Terracotta Primary Accent** | `#c85a3c` | Primary brand CTA buttons, borders, highlights |
| **Terracotta Light Text** | `#f0a07f` | Highlighted text in badges, active pill text |
| **Amber Secondary Accent** | `#e59838` | Badges, warnings, status indicators, secondary CTAs |
| **Glass Card Background** | `rgba(255, 255, 255, 0.03)` | Semi-transparent card containers |
| **Glass Card Border** | `rgba(255, 255, 255, 0.10)` | Subtle glowing border for dark-mode cards |
| **Text Primary** | `#ffffff` / `#f3f4f6` | Headings, primary text |
| **Text Muted** | `#9ca3af` / `#6b7280` | Subtitles, helper text, labels |

### Glassmorphism & UI Card Specs
```css
/* Card Container Utility */
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem; /* 24px */
}

/* Gradient Primary Button */
.gradient-terracotta {
  background: linear-gradient(135deg, #c85a3c 0%, #a44327 100%);
}
```

---

## 📱 2. Frontend Application (`thesocialscene.club`)

### Global Layout Wrapper ([`frontend/app/layout.tsx`](file:///D:/Freelance/Project-12%20%28TheSocialScene/frontend/app/layout.tsx))
- **HTML Container:** `<html lang="en" className="h-full dark" suppressHydrationWarning>`
- **Body Wrapper:** `<body className="min-h-full flex flex-col bg-[#141217] text-gray-100 antialiased" suppressHydrationWarning>`
- **Top Header:** `<Navbar />` (Sticky navigation bar)
- **Main Viewport:** `<main className="flex-1">`
- **Bottom Footer:** `<Footer />` (4-column site footer + copyright)

---

### Page 1: Home / Landing Page (`/`)

#### ASCII Layout Wireframe
```text
+-----------------------------------------------------------------------+
| NAVBAR: [Logo] "The Social Scene"      [Events] [Hosts]  [My Passes]  |
+-----------------------------------------------------------------------+
| TICKER MARQUEE:  🔥 Sunset Run Club · Rooftop Acoustic Gigs · Treks   |
+-----------------------------------------------------------------------+
| HERO SECTION:                                                         |
|   [Badge: Come Solo. Leave With Stories]                              |
|   Heading: Curated Social Experiences for Modern Explorers            |
|   Subtext: Escape digital fatigue. Authentic human connections.        |
|   Search Bar: [ 🔍 Search events, cities or vibes... ]  [ Explore ]   |
|   Vibe Pills:  (All) (Run Club) (Acoustic) (Treks) (Mixers) (Culinary)|
+-----------------------------------------------------------------------+
| FEATURED EXPERIENCE CARDS GRID (3 Columns):                           |
|  +---------------------+ +---------------------+ +------------------+ |
|  | [ Image Cover ]     | | [ Image Cover ]     | | [ Image Cover ]  | |
|  | Tag: Sunset Run     | | Tag: Acoustic Gig   | | Tag: Mountain Trek| |
|  | Title: Cubbon Run   | | Title: Rooftop Jam  | | Title: Western Ghat| |
|  | 📅 Sat, 6:00 AM     | | 📅 Sun, 7:00 PM     | | 📅 Fri - Sun   | |
|  | 📍 Indiranagar      | | 📍 Koramangala      | | 📍 Chikmagalur  | |
|  | 🎟️ ₹499             | | 🎟️ ₹799             | | 🎟️ ₹3,499      | |
|  | [ Book Ticket ]     | | [ Book Ticket ]     | | [ Book Ticket ]  | |
|  +---------------------+ +---------------------+ +------------------+ |
+-----------------------------------------------------------------------+
| QUOTE WALL & COMMUNITY REVIEWS                                        |
|   "Met my weekend running squad here." — Ananya R., Bengaluru         |
+-----------------------------------------------------------------------+
| FOOTER: [Logo] [Community Links] [Host Operations] [Platform Links]   |
+-----------------------------------------------------------------------+
```

---

### Page 2: Events Discovery Page (`/events`)

#### Section Breakdown & Elements
1. **Header Filter Bar:**
   - Text Search Input (filters title, description, city, venue).
   - Category Pills (horizontal scrollable tags: `All`, `Treks`, `Fitness`, `Music`, `Networking`).
   - City Dropdown (`Bengaluru`).
2. **Events Grid Container:**
   - 3-column responsive layout (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
   - Empty state fallback illustration when no events match search filters.
3. **Event Card Component (`EventCard.tsx`):**
   - Cover Image with Category Overlay Tag.
   - Spot Availability Pill: e.g., `⚡ 6 spots left`.
   - Title, Date/Time Badge, Location/Venue Name.
   - Price Display (`₹XXX` or `Free`).
   - CTA Button: `Book Ticket` → routes to `/events/[id]`.

---

### Page 3: Event Details & Booking Page (`/events/[id]`)

#### Layout Architecture
- **Desktop Grid:** 2-column layout (`grid-cols-1 lg:grid-cols-[1.5fr_1fr]`).
- **Left Column (Content Area):**
  - Cover Image Banner with gradient overlay.
  - Category Badge & Host Identity (`Hosted by: {Host Name}`).
  - Event Title (`h1`) & Date/Time & Full Venue Address.
  - Event Description & Highlight Bullet Points.
  - Host Bio & Guidelines / Instructions for Attendees.
- **Right Column (Sticky Booking Sidebar Container):**
  - Ticket Pricing Card (Glassmorphism card, `sticky top-24`).
  - Price per ticket & Capacity counter (`Spots remaining`).
  - Quantity Selector (`- 1 +`).
  - Total Amount Calculation (`Price × Quantity`).
  - `Proceed to Checkout` button → routes to `/checkout?eventId=...&qty=...`.
- **Mobile Viewport Sticky Footer:**
  - Fixed bottom bar on mobile (`fixed bottom-0 left-0 right-0 z-40 bg-[#141217]/95 border-t border-white/10`).
  - Displays total price + `Book Now` button for instant access on small screens.

---

### Page 4: Become a Host Page (`/become-a-host`)

#### Layout Breakdown
- **Hero Intro:** `ShieldCheck` badge + Title: *"Turn your community into an experience."*
- **Left Sticky Sidebar (Host Benefits):**
  - Card 1: *Own your community* (Icon + Text).
  - Card 2: *Run events from one dashboard* (Icon + Text).
  - Card 3: *Controlled access & host isolation* (Icon + Text).
- **Right Form Container (Application Form):**
  - Full Name, Email Address, Phone Number, City, Organization / Community Name.
  - Expected Frequency Input (e.g. 2 events / month).
  - Event Types Multi-Select Pill Toggle (`Social`, `Music`, `Fitness`, `Treks`, etc.).
  - Experience & Proposed Event Textareas.
  - Why Host Textarea (Min 20 characters required).
  - Instagram Handle & Website Link Inputs.
  - Honeypot Spam Protection Field (hidden).
  - `Submit Host Application` Button.

---

### Page 5: Checkout & Payment Page (`/checkout`)

#### Step-by-Step Flow Structure
1. **Order Summary Header:** Event title, date, venue, selected quantity, price breakdown.
2. **Attendee Information Form:**
   - Full Name, Email, Phone Number.
   - Mobile OTP Verification Drawer (if user is not logged in via phone).
3. **Payment Trigger:**
   - Integrates Razorpay Modal (`Razorpay.open()`).
   - Success state triggers automated pass issuance and routes to `/tickets`.

---

### Page 6: Digital Pass & Ticket Stub (`/ticket/[ticketCode]`)

#### Physical Ticket Visual Aesthetics
```text
+-----------------------------------------------------------------------+
|  THE SOCIAL SCENE · OFFICIAL DIGITAL PASS                             |
|  =============================================================        |
|  EVENT:  Sunset Run Club & Filter Coffee Social                       |
|  DATE:   Saturday, 28 Aug 2026 · 06:00 AM                           |
|  VENUE:  Cubbon Park Main Gate, Bengaluru                             |
|  NAME:   Aarav Sharma                                                 |
|  PASS:   #TSS-2026-8942                                               |
|  -------------------------------------------------------------        |
|  ( ) [TEAR NOTCH]                                     [TEAR NOTCH] ( )|
|  -------------------------------------------------------------        |
|  ATTENDEE QR CODE:                                                    |
|        +-------------------+                                          |
|        |  [ QR CODE IMG ]  |                                          |
|        |   SCAN AT ENTRY   |                                          |
|        +-------------------+                                          |
|  BARCODE: |||| ||| ||||| || |||||| ||| |||||||                       |
+-----------------------------------------------------------------------+
```

---

## 🛠️ 3. Operations & Host Dashboard (`admin.thesocialscene.club`)

### Global Dashboard Shell ([`dashboard/app/(dashboard)/layout.tsx`](file:///D:/Freelance/Project-12%20%28TheSocialScene/dashboard/app/%28dashboard%29/layout.tsx))

#### Layout Structure & Navigation Tree
- **Left Collapsible Sidebar Container (`DashboardSidebar.tsx`):**
  - Brand Logo + Header (`The Social Scene Admin`).
  - Navigation Sections:
    - 📊 `Overview / Analytics` (`/`)
    - 📅 `Event Management` (`/events`)
    - 📷 `QR Scanner` (`/checkin`)
    - 🎟️ `Registrations` (`/registrations`)
    - 👥 `Users & RBAC` (`/users`) — *Visible to Super Admins / Admins*
    - 💰 `Payments & Orders` (`/payments`)
    - 📜 `Audit Logs` (`/audit-logs`)
    - ⚙️ `Settings` (`/settings`)
  - User Status Footer: User Name, Assigned Role Badge (`SUPER_ADMIN`, `HOST`, etc.), Logout button.
- **Top Header Bar:**
  - Route Breadcrumb indicator.
  - Active Role Pill (e.g. `SUPER_ADMIN`).
  - Environment Status Indicator (`Local` / `Production`).
- **Main Viewport Area:** `<DashboardRouteGuard>{children}</DashboardRouteGuard>`

---

### Page 1: Overview & Analytics (`/`)

#### Dashboard Cards & Charts Grid
1. **Summary KPI Grid (4 Cards):**
   - Total Gross Revenue (`₹XXX,XXX`)
   - Total Tickets Sold (`XXX`)
   - Active Live Events (`X`)
   - Checked-in Attendees (`XXX`)
2. **Recharts Visualizations:**
   - Chart 1: Revenue Trend Line Chart.
   - Chart 2: Event Registration Volume Bar Chart.
3. **Recent Activity Feed Table:**
   - Recent ticket sales, host applications, check-in timestamps.

---

### Page 2: Event Management & Creation (`/events`, `/events/create`)

#### Event List Table View (`/events`)
- Columns: `Cover Thumb`, `Event Title`, `Date & Time`, `Venue`, `Host`, `Capacity Progress Bar`, `Status Tag` (`DRAFT`, `PUBLISHED`, `CANCELLED`), `Actions`.
- Actions: `Edit`, `View Details`, `Toggle Publish`, `Delete`.

#### Multi-Step Event Creation Wizard (`/events/create`)
9 Step Sections:
1. **Basic Info:** Title, Tagline, Short Summary.
2. **Category & Vibe:** Primary category, vibe tag pills.
3. **Schedule & Time:** Start Date/Time, End Date/Time, Timezone.
4. **Venue Details:** Venue Name, Full Address, City, Google Maps Embed URL.
5. **Capacity & Pricing:** Total Capacity seats, Ticket Price (`₹`), Seat locks.
6. **Media Upload:** Cover Image file upload / URL input, gallery photos.
7. **Host Assignment:** Dropdown selecting host profile assigned to event.
8. **Instructions & Rules:** Attendee guidelines, age limits, refund terms.
9. **Preview & Publish:** Summary card review before publishing.

---

### Page 3: QR Code Check-in Scanner (`/checkin`, `/scanner`)

#### Operational View Layout
- **Camera Scanner Container:** HTML5 Camera feed with scanning frame overlay.
- **Manual Code Input Fallback:** TextInput for typing ticket code (`TSS-XXXX-XXXX`) when camera is unavailable.
- **Verification Result Banner:**
  - `VALID PASS (Green)` — Shows Attendee Name, Ticket Code, Event Title, Check-in Timestamp.
  - `ALREADY CHECKED-IN (Amber Warning)` — Prevents double entry, displays prior check-in time.
  - `INVALID PASS (Red Alert)` — Ticket code not found or cancelled.
- **Live Stream Stream Feed:** Live list of scanned attendees in current event session.

---

### Page 4: User & RBAC Access Management (`/users`)

#### Layout Architecture
- **Summary Cards Header:** Total Dashboard Users, Pending Host Applications, Host Accounts.
- **Tab 1: Team Users Table:**
  - Columns: `User Name & Email`, `Role Tag` (`SUPER_ADMIN`, `ADMIN`, `HOST`, `CHECKIN_STAFF`, etc.), `Access Description`, `Account Status`, `Created Date`, `Action Button`.
  - **Edit User Button:** Opens `Edit User & Role` Modal.
- **Tab 2: Host Applications Table:**
  - Columns: `Applicant Name & Email`, `Host Profile / Organization`, `Event Direction / Vibe`, `Status Badge` (`PENDING`, `APPROVED`, `REJECTED`), `Action Buttons`.
  - **Review Application:** View full applicant details modal, click `Approve & Invite` or `Reject`.
- **Modal 1: Create Dashboard User Invitation:**
  - Inputs: Full Name, Email, Phone, Role dropdown.
  - Action: Triggers Resend API invitation email with secure activation link.
- **Modal 2: Edit User & Role Modal:**
  - Inputs: Full Name, Phone, Role Dropdown (`Super Admin`, `Admin`, `Host`, `Event Manager`, `Check-in Staff`, `Editor`, `Finance`, `Support`), Account Status (`ACTIVE`, `SUSPENDED`).
  - Action: Calls `PATCH /api/users` to immediately update DB profiles and `user_roles`.

---

## 📌 4. Component Placement Quick Reference

| Component / View | File Path | Layout Container / Position |
| :--- | :--- | :--- |
| **Public Navbar** | [`frontend/components/layout/Navbar.tsx`](file:///D:/Freelance/Project-12%20%28TheSocialScene/frontend/components/layout/Navbar.tsx) | Sticky top of viewport across all public pages |
| **Public Footer** | [`frontend/components/layout/Footer.tsx`](file:///D:/Freelance/Project-12%20%28TheSocialScene/frontend/components/layout/Footer.tsx) | Bottom of viewport across all public pages |
| **Event Card** | [`frontend/components/event/EventCard.tsx`](file:///D:/Freelance/Project-12%20%28TheSocialScene/frontend/components/event/EventCard.tsx) | 3-column grid container in `/` and `/events` |
| **Ticket Pass Stub** | [`frontend/app/(account)/ticket/[ticketCode]/page.tsx`](file:///D:/Freelance/Project-12%20%28TheSocialScene/frontend/app/%28account%29/ticket/%5BticketCode%5D/page.tsx) | Centered glass ticket container with tear notches |
| **Dashboard Sidebar** | [`dashboard/components/layout/DashboardSidebar.tsx`](file:///D:/Freelance/Project-12%20%28TheSocialScene/dashboard/components/layout/DashboardSidebar.tsx) | Fixed left navigation panel on all `/admin` routes |
| **Camera Scanner** | [`dashboard/app/(dashboard)/checkin/page.tsx`](file:///D:/Freelance/Project-12%20%28TheSocialScene/dashboard/app/%28dashboard%29/checkin/page.tsx) | Main operational focus view on `/checkin` |
| **Users & Role Table** | [`dashboard/app/(dashboard)/users/page.tsx`](file:///D:/Freelance/Project-12%20%28TheSocialScene/dashboard/app/%28dashboard%29/users/page.tsx) | Main table container on `/users` tab |
