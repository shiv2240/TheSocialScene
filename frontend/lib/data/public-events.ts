import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

const getFeaturedEvents = unstable_cache(
  async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      throw new Error('Supabase public environment variables are not configured.');
    }

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: featuredEvents, error: featuredError } = await supabase
      .from('events')
      .select('*, category:event_categories(id,name,slug,display_order), venue:venues(id,name,slug,address,city,capacity)')
      .eq('status', 'PUBLISHED')
      .eq('featured', true)
      .order('start_at', { ascending: true })
      .limit(6);

    if (featuredError) throw featuredError;
    if (featuredEvents?.length) return featuredEvents;

    const { data: fallbackEvents, error: fallbackError } = await supabase
      .from('events')
      .select('*, category:event_categories(id,name,slug,display_order), venue:venues(id,name,slug,address,city,capacity)')
      .eq('status', 'PUBLISHED')
      .order('start_at', { ascending: true })
      .limit(6);

    if (fallbackError) throw fallbackError;
    return fallbackEvents ?? [];
  },
  ['public-featured-events'],
  { revalidate: 60, tags: ['public-events'] },
);

export async function getPublicFeaturedEvents() {
  return getFeaturedEvents();
}
