import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentDashboardRoles, hasDashboardRole, isOnlyHostRole } from '@/lib/dashboard-rbac';

export const runtime = 'nodejs';

const EVENT_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HOST', 'EVENT_MANAGER', 'EDITOR'] as const;
const PUBLISH_ROLES = ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'EDITOR'] as const;
const MUTABLE_STATUSES = new Set(['DRAFT', 'PUBLISHED']);

type EventRow = { id: string; title: string | null; slug: string | null; short_description: string | null; description: string | null; category_id: string | null; host_id: string | null; venue_id: string | null; start_at: string | null; end_at: string | null; capacity: number | null; registered_count: number | null; registration_deadline: string | null; price: number | null; currency: string | null; cover_image: string | null; status: string | null; featured: boolean | null; registration_open: boolean | null; published_at: string | null; created_at: string | null; updated_at: string | null };
type CategoryRow = { id: string; name: string | null };
type VenueRow = { id: string; name: string | null; address: string | null; city: string | null };

async function requireEventManager() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  const { roles, error: roleError } = await getCurrentDashboardRoles(supabase);
  if (roleError) return { error: NextResponse.json({ error: 'Unable to resolve dashboard roles.' }, { status: 500 }) };
  if (!hasDashboardRole(roles, EVENT_ROLES)) return { error: NextResponse.json({ error: 'You do not have event management permission.' }, { status: 403 }) };
  let admin = supabase;
  try { admin = getSupabaseAdmin(); } catch (error) { console.warn('[ADMIN EVENTS][ADMIN CLIENT FALLBACK]', error); }
  const { data: profile, error: profileError } = await admin.from('profiles').select('id,full_name').eq('auth_user_id', user.id).maybeSingle();
  if (profileError || !profile) return { error: NextResponse.json({ error: 'Staff profile not found.' }, { status: 400 }) };
  return { supabase, admin, user, profile, roles };
}

export async function GET() {
  const auth = await requireEventManager();
  if ('error' in auth) return auth.error;
  try {
    let query = auth.admin.from('events').select('id,title,slug,short_description,description,category_id,host_id,venue_id,start_at,end_at,capacity,registered_count,registration_deadline,price,currency,cover_image,status,featured,registration_open,published_at,created_at,updated_at').order('start_at', { ascending: false }).limit(250);
    if (isOnlyHostRole(auth.roles)) query = query.eq('host_id', auth.profile.id);
    const { data: rows, error: eventsError } = await query;
    if (eventsError) throw eventsError;
    const events = (rows ?? []) as EventRow[];
    const categoryIds = [...new Set(events.map((event) => event.category_id).filter((id): id is string => Boolean(id)))];
    const venueIds = [...new Set(events.map((event) => event.venue_id).filter((id): id is string => Boolean(id)))];
    const [{ data: categories, error: categoriesError }, { data: venues, error: venuesError }] = await Promise.all([
      categoryIds.length ? auth.admin.from('event_categories').select('id,name').in('id', categoryIds) : Promise.resolve({ data: [] as CategoryRow[], error: null }),
      venueIds.length ? auth.admin.from('venues').select('id,name,address,city').in('id', venueIds) : Promise.resolve({ data: [] as VenueRow[], error: null }),
    ]);
    if (categoriesError) throw categoriesError;
    if (venuesError) throw venuesError;
    const categoryMap = new Map(((categories ?? []) as CategoryRow[]).map((category) => [category.id, category]));
    const venueMap = new Map(((venues ?? []) as VenueRow[]).map((venue) => [venue.id, venue]));
    return NextResponse.json({ events: events.map((event) => ({ ...event, category: event.category_id ? categoryMap.get(event.category_id) || null : null, venue: event.venue_id ? venueMap.get(event.venue_id) || null : null })) });
  } catch (error) {
    console.error('[ADMIN EVENTS][GET]', error);
    return NextResponse.json({ error: error instanceof Error ? `Unable to load events: ${error.message}` : 'Unable to load events.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireEventManager();
  if ('error' in auth) return auth.error;
  try {
    if (!hasDashboardRole(auth.roles, PUBLISH_ROLES)) return NextResponse.json({ error: 'Hosts can manage their events but cannot publish or unpublish them.' }, { status: 403 });
    const body = await request.json();
    const eventId = typeof body?.eventId === 'string' ? body.eventId : '';
    const status = typeof body?.status === 'string' ? body.status.toUpperCase() : '';
    if (!eventId || !MUTABLE_STATUSES.has(status)) return NextResponse.json({ error: 'A valid eventId and status (DRAFT or PUBLISHED) are required.' }, { status: 400 });
    const { data: existing, error: existingError } = await auth.admin.from('events').select('id,title,status,host_id').eq('id', eventId).maybeSingle();
    if (existingError) throw existingError;
    if (!existing) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    const update = { status, published_at: status === 'PUBLISHED' ? new Date().toISOString() : null, updated_by: auth.profile.id, updated_at: new Date().toISOString() };
    const { data: event, error: updateError } = await auth.admin.from('events').update(update).eq('id', eventId).select('id,title,status,published_at,updated_at').single();
    if (updateError) throw updateError;
    await auth.admin.from('audit_logs').insert({ actor_user_id: auth.profile.id, action: status === 'PUBLISHED' ? 'EVENT_PUBLISHED' : 'EVENT_UNPUBLISHED', entity_type: 'EVENT', entity_id: eventId, metadata: { roles: auth.roles, new_status: status } });
    return NextResponse.json({ event });
  } catch (error) {
    console.error('[ADMIN EVENTS][PATCH]', error);
    return NextResponse.json({ error: 'Unable to update event status.' }, { status: 500 });
  }
}
