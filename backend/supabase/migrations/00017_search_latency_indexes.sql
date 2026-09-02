-- Migration 00017: additional indexes for fast public event search.
-- The search RPC checks event_tag_mappings by tag_id for every candidate event.
-- This index makes that join index-backed in the tag -> event direction.
CREATE INDEX IF NOT EXISTS idx_event_tag_mappings_tag_event
  ON public.event_tag_mappings (tag_id, event_id);

-- Keep active tag filtering index-backed when searching tag names/slugs.
CREATE INDEX IF NOT EXISTS idx_event_tags_active_id
  ON public.event_tags (id)
  WHERE is_active = true;
