-- Idempotent backfill for all existing events, including drafts.
-- Recommendation signals are useful before publication too, and suggestions only expose wishlist activity.
insert into public.event_tag_mappings (event_id, tag_id)
select e.id, t.id
from public.events e
join public.event_categories c on c.id = e.category_id
join public.event_tags t on t.slug = case
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
end
where e.category_id is not null
  and t.is_active = true
on conflict (event_id, tag_id) do nothing;

insert into public.event_tag_mappings (event_id, tag_id)
select e.id, t.id
from public.events e
join public.event_categories c on c.id = e.category_id
join public.event_tags t on t.slug = 'live-performance'
where (lower(c.name) like '%music%' or lower(c.name) like '%concert%' or lower(c.name) like '%performance%')
on conflict (event_id, tag_id) do nothing;
