import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const EVENT_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'EDITOR']);
const MUTABLE_STATUSES = new Set(['DRAFT', 'PUBLISHED']);
type RoleIdRow = { role_id: string | null };
type RoleNameRow = { id: string; name: string | null };

async function requireEventManager() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch (error) {
    console.error('[ADMIN EVENTS][SUPABASE CONFIG]', error);
    return { error: NextResponse.json({ error: 'Dashboard database configuration is unavailable.' }, { status: 500 }) };
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id,full_name')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  if (profileError) {
    console.error('[ADMIN EVENTS][PROFILE]', profileError);
    return { error: NextResponse.json({ error: 'Unable to load staff profile.' }, { status: 500 }) };
  }
  if (!profile) return { error: NextResponse.json({ error: 'Staff profile not found.' }, { status: 400 }) };

  // Do not rely on PostgREST relationship embedding for RBAC. The dashboard has
  // already experienced schema-cache/relationship failures in this area, so keep
  // authorization checks to independent primary-key queries.
  const { data: roleRows, error: roleError } = await admin
    .from('user_roles')
    .select('role_id')
    .eq('user_id', profile.id);
  if (roleError) {
    console.error('[ADMIN EVENTS][USER ROLES]', roleError);
    return { error: NextResponse.json({ error: 'Unable to resolve dashboard role.' }, { status: 500 }) };
  }

  const roleIds = [...new Set(((roleRows ?? []) as RoleIdRow[]).map((row) => row.role_id).filter((id): id is string => Boolean(id)))];
  if (!roleIds.length) {
    return { error: NextResponse.json({ error: 'You do not have event management permission.' }, { status: 403 }) };
  }

  const { data: roleDefinitions, error: rolesError } = await admin
    .from('roles')
    .select('id,name')
    .in('id', roleIds);
  if (rolesError) {
    console.error('[ADMIN EVENTS][ROLES]', rolesError);
    return { error: NextResponse.json({ error: 'Unable to resolve dashboard role.' }, { status: 500 }) };
  }

  const roles = ((roleDefinitions ?? []) as RoleNameRow[])
    .map((row) => row.name)
    .filter((name): name is string => Boolean(name));
  const role = roles.find((value) => EVENT_ROLES.has(value));
  if (!role) return { error: NextResponse.json({ error: 'You do not have event management permission.' }, { status: 403 }) };

  return { supabase, admin, user, profile, role };
}

export async function GET() {
  const auth = await requireEventManager();
  if ('error' in auth) return auth.error;

  try {
    // Keep the base event query independent from PostgREST relationship embedding.
    // The events table has several profile FKs and relationship/schema-cache changes
    // can make embedded selects fail even when the base table is healthy.
    const { data: rows, error: eventsError } = await auth.admin
      .from('events')
      .select(`
        id,title,slug,short_description,description,category_id,host_id,venue_id,
        start_at,end_at,capacity,registered_count,registration_deadline,price,currency,
        cover_image,status,featured,registration_open,published_at,created_at,updated_at
      `)
      .order('start_at', { ascending: false })
      .limit(250);

    if (eventsError) throw eventsError;

    const events = rows || [];
    const categoryIds = [...new Set(events.map((event) => event.category_id).filter(Boolean))];
    const venueIds = [...new Set(events.map((event) => event.venue_id).filter(Boolean))];

    const [{ data: categories, error: categoriesError }, { data: venues, error: venuesError }] = await Promise.all([
      categoryIds.length
        ? auth.admin.from('event_categories').select('id,name').in('id', categoryIds)
        : Promise.resolve({ data: [], error: null }),
      venueIds.length
        ? auth.admin.from('venues').select('id,name,address,city').in('id', venueIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (categoriesError) throw categoriesError;
    if (venuesError) throw venuesError;

    const categoryMap = new Map((categories || []).map((category) => [category.id, category]));
    const venueMap = new Map((venues || []).map((venue) => [venue.id, venue]));

    const enrichedEvents = events.map((event) => ({
      ...event,
      category: event.category_id ? categoryMap.get(event.category_id) || null : null,
      venue: event.venue_id ? venueMap.get(event.venue_id) || null : null,
    }));

    return NextResponse.json({ events: enrichedEvents });
  } catch (error) {
    console.error('[ADMIN EVENTS][GET]', error);
    return NextResponse.json({
      error: error instanceof Error ? `Unable to load events: ${error.message}` : 'Unable to load events.'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireEventManager();
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    const eventId = typeof body?.eventId === 'string' ? body.eventId : '';
    const status = typeof body?.status === 'string' ? body.status.toUpperCase() : '';

    if (!eventId || !MUTABLE_STATUSES.has(status)) {
      return NextResponse.json({ error: 'A valid eventId and status (DRAFT or PUBLISHED) are required.' }, { status: 400 });
    }

    const { data: existing, error: existingError } = await auth.admin
      .from('events')
      .select('id,title,status')
      .eq('id', eventId)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

    const update = {
      status,
      published_at: status === 'PUBLISHED' ? new Date().toISOString() : null,
      updated_by: auth.profile.id,
      updated_at: new Date().toISOString(),
    };

    const { data: event, error: updateError } = await auth.admin
      .from('events')
      .update(update)
      .eq('id', eventId)
      .select('id,title,status,published_at,updated_at')
      .single();
    if (updateError) throw updateError;

    await auth.admin.from('audit_logs').insert({
      actor_user_id: auth.profile.id,
      action: status === 'PUBLISHED' ? 'EVENT_PUBLISHED' : 'EVENT_UNPUBLISHED',
      entity_type: 'EVENT',
      entity_id: eventId,
      metadata: { previous_status: existing.status, new_status: status, role: auth.role },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error('[ADMIN EVENTS][PATCH]', error);
    return NextResponse.json({ error: 'Unable to update event status.' }, { status: 500 });
  }
}
