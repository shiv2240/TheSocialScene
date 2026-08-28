import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

type RoleRecord = {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
};

type UserRoleMapping = {
  role_id: string;
  user_id: string;
};

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  const { data: role, error } = await supabase.rpc('get_my_dashboard_role');
  if (error || role !== 'SUPER_ADMIN') return { error: NextResponse.json({ error: 'Only Super Admins can manage dashboard roles.' }, { status: 403 }) };
  return { user };
}

export async function GET() {
  const auth = await requireSuperAdmin();
  if ('error' in auth) return auth.error;
  try {
    const admin = getSupabaseAdmin();
    const { data: roleData, error } = await admin
      .from('roles')
      .select('id,name,description,is_system,created_at')
      .order('name');
    if (error) throw error;

    const roles = (roleData ?? []) as RoleRecord[];
    const roleIds = roles.map((role: RoleRecord) => role.id);
    const { data: mappingData, error: mappingError } = roleIds.length
      ? await admin.from('user_roles').select('role_id,user_id').in('role_id', roleIds)
      : { data: [], error: null };
    if (mappingError) throw mappingError;

    const mappings = (mappingData ?? []) as UserRoleMapping[];
    const counts = new Map<string, number>();
    for (const mapping of mappings) {
      counts.set(mapping.role_id, (counts.get(mapping.role_id) || 0) + 1);
    }

    return NextResponse.json({
      roles: roles.map((role: RoleRecord) => ({
        ...role,
        assigned_users: counts.get(role.id) || 0,
      })),
    });
  } catch (error) {
    console.error('[DASHBOARD ROLES][GET]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load dashboard roles.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if ('error' in auth) return auth.error;
  try {
    const parsed = z.object({ id: z.string().uuid(), description: z.string().trim().max(500) }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'A valid role and description are required.' }, { status: 400 });
    const admin = getSupabaseAdmin();
    const { data: role, error: roleError } = await admin.from('roles').select('id,name,is_system').eq('id', parsed.data.id).maybeSingle();
    if (roleError || !role) return NextResponse.json({ error: 'Role not found.' }, { status: 404 });
    const { error } = await admin.from('roles').update({ description: parsed.data.description }).eq('id', role.id);
    if (error) throw error;
    const { data: actor } = await admin.from('profiles').select('id').eq('auth_user_id', auth.user.id).maybeSingle();
    if (actor) await admin.from('audit_logs').insert({ actor_user_id: actor.id, action: 'DASHBOARD_ROLE_UPDATED', entity_type: 'ROLE', entity_id: role.id, metadata: { role: role.name, description: parsed.data.description } });
    return NextResponse.json({ message: 'Role description updated successfully.' });
  } catch (error) {
    console.error('[DASHBOARD ROLES][PATCH]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update role.' }, { status: 500 });
  }
}
