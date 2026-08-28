import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

type VenueRow = {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  capacity: number;
  created_at: string;
  updated_at: string;
};

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: sessionData } = await supabase.auth.getUser();
    if (!sessionData.user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('venues')
      .select('id,name,slug,address,city,google_maps_url,latitude,longitude,capacity,created_at,updated_at')
      .order('name', { ascending: true });

    if (!error) {
      return NextResponse.json({ venues: (data ?? []) as VenueRow[] });
    }

    // Some dashboard deployments use RLS that does not expose venue rows to
    // the authenticated client. Use the server-only service-role client as a
    // controlled fallback, while still requiring an authenticated dashboard user.
    try {
      const admin = getSupabaseAdmin();
      const fallback = await admin
        .from('venues')
        .select('id,name,slug,address,city,google_maps_url,latitude,longitude,capacity,created_at,updated_at')
        .order('name', { ascending: true });

      if (!fallback.error) {
        return NextResponse.json({ venues: (fallback.data ?? []) as VenueRow[] });
      }
      console.error('[DASHBOARD VENUES][ADMIN FALLBACK]', fallback.error);
    } catch (fallbackError) {
      console.error('[DASHBOARD VENUES][ADMIN CLIENT]', fallbackError);
    }

    throw error;
  } catch (error) {
    console.error('[DASHBOARD VENUES][GET]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load venues.' },
      { status: 500 },
    );
  }
}
