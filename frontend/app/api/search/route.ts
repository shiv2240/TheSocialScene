import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q        = searchParams.get('q')?.trim() ?? '';
    const category = searchParams.get('category') ?? 'all';
    const limit    = Math.min(Number(searchParams.get('limit') ?? '50'), 100);

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('events')
      .select('*, category:event_categories(id,name,slug,display_order), venue:venues(id,name,slug,address,city,capacity)')
      .eq('status', 'PUBLISHED')
      .order('start_at', { ascending: true })
      .limit(limit);

    // Full-text / partial match on title, short_description, venue city
    if (q) {
      query = query.or(
        `title.ilike.%${q}%,short_description.ilike.%${q}%`
      );
    }

    // Category filter via the joined category slug
    if (category && category !== 'all') {
      query = query.eq('category.slug', category);
    }

    const { data, error } = await query;
    if (error) throw error;

    // If category filter was applied, Supabase may still return rows where
    // the join didn't match (returns null category). Filter those out client-side.
    const results = category && category !== 'all'
      ? (data ?? []).filter((e: any) => e.category?.slug === category)
      : (data ?? []);

    return NextResponse.json({ results, total: results.length });
  } catch (err) {
    console.error('[SEARCH][EVENTS]', err);
    return NextResponse.json({ error: 'Search failed.' }, { status: 500 });
  }
}
