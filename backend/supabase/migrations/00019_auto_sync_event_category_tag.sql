-- Keep recommendation tags in sync with the event's canonical category.
-- Category mapping is intentionally conservative; admins can add secondary tags manually.
create or replace function public.sync_event_category_recommendation_tag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_slug text;
  target_tag_id uuid;
begin
  select case
    when lower(c.name) like '%music%' or lower(c.name) like '%concert%' then 'music'
    when lower(c.name) like '%nightlife%' then 'nightlife'
    when lower(c.name) like '%network%' then 'networking'
    when lower(c.name) like '%food%' or lower(c.name) like '%dining%' then 'food-dining'
    when lower(c.name) like '%art%' or lower(c.name) like '%culture%' then 'art-culture'
    when lower(c.name) like '%fitness%' then 'fitness'
    when lower(c.name) like '%wellness%' then 'wellness'
    when lower(c.name) like '%comedy%' then 'comedy'
    when lower(c.name) like '%tech%' then 'tech'
    when lower(c.name) like '%business%' then 'business'
    when lower(c.name) like '%mixer%' then 'social-mixer'
    when lower(c.name) like '%house party%' or lower(c.name) like '%house-part%' then 'house-party'
    when lower(c.name) like '%performance%' then 'live-performance'
    else null
  end into target_slug
  from public.event_categories c
  where c.id = new.category_id;

  if target_slug is null then
    return new;
  end if;

  select id into target_tag_id
  from public.event_tags
  where slug = target_slug and is_active = true
  limit 1;

  if target_tag_id is not null then
    insert into public.event_tag_mappings(event_id, tag_id)
    values (new.id, target_tag_id)
    on conflict (event_id, tag_id) do nothing;
  end if;

  if target_slug = 'music' then
    select id into target_tag_id from public.event_tags where slug = 'live-performance' and is_active = true limit 1;
    if target_tag_id is not null then
      insert into public.event_tag_mappings(event_id, tag_id)
      values (new.id, target_tag_id)
      on conflict (event_id, tag_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_event_category_recommendation_tag on public.events;
create trigger trg_sync_event_category_recommendation_tag
after insert or update of category_id on public.events
for each row execute function public.sync_event_category_recommendation_tag();
