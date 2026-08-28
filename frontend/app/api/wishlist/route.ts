import { NextRequest, NextResponse } from 'next/server';
import { getCurrentFirebaseUser } from '@/lib/firebase/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

type ProfileRow = { id: string };
type WishlistRow = { id: string; event_id: string };

async function getProfileId() {
  const user = await getCurrentFirebaseUser();
  if (!user) return { user: null, profileId: null };

  const supabase = getSupabaseAdmin();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('firebase_uid', user.uid)
    .maybeSingle();

  if (error) throw error;
  return { user, profileId: (profile as ProfileRow | null)?.id ?? null };
}

export async function GET(request: NextRequest) {
  try {
    const { user, profileId } = await getProfileId();
    if (!user || !profileId) return NextResponse.json({ authenticated: false, wishlisted: false, eventIds: [] });

    const supabase = getSupabaseAdmin();
    const eventId = request.nextUrl.searchParams.get('event_id');
    let query = supabase.from('event_wishlists').select('id,event_id').eq('user_id', profileId);
    if (eventId) query = query.eq('event_id', eventId);

    const { data, error } = await query;
    if (error) throw error;
    const rows = (data ?? []) as WishlistRow[];
    return NextResponse.json({ authenticated: true, wishlisted: eventId ? rows.length > 0 : false, eventIds: rows.map(row => row.event_id) });
  } catch (error) {
    console.error('[WISHLIST][GET]', error);
    return NextResponse.json({ error: 'Unable to load wishlist.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, profileId } = await getProfileId();
    if (!user || !profileId) return NextResponse.json({ error: 'Please sign in to save events.' }, { status: 401 });

    const body = await request.json().catch(() => null) as { event_id?: string } | null;
    if (!body?.event_id) return NextResponse.json({ error: 'event_id is required.' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', body.event_id)
      .eq('status', 'PUBLISHED')
      .maybeSingle();
    if (eventError) throw eventError;
    if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

    const { error } = await supabase
      .from('event_wishlists')
      .upsert({ user_id: profileId, event_id: body.event_id }, { onConflict: 'user_id,event_id' });
    if (error) throw error;

    return NextResponse.json({ wishlisted: true });
  } catch (error) {
    console.error('[WISHLIST][POST]', error);
    return NextResponse.json({ error: 'Unable to save event.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, profileId } = await getProfileId();
    if (!user || !profileId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const body = await request.json().catch(() => null) as { event_id?: string } | null;
    if (!body?.event_id) return NextResponse.json({ error: 'event_id is required.' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('event_wishlists')
      .delete()
      .eq('user_id', profileId)
      .eq('event_id', body.event_id);
    if (error) throw error;

    return NextResponse.json({ wishlisted: false });
  } catch (error) {
    console.error('[WISHLIST][DELETE]', error);
    return NextResponse.json({ error: 'Unable to remove event from wishlist.' }, { status: 500 });
  }
}
