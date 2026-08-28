-- Curated event taxonomy for The Social Scene.
-- Existing categories are retained for historical event references but hidden from
-- category discovery. Only active categories are shown to users and event creators.
alter table public.event_categories
  add column if not exists is_active boolean not null default true;

update public.event_categories
set is_active = false;

insert into public.event_categories (name, slug, icon, description, display_order, is_active) values
  ('Private Dinners', 'private-dinners', 'utensils', 'Curated intimate dinners and hosted dining experiences.', 1, true),
  ('Supper Clubs', 'supper-clubs', 'chef-hat', 'Social supper clubs, tasting menus and intimate food-led gatherings.', 2, true),
  ('House Parties', 'house-parties', 'home', 'Curated house parties, social mixers and private celebrations.', 3, true),
  ('Social Mixers', 'social-mixers', 'users', 'Low-pressure social gatherings designed to meet new people.', 4, true),
  ('Music & Live', 'music-live', 'music', 'Live music, intimate performances, listening sessions and concerts.', 5, true),
  ('Cultural Experiences', 'cultural-experiences', 'landmark', 'Art, culture, heritage and community-led experiences.', 6, true),
  ('Wellness & Fitness', 'wellness-fitness', 'heart-pulse', 'Wellness, movement, fitness and mindful social experiences.', 7, true),
  ('Outdoor Adventures', 'outdoor-adventures', 'mountain', 'Treks, nature escapes, outdoor activities and adventure meetups.', 8, true),
  ('Creative & Art', 'creative-art', 'palette', 'Creative workshops, art sessions and hands-on experiences.', 9, true),
  ('Comedy & Entertainment', 'comedy-entertainment', 'sparkles', 'Comedy nights, entertainment and live experiential shows.', 10, true),
  ('Networking & Professional', 'networking-professional', 'briefcase-business', 'Intentional networking, founder meetups and professional communities.', 11, true),
  ('Community & Meetups', 'community-meetups', 'messages-square', 'Interest-based communities, meetups and recurring social groups.', 12, true)
on conflict (slug) do update set
  name = excluded.name,
  icon = excluded.icon,
  description = excluded.description,
  display_order = excluded.display_order,
  is_active = true;

create index if not exists idx_event_categories_active_order
  on public.event_categories(is_active, display_order);