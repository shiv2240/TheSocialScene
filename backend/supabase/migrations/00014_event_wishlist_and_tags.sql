-- Event preference signals for future recommendations.
create table if not exists public.event_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_tag_mappings (
  event_id uuid not null references public.events(id) on delete cascade,
  tag_id uuid not null references public.event_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, tag_id)
);

create table if not exists public.event_wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create index if not exists idx_event_tag_mappings_tag_id on public.event_tag_mappings(tag_id);
create index if not exists idx_event_wishlists_user_id on public.event_wishlists(user_id);
create index if not exists idx_event_wishlists_event_id on public.event_wishlists(event_id);

alter table public.event_tags enable row level security;
alter table public.event_tag_mappings enable row level security;
alter table public.event_wishlists enable row level security;

create policy "published event tags are readable" on public.event_tags
  for select to anon, authenticated using (is_active = true);

create policy "published event tag mappings are readable" on public.event_tag_mappings
  for select to anon, authenticated using (
    exists (select 1 from public.events e where e.id = event_id and e.status = 'PUBLISHED')
  );

create policy "users read own wishlists" on public.event_wishlists
  for select to authenticated using (
    user_id = (select p.id from public.profiles p where p.auth_user_id = auth.uid())
  );

create policy "users add own wishlist" on public.event_wishlists
  for insert to authenticated with check (
    user_id = (select p.id from public.profiles p where p.auth_user_id = auth.uid())
  );

create policy "users remove own wishlist" on public.event_wishlists
  for delete to authenticated using (
    user_id = (select p.id from public.profiles p where p.auth_user_id = auth.uid())
  );

insert into public.event_tags (name, slug) values
  ('Music', 'music'),
  ('Nightlife', 'nightlife'),
  ('Networking', 'networking'),
  ('Food & Dining', 'food-dining'),
  ('Art & Culture', 'art-culture'),
  ('Fitness', 'fitness'),
  ('Wellness', 'wellness'),
  ('Comedy', 'comedy'),
  ('Tech', 'tech'),
  ('Business', 'business'),
  ('Social Mixer', 'social-mixer'),
  ('House Party', 'house-party'),
  ('Live Performance', 'live-performance')
on conflict (slug) do nothing;
