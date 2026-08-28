import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type ProfileRow = { id: string };
type WishlistRow = { id: string; event_id: string };

async function getProfileId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, profileId: null };
  const { data: profile } = await supabase.from('profiles').select('id').eq('auth_user_id', user.id).maybeSingle();
  return { supabase, profileId: (profile as ProfileRow | null)?.id ?? null };
}

export async function GET(request: NextRequest) {
  const { supabase, profileId } = await getProfileId();
  if (!profileId) return NextResponse.json({ authenticated: false, wishlisted: false, eventIds: [] });
  const eventId = request.nextUrl.searchParams.get('event_id');
  let query = supabase.from('event_wishlists').select('id,event_id').eq('user_id', profileId);
  if (eventId) query = query.eq('event_id', eventId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Unable to load wishlist.' }, { status: 500 });
  const rows = (data ?? []) as WishlistRow[];
  return NextResponse.json({ authenticated: true, wishlisted: eventId ? rows.length > 0 : false, eventIds: rows.map(row => row.event_id) });
}

export async function POST(request: NextRequest) {
  const { supabase, profileId } = await getProfileId();
  if (!profileId) return NextResponse.json({ error: 'Please sign in to save events.' }, { status: 401 });
  const body = await request.json().catch(() => null) as { event_id?: string } | null;
  if (!body?.event_id) return NextResponse.json({ error: 'event_id is required.' }, { status: 400 });
  const { data: event } = await supabase.from('events').select('id').eq('id', body.event_id).eq('status', 'PUBLISHED').maybeSingle();
  if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
  const { error } = await supabase.from('event_wishlists').upsert({ user_id: profileId, event_id: body.event_id }, { onConflict: 'user_id,event_id' });
  if (error) return NextResponse.json({ error: 'Unable to save event.' }, { status: 500 });
  return NextResponse.json({ wishlisted: true });
}

export async function DELETE(request: NextRequest) {
  const { supabase, profileId } = await getProfileId();
  if (!profileId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const body = await request.json().catch(() => null) as { event_id?: string } | null;
  if (!body?.event_id) return NextResponse.json({ error: 'event_id is required.' }, { status: 400 });
  const { error } = await supabase.from('event_wishlists').delete().eq('user_id', profileId).eq('event_id', body.event_id);
  if (error) return NextResponse.json({ error: 'Unable to remove event from wishlist.' }, { status: 500 });
  return NextResponse.json({ wishlisted: false });
}
