-- Public event listing is ordered by publication state and start time.
CREATE INDEX IF NOT EXISTS idx_events_published_start_at
  ON public.events (start_at)
  WHERE status = 'PUBLISHED';

CREATE INDEX IF NOT EXISTS idx_events_published_category_start_at
  ON public.events (category_id, start_at)
  WHERE status = 'PUBLISHED';

-- Trigram indexes make ILIKE '%term%' searches substantially cheaper.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_events_title_trgm
  ON public.events USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_events_short_description_trgm
  ON public.events USING gin (short_description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_events_description_trgm
  ON public.events USING gin (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_event_categories_name_trgm
  ON public.event_categories USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_event_categories_slug_trgm
  ON public.event_categories USING gin (slug gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_venues_name_trgm
  ON public.venues USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_venues_slug_trgm
  ON public.venues USING gin (slug gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_venues_address_trgm
  ON public.venues USING gin (address gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_venues_city_trgm
  ON public.venues USING gin (city gin_trgm_ops);

-- Composite lookup indexes for common user/payment/ticket operations.
CREATE INDEX IF NOT EXISTS idx_orders_user_status_created
  ON public.orders (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_order_created
  ON public.payments (order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_registrations_event_user_status
  ON public.registrations (event_id, user_id, status);

CREATE INDEX IF NOT EXISTS idx_registrations_user_created
  ON public.registrations (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tickets_user_status_created
  ON public.tickets (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_tag_mappings_event_tag
  ON public.event_tag_mappings (event_id, tag_id);
