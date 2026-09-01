-- Migration 00018: Production query-performance indexes
--
-- These indexes target the most common public discovery, ticketing and
-- operational lookup patterns. They are intentionally narrow to avoid
-- unnecessary write amplification.

CREATE INDEX IF NOT EXISTS idx_events_published_featured_start
  ON events (status, featured, start_at);

CREATE INDEX IF NOT EXISTS idx_events_published_start
  ON events (status, start_at);

CREATE INDEX IF NOT EXISTS idx_events_category_start
  ON events (category_id, start_at);

CREATE INDEX IF NOT EXISTS idx_events_host_start
  ON events (host_id, start_at);

CREATE INDEX IF NOT EXISTS idx_events_venue_start
  ON events (venue_id, start_at);

CREATE INDEX IF NOT EXISTS idx_event_images_event_order
  ON event_images (event_id, display_order);

CREATE INDEX IF NOT EXISTS idx_event_hosts_event
  ON event_hosts (event_id);

CREATE INDEX IF NOT EXISTS idx_event_hosts_profile
  ON event_hosts (host_profile_id);

CREATE INDEX IF NOT EXISTS idx_event_schedules_event_start
  ON event_schedules (event_id, start_time);

CREATE INDEX IF NOT EXISTS idx_registrations_event_status
  ON registrations (event_id, status);

CREATE INDEX IF NOT EXISTS idx_registrations_user_created
  ON registrations (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_registration_items_registration
  ON registration_items (registration_id);

CREATE INDEX IF NOT EXISTS idx_tickets_user_status
  ON tickets (user_id, status);

CREATE INDEX IF NOT EXISTS idx_tickets_event_status
  ON tickets (event_id, status);

CREATE INDEX IF NOT EXISTS idx_tickets_registration
  ON tickets (registration_id);

CREATE INDEX IF NOT EXISTS idx_checkins_event_time
  ON checkins (event_id, checked_in_at DESC);

CREATE INDEX IF NOT EXISTS idx_checkins_user_time
  ON checkins (user_id, checked_in_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_user_status
  ON orders (user_id, status);

CREATE INDEX IF NOT EXISTS idx_payments_order
  ON payments (order_id);

CREATE INDEX IF NOT EXISTS idx_payments_status_created
  ON payments (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_refunds_payment
  ON refunds (payment_id);

CREATE INDEX IF NOT EXISTS idx_waitlists_event_status_position
  ON waitlists (event_id, status, position);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user
  ON coupon_redemptions (user_id, created_at DESC);
