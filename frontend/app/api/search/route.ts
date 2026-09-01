import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const escapeSearchTerm = (value: string) =>
  value.replace(/[,%()]/g, ' ').replace(/\s+/g, ' ').trim();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const rawQ = searchParams.get('q')?.trim() ?? '';
    const q = escapeSearchTerm(rawQ);
    const category = searchParams.get('category') ?? 'all';
    const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '50') || 50, 1), 100);

    const supabase = getSupabaseAdmin();
    const baseQuery = () => supabase
      .from('events')
      .select('*, category:event_categories(id,name,slug,display_order), venue:venues(id,name,slug,address,city,capacity)')
      .eq('status', 'PUBLISHED')
      .order('start_at', { ascending: true })
      .limit(limit);

    let data: any[] = [];

    if (q) {
      const { data: textMatches, error: textError } = await baseQuery().or(
        `title.ilike.%${q}%,short_description.ilike.%${q}%`
      );
      if (textError) throw textError;
      data = textMatches ?? [];

      const [{ data: categoryMatches, error: categoryError }, { data: venueMatches, error: venueError }] = await Promise.all([
        supabase
          .from('event_categories')
          .select('id,name,slug,display_order')
          .or(`name.ilike.%${q}%,slug.ilike.%${q}%`),
        supabase
          .from('venues')
          .select('id,name,slug,address,city,capacity')
          .or(`name.ilike.%${q}%,slug.ilike.%${q}%,address.ilike.%${q}%,city.ilike.%${q}%`),
      ]);

      if (categoryError) throw categoryError;
      if (venueError) throw venueError;

      const categoryIds = (categoryMatches ?? []).map((item: any) => item.id);
      const venueIds = (venueMatches ?? []).map((item: any) => item.id);
      const relationQueries: Promise<any>[] = [];

      if (categoryIds.length) relationQueries.push(baseQuery().in('category_id', categoryIds));
      if (venueIds.length) relationQueries.push(baseQuery().in('venue_id', venueIds));

      const relationResults = await Promise.all(relationQueries);
      for (const result of relationResults) {
        if (result.error) throw result.error;
        data.push(...(result.data ?? []));
      }
    } else {
      const { data: allEvents, error } = await baseQuery();
      if (error) throw error;
      data = allEvents ?? [];
    }

    if (category && category !== 'all') {
      data = data.filter((event: any) => event.category?.slug === category);
    }

    const unique = new Map<string, any>();
    for (const event of data) unique.set(event.id, event);

    const results = Array.from(unique.values())
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
      .slice(0, limit);

    return NextResponse.json({ results, total: results.length });
  } catch (err) {
    console.error('[SEARCH][EVENTS]', err);
    return NextResponse.json({ error: 'Search failed.' }, { status: 500 });
  }
}
