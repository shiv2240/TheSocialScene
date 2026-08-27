import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('event_categories')
      .select('id,name,slug,display_order')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ categories: data ?? [] });
  } catch (error) {
    console.error('[DASHBOARD CATEGORIES]', error);
    return NextResponse.json({ error: 'Unable to load categories.' }, { status: 500 });
  }
}
