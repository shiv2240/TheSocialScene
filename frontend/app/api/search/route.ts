import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'edge';

const escapeSearchTerm = (value: string) =>
  value.replace(/[,%()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);

const jsonHeaders = {
  'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
  'CDN-Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = escapeSearchTerm(searchParams.get('q') ?? '');
    const category = (searchParams.get('category') ?? 'all').trim().slice(0, 80) || 'all';
    const page = Math.max(1, Math.floor(Number(searchParams.get('page') ?? '1') || 1));
    const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '9') || 9, 1), 50);
    const offset = (page - 1) * limit;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc('search_published_events', {
      p_query: q,
      p_category_slug: category,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) throw error;

    const results = data ?? [];
    const total = Number(results[0]?.total_count ?? 0);

    return NextResponse.json(
      { results, total, page, limit, totalPages: Math.ceil(total / limit) },
      { headers: jsonHeaders },
    );
  } catch (err) {
    console.error('[SEARCH][EVENTS]', err);
    return NextResponse.json(
      { error: 'Search failed.', results: [], total: 0 },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
