-- Migration 00004: Public read access for published event discovery

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_events" ON public.events;
CREATE POLICY "public_read_published_events"
  ON public.events FOR SELECT
  TO anon, authenticated
  USING (status = 'PUBLISHED');

DROP POLICY IF EXISTS "public_read_categories" ON public.event_categories;
CREATE POLICY "public_read_categories"
  ON public.event_categories FOR SELECT
  TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "public_read_venues" ON public.venues;
CREATE POLICY "public_read_venues"
  ON public.venues FOR SELECT
  TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "public_read_event_images" ON public.event_images;
CREATE POLICY "public_read_event_images"
  ON public.event_images FOR SELECT
  TO anon, authenticated
  USING (
    event_id IN (SELECT id FROM public.events WHERE status = 'PUBLISHED')
  );
