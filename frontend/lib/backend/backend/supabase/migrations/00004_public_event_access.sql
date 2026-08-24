-- Public read access for published event discovery.

DROP POLICY IF EXISTS public_read_published_events ON public.events;
CREATE POLICY public_read_published_events
  ON public.events
  FOR SELECT
  TO anon, authenticated
  USING (status = 'PUBLISHED');

DROP POLICY IF EXISTS public_read_event_categories ON public.event_categories;
CREATE POLICY public_read_event_categories
  ON public.event_categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS public_read_venues ON public.venues;
CREATE POLICY public_read_venues
  ON public.venues
  FOR SELECT
  TO anon, authenticated
  USING (true);
