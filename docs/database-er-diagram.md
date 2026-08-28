# Database Entity-Relationship (ER) Diagram & Architecture Specification

This document details the relational database schema for **The Social Scene** platform built on Supabase PostgreSQL.

---

## 🏗️ High-Level Relational Schema Overview

```mermaid
erDiagram
    profiles ||--o{ user_roles : "possesses"
    roles ||--o{ user_roles : "assigned"
    roles ||--o{ role_permissions : "includes"
    permissions ||--o{ role_permissions : "granted"

    profiles ||--o{ host_applications : "submits"
    profiles ||--o{ host_applications : "reviews"

    event_categories ||--o{ events : "classifies"
    venues ||--o{ events : "hosts"
    profiles ||--o{ events : "created_by"
    events ||--o{ event_hosts : "has_hosts"
    profiles ||--o{ event_hosts : "co_hosts"
    events ||--o{ event_images : "media"
    events ||--o{ event_schedules : "timeline"

    events ||--o{ registrations : "booked_in"
    profiles ||--o{ registrations : "registers"
    registrations ||--o{ registration_items : "breakdown"

    registrations ||--|| orders : "creates"
    profiles ||--o{ orders : "owns"
    orders ||--o{ payments : "processed_via"
    payments ||--o{ refunds : "refunded_via"

    registrations ||--o{ tickets : "generates"
    events ||--o{ tickets : "valid_for"
    profiles ||--o{ tickets : "holds"

    tickets ||--o| checkins : "verifies"
    events ||--o{ checkins : "venue_location"
    profiles ||--o{ checkins : "attendee"
    profiles ||--o{ checkins : "scanner_staff"

    tickets ||--o{ attendance_events : "tracks"
    events ||--o{ attendance_events : "tracks"
    profiles ||--o{ attendance_events : "attendee"

    events ||--o{ waitlists : "queue"
    profiles ||--o{ waitlists : "enrolled"

    coupons ||--o{ coupon_redemptions : "redeemed"
    profiles ||--o{ coupon_redemptions : "used_by"
    registrations ||--o{ coupon_redemptions : "applied"

    events ||--o{ reviews : "feedback"
    profiles ||--o{ reviews : "authored"

    profiles ||--o{ notifications : "sent_to"
    profiles ||--o{ audit_logs : "triggered_by"
```

---

## 🛡️ 1. User Identity & Multi-Role RBAC Domain

```mermaid
erDiagram
    profiles {
        uuid id PK
        uuid auth_user_id
        text full_name
        text phone
        text email
        text status
        boolean phone_verified
        boolean email_verified
    }
    roles {
        uuid id PK
        text name
        text description
        boolean is_system
    }
    permissions {
        uuid id PK
        text key
        text description
        text category
    }
    user_roles {
        uuid id PK
        uuid user_id FK
        uuid role_id FK
    }
    role_permissions {
        uuid id PK
        uuid role_id FK
        uuid permission_id FK
    }
    host_applications {
        uuid id PK
        uuid profile_id FK
        uuid reviewed_by FK
        text status
    }

    profiles ||--o{ user_roles : "has"
    roles ||--o{ user_roles : "assigned_to"
    roles ||--o{ role_permissions : "has"
    permissions ||--o{ role_permissions : "granted_to"
    profiles ||--o{ host_applications : "applies"
    profiles ||--o{ host_applications : "reviews"
```

---

## 🎪 2. Event Operations & Venue Management Domain

```mermaid
erDiagram
    event_categories {
        uuid id PK
        text name
        text slug
    }
    venues {
        uuid id PK
        text name
        text slug
        integer capacity
    }
    events {
        uuid id PK
        text title
        text slug
        uuid category_id FK
        uuid host_id FK
        uuid venue_id FK
        timestamp start_at
        timestamp end_at
        integer capacity
        numeric price
        text status
    }
    event_images {
        uuid id PK
        uuid event_id FK
        text image_url
    }
    event_hosts {
        uuid id PK
        uuid event_id FK
        uuid host_profile_id FK
        text role
    }
    event_schedules {
        uuid id PK
        uuid event_id FK
        text title
        timestamp start_time
        timestamp end_time
    }
    reviews {
        uuid id PK
        uuid event_id FK
        uuid user_id FK
        integer rating
        text comment
    }

    event_categories ||--o{ events : "categorizes"
    venues ||--o{ events : "located_at"
    events ||--o{ event_images : "gallery"
    events ||--o{ event_hosts : "hosts"
    events ||--o{ event_schedules : "itinerary"
    events ||--o{ reviews : "feedback"
```

---

## 🎟️ 3. Registrations, Ticketing & Venue Check-In Domain

```mermaid
erDiagram
    registrations {
        uuid id PK
        text registration_number
        uuid event_id FK
        uuid user_id FK
        text status
        numeric total_amount
    }
    registration_items {
        uuid id PK
        uuid registration_id FK
        text ticket_type
        numeric unit_price
        integer quantity
    }
    tickets {
        uuid id PK
        text ticket_code
        uuid registration_id FK
        uuid event_id FK
        uuid user_id FK
        text status
    }
    checkins {
        uuid id PK
        uuid ticket_id FK
        uuid event_id FK
        uuid user_id FK
        uuid checked_in_by FK
        timestamp checked_in_at
    }
    attendance_events {
        uuid id PK
        uuid ticket_id FK
        uuid event_id FK
        uuid user_id FK
        uuid scanned_by FK
        text type
    }
    waitlists {
        uuid id PK
        uuid event_id FK
        uuid user_id FK
        integer position
    }

    registrations ||--o{ registration_items : "contains"
    registrations ||--o{ tickets : "issues"
    tickets ||--o| checkins : "scanned"
    tickets ||--o{ attendance_events : "logs"
```

---

## 💳 4. Orders, Payments & Financial Operations Domain

```mermaid
erDiagram
    orders {
        uuid id PK
        uuid registration_id FK
        uuid user_id FK
        numeric amount
        text razorpay_order_id
        text status
    }
    payments {
        uuid id PK
        uuid order_id FK
        text provider
        text provider_payment_id
        numeric amount
        text status
    }
    refunds {
        uuid id PK
        uuid payment_id FK
        numeric amount
        text status
    }
    coupons {
        uuid id PK
        text code
        text discount_type
        numeric discount_value
    }
    coupon_redemptions {
        uuid id PK
        uuid coupon_id FK
        uuid user_id FK
        uuid registration_id FK
    }
    payment_webhook_events {
        uuid id PK
        text razorpay_event_id
        text event_type
        text status
    }

    orders ||--o{ payments : "payment_records"
    payments ||--o{ refunds : "refund_records"
    coupons ||--o{ coupon_redemptions : "redemptions"
```
