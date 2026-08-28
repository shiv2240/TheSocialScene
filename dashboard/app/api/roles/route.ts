import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

type RoleRecord = { id: string; name: string; description: string | null; is_system: boolean; created_at: string };
type PermissionRecord = { id: string; key: string; description: string | null; category: string };
type UserRoleMapping = { role_id: string; user_id: string };
type RolePermissionMapping = { role_id: string; permission_id: string };
type ProfileName = { id: string; full_name: string | null; email: string | null };
type AuthResult = { user: { id: string } } | { error: NextResponse };

async function requireSuperAdmin(): Promise<AuthResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  const { data: roles, error } = await supabase.rpc('get_my_dashboard_roles');
  if (error) return { error: NextResponse.json({ error: 'Unable to resolve dashboard roles.' }, { status: 500 }) };
  if (!Array.isArray(roles) || !roles.includes('SUPER_ADMIN')) return { error: NextResponse.json({ error: 'Only Super Admins can manage dashboard roles.' }, { status: 403 }) };
  return { user };
}

function normalizeRoleName(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

async function writeAudit(action: string, actorAuthId: string, entityId: string, metadata: Record<string, unknown>) {
  const admin = getSupabaseAdmin();
  const { data: actor } = await admin.from('profiles').select('id').eq('auth_user_id', actorAuthId).maybeSingle();
  if (actor) await admin.from('audit_logs').insert({ actor_user_id: actor.id, action, entity_type: 'ROLE', entity_id: entityId, metadata });
}

export async function GET() {
  const auth = await requireSuperAdmin();
  if ('error' in auth) return auth.error;
  try {
    const admin = getSupabaseAdmin();
    const [{ data: roleData, error: roleError }, { data: permissionData, error: permissionError }] = await Promise.all([
      admin.from('roles').select('id,name,description,is_system,created_at').order('name'),
      admin.from('permissions').select('id,key,description,category').order('category').order('key'),
    ]);
    if (roleError) throw roleError;
    if (permissionError) throw permissionError;
    const roles = (roleData ?? []) as RoleRecord[];
    const permissions = (permissionData ?? []) as PermissionRecord[];
    const roleIds = roles.map((role) => role.id);
    let roleMappings: UserRoleMapping[] = [];
    let permissionMappings: RolePermissionMapping[] = [];
    if (roleIds.length) {
      const [{ data: mappings, error: mappingError }, { data: permissionMappingsData, error: permissionMappingError }] = await Promise.all([
        admin.from('user_roles').select('role_id,user_id').in('role_id', roleIds),
        admin.from('role_permissions').select('role_id,permission_id').in('role_id', roleIds),
      ]);
      if (mappingError) throw mappingError;
      if (permissionMappingError) throw permissionMappingError;
      roleMappings = (mappings ?? []) as UserRoleMapping[];
      permissionMappings = (permissionMappingsData ?? []) as RolePermissionMapping[];
    }
    const userIds = [...new Set(roleMappings.map((mapping) => mapping.user_id))];
    let profiles: ProfileName[] = [];
    if (userIds.length) {
      const { data: profileData, error: profileError } = await admin.from('profiles').select('id,full_name,email').in('id', userIds);
      if (profileError) throw profileError;
      profiles = (profileData ?? []) as ProfileName[];
    }
    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
    const permissionById = new Map(permissions.map((permission) => [permission.id, permission]));
    const namesByRole = new Map<string, string[]>();
    const permissionKeysByRole = new Map<string, string[]>();
    for (const mapping of roleMappings) {
      const profile = profileById.get(mapping.user_id);
      if (!profile) continue;
      const label = profile.full_name?.trim() || profile.email || 'Unnamed user';
      const current = namesByRole.get(mapping.role_id) || [];
      current.push(label);
      namesByRole.set(mapping.role_id, current);
    }
    for (const mapping of permissionMappings) {
      const permission = permissionById.get(mapping.permission_id);
      if (!permission) continue;
      const current = permissionKeysByRole.get(mapping.role_id) || [];
      current.push(permission.key);
      permissionKeysByRole.set(mapping.role_id, current);
    }
    return NextResponse.json({
      roles: roles.map((role) => ({
        ...role,
        assigned_users: (namesByRole.get(role.id) || []).length,
        assigned_user_names: [...new Set(namesByRole.get(role.id) || [])].sort((a, b) => a.localeCompare(b)),
        permission_keys: [...new Set(permissionKeysByRole.get(role.id) || [])].sort(),
      })),
      permissions,
    });
  } catch (error) {
    console.error('[DASHBOARD ROLES][GET]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load dashboard roles.' }, { status: 500 });
  }
}

const createRoleSchema = z.object({ name: z.string().trim().min(2).max(60), description: z.string().trim().max(500).optional().default(''), permission_keys: z.array(z.string().min(1)).max(100).default([]) });
const updateRoleSchema = z.object({ id: z.string().uuid(), description: z.string().trim().max(500).optional(), permission_keys: z.array(z.string().min(1)).max(100).optional() });

async function resolvePermissionIds(permissionKeys: string[]): Promise<string[]> {
  const admin = getSupabaseAdmin();
  const uniqueKeys = [...new Set(permissionKeys)];
  if (!uniqueKeys.length) return [];
  const { data, error } = await admin.from('permissions').select('id,key').in('key', uniqueKeys);
  if (error) throw error;
  const rows = (data ?? []) as { id: string; key: string }[];
  const found = new Set(rows.map((row) => row.key));
  const missing = uniqueKeys.filter((key) => !found.has(key));
  if (missing.length) throw new Error(`Unknown permissions: ${missing.join(', ')}`);
  return rows.map((row) => row.id);
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if ('error' in auth) return auth.error;
  try {
    const parsed = createRoleSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Enter a valid role name, description and permissions.' }, { status: 400 });
    const name = normalizeRoleName(parsed.data.name);
    if (name.length < 2) return NextResponse.json({ error: 'Role name must contain at least two letters or numbers.' }, { status: 400 });
    if (name === 'SUPER_ADMIN') return NextResponse.json({ error: 'SUPER_ADMIN is reserved and cannot be recreated.' }, { status: 400 });
    const admin = getSupabaseAdmin();
    const { data: existing } = await admin.from('roles').select('id').eq('name', name).maybeSingle();
    if (existing) return NextResponse.json({ error: 'A role with this name already exists.' }, { status: 409 });
    const permissionIds = await resolvePermissionIds(parsed.data.permission_keys);
    const { data: role, error: roleError } = await admin.from('roles').insert({ name, description: parsed.data.description || null, is_system: false }).select('id,name,description,is_system,created_at').single();
    if (roleError || !role) throw roleError || new Error('Unable to create role.');
    if (permissionIds.length) {
      const { error: permissionInsertError } = await admin.from('role_permissions').insert(permissionIds.map((permissionId) => ({ role_id: role.id, permission_id: permissionId })));
      if (permissionInsertError) {
        await admin.from('roles').delete().eq('id', role.id);
        throw permissionInsertError;
      }
    }
    await writeAudit('DASHBOARD_ROLE_CREATED', auth.user.id, role.id, { role: name, permission_keys: parsed.data.permission_keys });
    return NextResponse.json({ role, message: 'Dashboard role created successfully.' }, { status: 201 });
  } catch (error) {
    console.error('[DASHBOARD ROLES][POST]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create role.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if ('error' in auth) return auth.error;
  try {
    const parsed = updateRoleSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid role update parameters.' }, { status: 400 });
    const admin = getSupabaseAdmin();
    const { data: role, error: roleError } = await admin.from('roles').select('id,name,is_system,description').eq('id', parsed.data.id).maybeSingle();
    if (roleError || !role) return NextResponse.json({ error: 'Role not found.' }, { status: 404 });
    if (role.name === 'SUPER_ADMIN' && parsed.data.permission_keys !== undefined) return NextResponse.json({ error: 'SUPER_ADMIN permissions are protected and cannot be changed.' }, { status: 400 });
    if (parsed.data.description !== undefined) {
      const { error } = await admin.from('roles').update({ description: parsed.data.description || null }).eq('id', role.id);
      if (error) throw error;
    }
    if (parsed.data.permission_keys !== undefined) {
      const permissionIds = await resolvePermissionIds(parsed.data.permission_keys);
      const { error: deleteError } = await admin.from('role_permissions').delete().eq('role_id', role.id);
      if (deleteError) throw deleteError;
      if (permissionIds.length) {
        const { error: insertError } = await admin.from('role_permissions').insert(permissionIds.map((permissionId) => ({ role_id: role.id, permission_id: permissionId })));
        if (insertError) throw insertError;
      }
    }
    await writeAudit('DASHBOARD_ROLE_UPDATED', auth.user.id, role.id, { role: role.name, description: parsed.data.description, permission_keys: parsed.data.permission_keys });
    return NextResponse.json({ message: 'Dashboard role updated successfully.' });
  } catch (error) {
    console.error('[DASHBOARD ROLES][PATCH]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update role.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if ('error' in auth) return auth.error;
  try {
    const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'A valid role is required.' }, { status: 400 });
    const admin = getSupabaseAdmin();
    const { data: role, error: roleError } = await admin.from('roles').select('id,name,is_system').eq('id', parsed.data.id).maybeSingle();
    if (roleError || !role) return NextResponse.json({ error: 'Role not found.' }, { status: 404 });
    if (role.is_system) return NextResponse.json({ error: 'System roles cannot be deleted.' }, { status: 400 });
    const { count, error: countError } = await admin.from('user_roles').select('id', { count: 'exact', head: true }).eq('role_id', role.id);
    if (countError) throw countError;
    if ((count ?? 0) > 0) return NextResponse.json({ error: 'Unassign this role from all users before deleting it.' }, { status: 409 });
    const { error: deleteError } = await admin.from('roles').delete().eq('id', role.id);
    if (deleteError) throw deleteError;
    await writeAudit('DASHBOARD_ROLE_DELETED', auth.user.id, role.id, { role: role.name });
    return NextResponse.json({ message: 'Dashboard role deleted successfully.' });
  } catch (error) {
    console.error('[DASHBOARD ROLES][DELETE]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to delete role.' }, { status: 500 });
  }
}
