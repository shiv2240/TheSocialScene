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

-- Collapse event/category/venue/tag search into one database round-trip.
CREATE OR REPLACE FUNCTION public.search_published_events(
  p_query TEXT DEFAULT '',
  p_category_slug TEXT DEFAULT 'all',
  p_limit INTEGER DEFAULT 9,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  short_description TEXT,
  capacity INTEGER,
  registered_count INTEGER,
  registration_open BOOLEAN,
  price NUMERIC,
  currency VARCHAR(3),
  cover_image TEXT,
  start_at TIMESTAMPTZ,
  category JSONB,
  venue JSONB,
  total_count BIGINT
)
LANGUAGE SQL
STABLE
AS $$
  WITH filtered AS (
    SELECT
      e.id,
      e.title,
      e.slug,
      e.short_description,
      e.capacity,
      e.registered_count,
      e.registration_open,
      e.price,
      e.currency,
      e.cover_image,
      e.start_at,
      c.id AS category_id,
      c.name AS category_name,
      c.slug AS category_slug,
      c.display_order AS category_display_order,
      v.id AS venue_id,
      v.name AS venue_name,
      v.slug AS venue_slug,
      v.address AS venue_address,
      v.city AS venue_city,
      v.capacity AS venue_capacity
    FROM public.events e
    LEFT JOIN public.event_categories c ON c.id = e.category_id
    LEFT JOIN public.venues v ON v.id = e.venue_id
    WHERE e.status = 'PUBLISHED'
      AND (
        COALESCE(p_category_slug, 'all') = 'all'
        OR c.slug = p_category_slug
      )
      AND (
        NULLIF(BTRIM(p_query), '') IS NULL
        OR e.title ILIKE '%' || BTRIM(p_query) || '%'
        OR e.short_description ILIKE '%' || BTRIM(p_query) || '%'
        OR e.description ILIKE '%' || BTRIM(p_query) || '%'
        OR COALESCE(c.name, '') ILIKE '%' || BTRIM(p_query) || '%'
        OR COALESCE(c.slug, '') ILIKE '%' || BTRIM(p_query) || '%'
        OR COALESCE(v.name, '') ILIKE '%' || BTRIM(p_query) || '%'
        OR COALESCE(v.slug, '') ILIKE '%' || BTRIM(p_query) || '%'
        OR COALESCE(v.address, '') ILIKE '%' || BTRIM(p_query) || '%'
        OR COALESCE(v.city, '') ILIKE '%' || BTRIM(p_query) || '%'
        OR EXISTS (
          SELECT 1
          FROM public.event_tag_mappings etm
          JOIN public.event_tags et ON et.id = etm.tag_id
          WHERE etm.event_id = e.id
            AND et.is_active = true
            AND (et.name ILIKE '%' || BTRIM(p_query) || '%' OR et.slug ILIKE '%' || BTRIM(p_query) || '%')
        )
      )
  )
  SELECT
    f.id,
    f.title,
    f.slug,
    f.short_description,
    f.capacity,
    f.registered_count,
    f.registration_open,
    f.price,
    f.currency,
    f.cover_image,
    f.start_at,
    CASE WHEN f.category_id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', f.category_id,
      'name', f.category_name,
      'slug', f.category_slug,
      'display_order', f.category_display_order
    ) END AS category,
    CASE WHEN f.venue_id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', f.venue_id,
      'name', f.venue_name,
      'slug', f.venue_slug,
      'address', f.venue_address,
      'city', f.venue_city,
      'capacity', f.venue_capacity
    ) END AS venue,
    COUNT(*) OVER() AS total_count
  FROM filtered f
  ORDER BY f.start_at ASC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 9), 50))
  OFFSET GREATEST(0, COALESCE(p_offset, 0));
$$;

GRANT EXECUTE ON FUNCTION public.search_published_events(TEXT, TEXT, INTEGER, INTEGER) TO anon, authenticated, service_role;
