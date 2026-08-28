import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentDashboardRoles, hasDashboardRole } from '@/lib/dashboard-rbac';

export const runtime = 'nodejs';
const MANAGE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] as const;

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
};

type EventCategoryRow = {
  id: string;
  category_id: string | null;
};

const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  icon: z.string().trim().max(60).nullable().optional(),
  description: z.string().trim().max(500).nullable().optional(),
  display_order: z.number().int().min(0).max(10000).optional(),
  is_active: z.boolean().optional(),
});

async function requireManager() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  const { roles, error } = await getCurrentDashboardRoles(supabase);
  if (error) return { error: NextResponse.json({ error: 'Unable to resolve dashboard roles.' }, { status: 500 }) };
  if (!hasDashboardRole(roles, MANAGE_ROLES)) return { error: NextResponse.json({ error: 'You do not have category management permission.' }, { status: 403 }) };
  return { supabase, roles };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: sessionData } = await supabase.auth.getUser();
    if (!sessionData.user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: categories, error } = await admin
      .from('event_categories')
      .select('id,name,slug,icon,description,display_order,is_active')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
    if (error) throw error;

    const { data: events, error: eventError } = await admin
      .from('events')
      .select('id,category_id')
      .eq('status', 'PUBLISHED');
    if (eventError) throw eventError;

    const counts = new Map<string, number>();
    for (const event of (events ?? []) as EventCategoryRow[]) {
      if (event.category_id) counts.set(event.category_id, (counts.get(event.category_id) ?? 0) + 1);
    }

    const rows = (categories ?? []) as CategoryRow[];
    return NextResponse.json({
      categories: rows.map((category: CategoryRow) => ({
        ...category,
        active_events: counts.get(category.id) ?? 0,
      })),
    });
  } catch (error) {
    console.error('[DASHBOARD CATEGORIES][GET]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load categories.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireManager();
  if ('error' in auth) return auth.error;
  try {
    const parsed = categorySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Enter a valid category name and slug.' }, { status: 400 });
    const data = parsed.data;
    const admin = getSupabaseAdmin();
    const { data: category, error } = await admin.from('event_categories').insert({ name: data.name, slug: data.slug, icon: data.icon || null, description: data.description || null, display_order: data.display_order ?? 100, is_active: true }).select('id,name,slug,icon,description,display_order,is_active').single();
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'A category with that slug already exists.' }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('[DASHBOARD CATEGORIES][POST]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create category.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireManager();
  if ('error' in auth) return auth.error;
  try {
    const body = await request.json().catch(() => null) as ({ id?: string } & Record<string, unknown>) | null;
    const id = body?.id;
    if (!id || typeof id !== 'string') return NextResponse.json({ error: 'Category id is required.' }, { status: 400 });
    const { id: _ignored, ...candidate } = body;
    const parsed = categorySchema.partial().safeParse(candidate);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid category details.' }, { status: 400 });
    if (Object.keys(parsed.data).length === 0) return NextResponse.json({ error: 'No category changes supplied.' }, { status: 400 });
    const admin = getSupabaseAdmin();
    const { data: category, error } = await admin.from('event_categories').update(parsed.data).eq('id', id).select('id,name,slug,icon,description,display_order,is_active').single();
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'A category with that slug already exists.' }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ category });
  } catch (error) {
    console.error('[DASHBOARD CATEGORIES][PATCH]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update category.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireManager();
  if ('error' in auth) return auth.error;
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Category id is required.' }, { status: 400 });
    const admin = getSupabaseAdmin();
    const { count, error: countError } = await admin.from('events').select('id', { count: 'exact', head: true }).eq('category_id', id);
    if (countError) throw countError;
    if ((count ?? 0) > 0) return NextResponse.json({ error: 'This category is assigned to events. Deactivate it instead of deleting it.' }, { status: 409 });
    const { error } = await admin.from('event_categories').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[DASHBOARD CATEGORIES][DELETE]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to delete category.' }, { status: 500 });
  }
}
