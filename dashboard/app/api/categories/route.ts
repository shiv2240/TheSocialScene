import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Prefer the authenticated server client so the endpoint also works when
    // the dashboard deployment does not expose the service-role key.
    const supabase = await createClient();
    const { data: sessionData } = await supabase.auth.getUser();
    if (!sessionData.user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('event_categories')
      .select('id,name,slug,display_order')
      .order('display_order', { ascending: true });

    if (!error) return NextResponse.json({ categories: data ?? [] });

    // Fall back to the service-role client when the authenticated role does
    // not have read access to the categories table.
    try {
      const admin = getSupabaseAdmin();
      const fallback = await admin
        .from('event_categories')
        .select('id,name,slug,display_order')
        .order('display_order', { ascending: true });

      if (!fallback.error) return NextResponse.json({ categories: fallback.data ?? [] });
      console.error('[DASHBOARD CATEGORIES][ADMIN FALLBACK]', fallback.error);
    } catch (fallbackError) {
      console.error('[DASHBOARD CATEGORIES][ADMIN CLIENT]', fallbackError);
    }

    throw error;
  } catch (error) {
    console.error('[DASHBOARD CATEGORIES]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load categories.' },
      { status: 500 },
    );
  }
}
