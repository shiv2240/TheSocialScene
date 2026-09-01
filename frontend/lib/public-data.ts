import { unstable_cache } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const PUBLIC_EVENT_SELECT = `
  id,title,slug,short_description,capacity,registered_count,registration_open,
  price,currency,cover_image,start_at,category_id,
  category:event_categories(id,name,slug,display_order,is_active),
  venue:venues(id,name,slug,address,city,capacity)
`;

export async function getPublicCategories() {
  return unstable_cache(
    async () => {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('event_categories')
        .select('id,name,slug,display_order,is_active')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    ['public-categories'],
    { revalidate: 300, tags: ['public-categories'] },
  )();
}

export async function getPublicCategoryEvents() {
  return unstable_cache(
    async () => {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('events')
        .select(PUBLIC_EVENT_SELECT)
        .eq('status', 'PUBLISHED')
        .order('start_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    ['public-category-events'],
    { revalidate: 30, tags: ['public-events', 'public-category-events'] },
  )();
}
