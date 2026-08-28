import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

type RoleResult = string[] | null;
type TagRow = { id: string; name: string; slug: string; description: string | null; is_active: boolean; created_at: string; updated_at: string };

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  const { data: roleData, error } = await supabase.rpc('get_my_dashboard_roles');
  const roles = roleData as RoleResult;
  if (error || !roles?.some(role => ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'EDITOR'].includes(role))) return { error: NextResponse.json({ error: 'You do not have event tag management permission.' }, { status: 403 }) };
  return { admin: getSupabaseAdmin() };
}

const schema = z.object({ name: z.string().trim().min(2).max(60), description: z.string().trim().max(200).nullable().optional(), is_active: z.boolean().optional() });
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 80);

export async function GET() {
  const auth = await requireAdmin(); if ('error' in auth) return auth.error;
  const { data, error } = await auth.admin.from('event_tags').select('id,name,slug,description,is_active,created_at,updated_at').order('name');
  if (error) return NextResponse.json({ error: 'Unable to load event tags.' }, { status: 500 });
  return NextResponse.json({ tags: (data ?? []) as TagRow[] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(); if ('error' in auth) return auth.error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid tag name.' }, { status: 400 });
  const data = parsed.data; const slug = slugify(data.name);
  const { data: tag, error } = await auth.admin.from('event_tags').insert({ name: data.name, slug, description: data.description ?? null, is_active: data.is_active ?? true }).select('*').single();
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'An event tag with this name already exists.' : 'Unable to create event tag.' }, { status: error.code === '23505' ? 409 : 500 });
  return NextResponse.json({ tag }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(); if ('error' in auth) return auth.error;
  const parsed = schema.extend({ id: z.string().uuid() }).partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success || !parsed.data.id) return NextResponse.json({ error: 'A valid tag is required.' }, { status: 400 });
  const { id, ...changes } = parsed.data; const update: Record<string, unknown> = { ...changes, updated_at: new Date().toISOString() }; if (changes.name) update.slug = slugify(changes.name);
  const { data: tag, error } = await auth.admin.from('event_tags').update(update).eq('id', id).select('*').single();
  if (error) return NextResponse.json({ error: 'Unable to update event tag.' }, { status: 500 });
  return NextResponse.json({ tag });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(); if ('error' in auth) return auth.error;
  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'A valid tag is required.' }, { status: 400 });
  const { error } = await auth.admin.from('event_tags').delete().eq('id', parsed.data.id);
  if (error) return NextResponse.json({ error: 'Unable to delete event tag.' }, { status: 500 });
  return NextResponse.json({ message: 'Event tag deleted.' });
}
