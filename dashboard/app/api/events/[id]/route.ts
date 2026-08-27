import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
const EVENT_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'HOST', 'EVENT_MANAGER', 'EDITOR']);
const eventSchema = z.object({
  title: z.string().trim().min(3).max(160), slug: z.string().trim().min(3).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), short_description: z.string().trim().min(10).max(300), description: z.string().trim().min(20).max(20000), category_id: z.string().uuid().nullable(), cover_image: z.string().url().nullable(), start_at: z.string().datetime({ offset: true }), end_at: z.string().datetime({ offset: true }), venue_name: z.string().trim().min(2).max(160), venue_address: z.string().trim().min(5).max(500), venue_city: z.string().trim().min(2).max(100), google_maps_url: z.string().url().nullable(), capacity: z.number().int().min(1).max(100000), registration_deadline: z.string().datetime({ offset: true }).nullable(), price: z.number().min(0).max(10000000), currency: z.string().length(3), registration_enabled: z.boolean(), status: z.enum(['DRAFT', 'PUBLISHED']),
});

async function requireEventManager() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  const { data: roleName, error: roleError } = await supabase.rpc('get_my_dashboard_role');
  if (roleError) return { error: NextResponse.json({ error: 'Unable to resolve dashboard role.' }, { status: 500 }) };
  const role = typeof roleName === 'string' ? roleName : null;
  if (!role || !EVENT_ROLES.has(role)) return { error: NextResponse.json({ error: 'You do not have event management permission.' }, { status: 403 }) };
  const admin = getSupabaseAdmin();
  const { data: profile, error: profileError } = await admin.from('profiles').select('id,full_name').eq('auth_user_id', user.id).maybeSingle();
  if (profileError || !profile) return { error: NextResponse.json({ error: 'Staff profile not found.' }, { status: 400 }) };
  return { admin, profile, role };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireEventManager();
  if ('error' in auth) return auth.error;
  try {
    const { id } = await params;
    let query = auth.admin.from('events').select('id,title,slug,short_description,description,category_id,host_id,venue_id,start_at,end_at,capacity,registered_count,registration_deadline,price,currency,cover_image,status,featured,registration_open,published_at,created_at,updated_at').eq('id', id);
    if (auth.role === 'HOST') query = query.eq('host_id', auth.profile.id);
    const { data: event, error } = await query.maybeSingle();
    if (error) throw error;
    if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    let venue = null;
    if (event.venue_id) { const { data, error: venueError } = await auth.admin.from('venues').select('id,name,address,city,google_maps_url,capacity').eq('id', event.venue_id).maybeSingle(); if (venueError) throw venueError; venue = data; }
    let category = null;
    if (event.category_id) { const { data, error: categoryError } = await auth.admin.from('event_categories').select('id,name,slug').eq('id', event.category_id).maybeSingle(); if (categoryError) throw categoryError; category = data; }
    return NextResponse.json({ event: { ...event, venue, category } });
  } catch (error) { console.error('[ADMIN EVENT EDIT][GET]', error); return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load event.' }, { status: 500 }); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireEventManager();
  if ('error' in auth) return auth.error;
  try {
    const { id } = await params;
    const parsed = eventSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Please complete all required event fields.', details: parsed.error.flatten() }, { status: 400 });
    const data = parsed.data;
    const start = new Date(data.start_at); const end = new Date(data.end_at);
    if (end <= start) return NextResponse.json({ error: 'End time must be after the event starts.' }, { status: 400 });
    if (data.registration_deadline && new Date(data.registration_deadline) > start) return NextResponse.json({ error: 'Registration deadline cannot be after the event starts.' }, { status: 400 });
    if (data.status === 'PUBLISHED' && !data.cover_image) return NextResponse.json({ error: 'A cover image is required before publishing.' }, { status: 400 });

    const { data: existing, error: existingError } = await auth.admin.from('events').select('id,title,status,venue_id,host_id').eq('id', id).maybeSingle();
    if (existingError) throw existingError;
    if (!existing) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    if (auth.role === 'HOST' && existing.host_id !== auth.profile.id) return NextResponse.json({ error: 'You can only edit events assigned to you.' }, { status: 403 });
    if (auth.role === 'HOST' && data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') return NextResponse.json({ error: 'Hosts cannot publish new events. Save the event as a draft for admin review.' }, { status: 403 });

    const { data: slugMatch, error: slugError } = await auth.admin.from('events').select('id').eq('slug', data.slug).neq('id', id).maybeSingle();
    if (slugError) throw slugError;
    if (slugMatch) return NextResponse.json({ error: 'That event URL slug is already in use.' }, { status: 409 });

    const now = new Date().toISOString();
    const { data: event, error: updateError } = await auth.admin.from('events').update({ title: data.title, slug: data.slug, short_description: data.short_description, description: data.description, category_id: data.category_id, start_at: data.start_at, end_at: data.end_at, capacity: data.capacity, registration_deadline: data.registration_deadline, price: data.price, currency: data.currency.toUpperCase(), cover_image: data.cover_image, status: data.status, registration_open: data.registration_enabled, published_at: data.status === 'PUBLISHED' ? (existing.status === 'PUBLISHED' ? undefined : now) : null, updated_by: auth.profile.id, updated_at: now }).eq('id', id).select('id,title,slug,status,updated_at').single();
    if (updateError) throw updateError;

    if (existing.venue_id) {
      const { error: venueError } = await auth.admin.from('venues').update({ name: data.venue_name, address: data.venue_address, city: data.venue_city, google_maps_url: data.google_maps_url, capacity: data.capacity }).eq('id', existing.venue_id);
      if (venueError) throw venueError;
    }

    await auth.admin.from('audit_logs').insert({ actor_user_id: auth.profile.id, action: 'EVENT_UPDATED', entity_type: 'EVENT', entity_id: id, metadata: { role: auth.role, title: data.title, previous_status: existing.status, new_status: data.status } });
    return NextResponse.json({ event });
  } catch (error) { console.error('[ADMIN EVENT EDIT][PATCH]', error); return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update event.' }, { status: 500 }); }
}
