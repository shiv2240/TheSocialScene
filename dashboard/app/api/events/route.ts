import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const EVENT_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'EDITOR']);
const MUTABLE_STATUSES = new Set(['DRAFT', 'PUBLISHED']);

async function requireEventManager() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };

  const { data: role, error: roleError } = await supabase.rpc('get_my_dashboard_role');
  if (roleError) return { error: NextResponse.json({ error: 'Unable to resolve dashboard role.' }, { status: 500 }) };
  if (!EVENT_ROLES.has(String(role))) {
    return { error: NextResponse.json({ error: 'You do not have event management permission.' }, { status: 403 }) };
  }

  const admin = getSupabaseAdmin();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id,full_name')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  if (profileError) return { error: NextResponse.json({ error: 'Unable to load staff profile.' }, { status: 500 }) };
  if (!profile) return { error: NextResponse.json({ error: 'Staff profile not found.' }, { status: 400 }) };

  return { supabase, admin, user, profile, role: String(role) };
}

export async function GET() {
  const auth = await requireEventManager();
  if ('error' in auth) return auth.error;

  try {
    const { data, error } = await auth.admin
      .from('events')
      .select(`
        id,title,slug,short_description,description,category_id,host_id,venue_id,
        start_at,end_at,capacity,registered_count,registration_deadline,price,currency,
        cover_image,status,featured,registration_open,published_at,created_at,updated_at,
        category:event_categories(name),
        venue:venues(name,address,city)
      `)
      .order('start_at', { ascending: false })
      .limit(250);

    if (error) throw error;
    return NextResponse.json({ events: data || [] });
  } catch (error) {
    console.error('[ADMIN EVENTS][GET]', error);
    return NextResponse.json({ error: 'Unable to load events.' }, { status: 500 });
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
