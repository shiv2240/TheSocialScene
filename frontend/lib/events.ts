import { unstable_cache } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const EVENT_CARD_SELECT = `
  id,title,slug,short_description,capacity,registered_count,registration_open,
  price,currency,cover_image,start_at,
  category:event_categories(id,name,slug,display_order),
  venue:venues(id,name,slug,address,city,capacity)
`;

export interface PublicEventsPage {
  events: any[];
  total: number;
}

async function queryPublicEvents(page: number, pageSize: number, category: string) {
  const supabase = getSupabaseAdmin();
  const from = Math.max(0, (page - 1) * pageSize);
  const to = from + pageSize - 1;
  const select = category && category !== 'all'
    ? `id,title,slug,short_description,capacity,registered_count,registration_open,price,currency,cover_image,start_at,category:event_categories!inner(id,name,slug,display_order),venue:venues(id,name,slug,address,city,capacity)`
    : EVENT_CARD_SELECT;

  let query = supabase
    .from('events')
    .select(select, { count: 'exact' })
    .eq('status', 'PUBLISHED')
    .order('start_at', { ascending: true })
    .range(from, to);

  if (category && category !== 'all') query = query.eq('category.slug', category);

  const { data, count, error } = await query;
  if (error) throw error;

  return { events: data ?? [], total: count ?? 0 } satisfies PublicEventsPage;
}

export async function getPublicEvents(page = 1, pageSize = 9, category = 'all') {
  const safePage = Math.max(1, Math.floor(page));
  const safeSize = Math.min(50, Math.max(1, Math.floor(pageSize)));
  const safeCategory = category || 'all';

  return unstable_cache(
    () => queryPublicEvents(safePage, safeSize, safeCategory),
    ['public-events', String(safePage), String(safeSize), safeCategory],
    { revalidate: 30, tags: ['public-events'] }
  )();
}

export async function getPublicEventBySlug(slug: string) {
  const safeSlug = slug.trim();
  return unstable_cache(
    async () => {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('events')
        .select('id,title,slug,short_description,description,category:event_categories(id,name,slug),venue:venues(id,name,address,city,google_maps_url),start_at,end_at,capacity,registered_count,registration_open,price,currency,cover_image,status')
        .eq('slug', safeSlug)
        .eq('status', 'PUBLISHED')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    ['public-event', safeSlug],
    { revalidate: 30, tags: ['public-events', `public-event:${safeSlug}`] }
  )();
}
