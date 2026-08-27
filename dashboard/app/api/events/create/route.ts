import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const EVENT_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'HOST', 'EVENT_MANAGER', 'EDITOR']);

const eventSchema = z.object({
  title: z.string().trim().min(3).max(160),
  slug: z.string().trim().min(3).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  short_description: z.string().trim().min(10).max(300),
  description: z.string().trim().min(20).max(20000),
  category_id: z.string().uuid().nullable().optional(),
  cover_image: z.string().url().nullable().optional(),
  start_at: z.string().datetime({ offset: true }),
  end_at: z.string().datetime({ offset: true }),
  venue_name: z.string().trim().min(2).max(160),
  venue_address: z.string().trim().min(5).max(500),
  venue_city: z.string().trim().min(2).max(100),
  google_maps_url: z.string().url().nullable().optional(),
  capacity: z.number().int().min(1).max(100000),
  registration_deadline: z.string().datetime({ offset: true }).nullable().optional(),
  price: z.number().min(0).max(10000000),
  currency: z.string().length(3).default('INR'),
  registration_enabled: z.boolean().default(true),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
});

type RoleRow = { roles: { name?: string } | { name?: string }[] | null };

async function requireEventManager() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };

  const admin = getSupabaseAdmin();
  const { data: profile, error: profileError } = await admin.from('profiles').select('id,full_name').eq('auth_user_id', user.id).maybeSingle();
  if (profileError || !profile) return { error: NextResponse.json({ error: 'Staff profile not found.' }, { status: 400 }) };

  const { data: roleRows, error: roleError } = await admin.from('user_roles').select('roles(name)').eq('user_id', profile.id);
  if (roleError) return { error: NextResponse.json({ error: 'Unable to resolve dashboard role.' }, { status: 500 }) };
  const roles: string[] = [];
  for (const row of (roleRows ?? []) as RoleRow[]) { const value = row.roles; const name = Array.isArray(value) ? value[0]?.name : value?.name; if (name) roles.push(name); }
  const role = roles.find((value) => EVENT_ROLES.has(value));
  if (!role) return { error: NextResponse.json({ error: 'You do not have event creation permission.' }, { status: 403 }) };
  return { admin, profile, role };
}

export async function POST(request: NextRequest) {
  const auth = await requireEventManager();
  if ('error' in auth) return auth.error;
  try {
    const parsed = eventSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Please complete all required event fields.', details: parsed.error.flatten() }, { status: 400 });
    const data = parsed.data;
    const start = new Date(data.start_at);
    const end = new Date(data.end_at);
    if (end <= start) return NextResponse.json({ error: 'End time must be after start time.' }, { status: 400 });
    if (data.registration_deadline && new Date(data.registration_deadline) > start) return NextResponse.json({ error: 'Registration deadline cannot be after the event starts.' }, { status: 400 });
    if (data.status === 'PUBLISHED' && (!data.cover_image || auth.role === 'HOST')) return NextResponse.json({ error: auth.role === 'HOST' ? 'Hosts can create events as drafts. Publishing requires admin approval.' : 'A cover image is required before publishing.' }, { status: 400 });

    const { data: existing, error: slugError } = await auth.admin.from('events').select('id').eq('slug', data.slug).maybeSingle();
    if (slugError) throw slugError;
    if (existing) return NextResponse.json({ error: 'That event URL slug is already in use.' }, { status: 409 });

    const venueSlugBase = data.venue_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 80) || `venue-${Date.now()}`;
    const { data: venue, error: venueError } = await auth.admin.from('venues').insert({ name: data.venue_name, slug: `${venueSlugBase}-${Date.now().toString(36)}`, address: data.venue_address, city: data.venue_city, google_maps_url: data.google_maps_url || null, capacity: data.capacity }).select('id').single();
    if (venueError) throw venueError;

    const eventStatus = auth.role === 'HOST' ? 'DRAFT' : data.status;
    const { data: event, error: eventError } = await auth.admin.from('events').insert({
      title: data.title, slug: data.slug, short_description: data.short_description, description: data.description,
      category_id: data.category_id || null, host_id: auth.profile.id, venue_id: venue.id, start_at: data.start_at, end_at: data.end_at,
      capacity: data.capacity, registered_count: 0, registration_deadline: data.registration_deadline || null, price: data.price,
      currency: data.currency.toUpperCase(), cover_image: data.cover_image || null, status: eventStatus, featured: false,
      registration_open: data.registration_enabled, created_by: auth.profile.id, updated_by: auth.profile.id,
      published_at: eventStatus === 'PUBLISHED' ? new Date().toISOString() : null,
    }).select('id,title,slug,status,cover_image').single();

    if (eventError) { await auth.admin.from('venues').delete().eq('id', venue.id); throw eventError; }

    await auth.admin.from('audit_logs').insert({ actor_user_id: auth.profile.id, action: 'EVENT_CREATED', entity_type: 'EVENT', entity_id: event.id, metadata: { role: auth.role, title: data.title, status: eventStatus } });
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('[ADMIN EVENTS][CREATE]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create event.' }, { status: 500 });
  }
}
