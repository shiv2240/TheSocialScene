import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { MANAGEABLE_DASHBOARD_ROLES, provisionDashboardUser, type ManageableDashboardRole } from '@/lib/dashboard-user-provisioning';

export const runtime = 'nodejs';
const DASHBOARD_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HOST', 'EVENT_MANAGER', 'CHECKIN_STAFF', 'EDITOR', 'FINANCE', 'SUPPORT'] as const;
const dashboardRoleSchema = z.enum(DASHBOARD_ROLES);
const createUserSchema = z.object({ full_name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(200), phone: z.string().trim().min(8).max(20).optional().or(z.literal('')), role: z.enum(MANAGEABLE_DASHBOARD_ROLES) });
const updateUserSchema = z.object({ id: z.string().uuid(), full_name: z.string().trim().min(2).max(100).optional(), phone: z.string().trim().min(8).max(20).optional().nullable(), roles: z.array(dashboardRoleSchema).max(DASHBOARD_ROLES.length).optional(), role: dashboardRoleSchema.nullable().optional(), status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING']).optional() });

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  const { data: roles, error } = await supabase.rpc('get_my_dashboard_roles');
  if (error) return { error: NextResponse.json({ error: 'Unable to resolve dashboard roles.' }, { status: 500 }) };
  if (!Array.isArray(roles) || !roles.includes('SUPER_ADMIN')) return { error: NextResponse.json({ error: 'Only Super Admins can manage dashboard users.' }, { status: 403 }) };
  return { supabase, user };
}

type ProfileRow = { id: string; auth_user_id: string | null; full_name: string | null; username: string | null; age: number | null; onboarding_completed: boolean | null; email: string | null; phone: string | null; status: string | null; must_change_password: boolean | null; created_at: string | null; updated_at: string | null };
type RoleMappingRow = { user_id: string; role_id: string };
type RoleRow = { id: string; name: string; description: string | null };

type UserRoleMapping = { role_id: string };
type NamedRole = { name: string };
type RoleIdRow = { id: string; name: string };

export async function GET() {
  const auth = await requireSuperAdmin();
  if ('error' in auth) return auth.error;
  try {
    const { data: profiles, error: profilesError } = await auth.supabase.from('profiles').select('id,auth_user_id,full_name,username,age,onboarding_completed,email,phone,status,must_change_password,created_at,updated_at').not('auth_user_id', 'is', null).order('created_at', { ascending: false });
    if (profilesError) throw profilesError;
    const profileRows = (profiles ?? []) as ProfileRow[];
    const profileIds = profileRows.map((profile) => profile.id);
    let roleMappings: RoleMappingRow[] = []; let roles: RoleRow[] = [];
    if (profileIds.length > 0) {
      const { data: mappings, error: mappingsError } = await auth.supabase.from('user_roles').select('user_id,role_id').in('user_id', profileIds);
      if (mappingsError) throw mappingsError;
      roleMappings = (mappings ?? []) as RoleMappingRow[];
      const roleIds = [...new Set(roleMappings.map((mapping) => mapping.role_id))];
      if (roleIds.length > 0) { const { data: roleRows, error: rolesError } = await auth.supabase.from('roles').select('id,name,description').in('id', roleIds); if (rolesError) throw rolesError; roles = (roleRows ?? []) as RoleRow[]; }
    }
    const roleById = new Map(roles.map((role) => [role.id, role])); const rolesByUserId = new Map<string, RoleRow[]>();
    for (const mapping of roleMappings) { const role = roleById.get(mapping.role_id); if (!role) continue; const current = rolesByUserId.get(mapping.user_id) || []; current.push(role); rolesByUserId.set(mapping.user_id, current); }
    const users = profileRows.map((profile) => {
      const userRoles = rolesByUserId.get(profile.id) || []; const sortedRoles = [...userRoles].sort((a, b) => a.name.localeCompare(b.name));
      const primaryRole = sortedRoles.find((role) => role.name === 'SUPER_ADMIN')?.name || sortedRoles.find((role) => role.name === 'ADMIN')?.name || sortedRoles[0]?.name || 'UNASSIGNED';
      return { id: profile.id, user_id: profile.username ? `@${profile.username}` : null, auth_user_id: profile.auth_user_id, name: profile.full_name, age: profile.age, onboarding_completed: profile.onboarding_completed, email: profile.email, phone: profile.phone, status: profile.status, must_change_password: profile.must_change_password, created_at: profile.created_at, role: primaryRole, roles: sortedRoles.map((role) => role.name), role_descriptions: sortedRoles.map((role) => ({ name: role.name, description: role.description })), role_description: sortedRoles.find((role) => role.name === primaryRole)?.description || null };
    });
    return NextResponse.json({ users });
  } catch (error) { console.error('[DASHBOARD USERS][GET]', error); return NextResponse.json({ error: 'Unable to load dashboard users.', ...(process.env.NODE_ENV !== 'production' && { detail: error instanceof Error ? error.message : String(error) }) }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if ('error' in auth) return auth.error;
  try {
    const parsed = createUserSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Enter a valid name, email, phone and role.' }, { status: 400 });
    const admin = getSupabaseAdmin(); const email = parsed.data.email.toLowerCase();
    const { data: existingProfile, error: lookupError } = await admin.from('profiles').select('id,auth_user_id').ilike('email', email).maybeSingle();
    if (lookupError) throw lookupError;
    if (existingProfile?.auth_user_id) return NextResponse.json({ error: 'A dashboard account already exists for this email address.' }, { status: 409 });
    const provisioned = await provisionDashboardUser({ fullName: parsed.data.full_name, email, phone: parsed.data.phone || null, role: parsed.data.role as ManageableDashboardRole });
    const { data: actorProfile } = await admin.from('profiles').select('id').eq('auth_user_id', auth.user.id).maybeSingle();
    if (actorProfile) await admin.from('audit_logs').insert({ actor_user_id: actorProfile.id, action: 'DASHBOARD_USER_CREATED', entity_type: 'PROFILE', entity_id: provisioned.profileId, metadata: { roles: [provisioned.role], email: provisioned.email } });
    return NextResponse.json({ user: { ...provisioned, roles: [provisioned.role] }, message: 'Invitation sent. The user must set a password before first dashboard use.' }, { status: 201 });
  } catch (error) { console.error('[DASHBOARD USERS][POST]', error); return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create dashboard user.' }, { status: 500 }); }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if ('error' in auth) return auth.error;
  try {
    const parsed = updateUserSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid user update parameters.' }, { status: 400 });
    const admin = getSupabaseAdmin();
    const { data: targetProfile, error: profileLookupError } = await admin.from('profiles').select('id,auth_user_id,email,full_name,phone,status').eq('id', parsed.data.id).maybeSingle();
    if (profileLookupError || !targetProfile) return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });

    const requestedRoles = parsed.data.roles !== undefined ? [...new Set(parsed.data.roles)] : parsed.data.role !== undefined ? (parsed.data.role ? [parsed.data.role] : []) : undefined;
    const changingOwnRoles = targetProfile.auth_user_id === auth.user.id && requestedRoles !== undefined;
    const changingOwnStatus = targetProfile.auth_user_id === auth.user.id && parsed.data.status === 'SUSPENDED';
    if (changingOwnRoles && !requestedRoles?.includes('SUPER_ADMIN')) return NextResponse.json({ error: 'You cannot remove your own Super Admin role.' }, { status: 400 });
    if (changingOwnStatus) return NextResponse.json({ error: 'You cannot suspend your own Super Admin access.' }, { status: 400 });

    let requestedRoleRows: RoleIdRow[] = [];
    let oldRoleIds: string[] = [];
    let oldRoles: string[] = [];
    if (requestedRoles !== undefined) {
      const { data: roleRows, error: roleLookupError } = requestedRoles.length ? await admin.from('roles').select('id,name').in('name', requestedRoles) : { data: [] as RoleIdRow[], error: null };
      if (roleLookupError) throw roleLookupError;
      requestedRoleRows = (roleRows ?? []) as RoleIdRow[];
      const foundNames = new Set(requestedRoleRows.map((role: RoleIdRow) => role.name));
      const missingRoles = requestedRoles.filter((name) => !foundNames.has(name));
      if (missingRoles.length) return NextResponse.json({ error: `Roles not configured: ${missingRoles.join(', ')}` }, { status: 400 });
      const { data: oldMappings, error: oldMappingError } = await admin.from('user_roles').select('role_id').eq('user_id', targetProfile.id);
      if (oldMappingError) throw oldMappingError;
      const oldMappingRows = (oldMappings ?? []) as UserRoleMapping[];
      oldRoleIds = oldMappingRows.map((mapping: UserRoleMapping) => mapping.role_id);
      if (oldRoleIds.length) { const { data: oldRoleRows, error: oldRoleError } = await admin.from('roles').select('name').in('id', oldRoleIds); if (oldRoleError) throw oldRoleError; oldRoles = ((oldRoleRows ?? []) as NamedRole[]).map((row: NamedRole) => row.name); }
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.data.full_name) updates.full_name = parsed.data.full_name;
    if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone || null;
    if (parsed.data.status) updates.status = parsed.data.status;
    const { error: updateError } = await admin.from('profiles').update(updates).eq('id', targetProfile.id);
    if (updateError) throw updateError;

    if (requestedRoles !== undefined) {
      const { error: deleteError } = await admin.from('user_roles').delete().eq('user_id', targetProfile.id);
      if (deleteError) throw deleteError;
      if (requestedRoleRows.length) {
        const { error: insertError } = await admin.from('user_roles').insert(requestedRoleRows.map((role: RoleIdRow) => ({ user_id: targetProfile.id, role_id: role.id })));
        if (insertError) {
          await admin.from('user_roles').delete().eq('user_id', targetProfile.id);
          if (oldRoleIds.length) await admin.from('user_roles').insert(oldRoleIds.map((roleId: string) => ({ user_id: targetProfile.id, role_id: roleId })));
          throw insertError;
        }
      }
    }

    const { data: actorProfile } = await admin.from('profiles').select('id').eq('auth_user_id', auth.user.id).maybeSingle();
    if (actorProfile) await admin.from('audit_logs').insert({ actor_user_id: actorProfile.id, action: 'DASHBOARD_USER_UPDATED', entity_type: 'PROFILE', entity_id: targetProfile.id, metadata: { previous_roles: oldRoles, new_roles: requestedRoles, new_status: parsed.data.status, email: targetProfile.email } });
    return NextResponse.json({ message: 'User access updated successfully.', roles: requestedRoles });
  } catch (error) { console.error('[DASHBOARD USERS][PATCH]', error); return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update user.' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if ('error' in auth) return auth.error;
  try {
    const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'A valid user is required.' }, { status: 400 });
    const admin = getSupabaseAdmin();
    const { data: target, error: lookupError } = await admin.from('profiles').select('id,auth_user_id,email').eq('id', parsed.data.id).maybeSingle();
    if (lookupError || !target) return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    if (target.auth_user_id === auth.user.id) return NextResponse.json({ error: 'You cannot remove your own dashboard access.' }, { status: 400 });
    const { error: deleteRolesError } = await admin.from('user_roles').delete().eq('user_id', target.id);
    if (deleteRolesError) throw deleteRolesError;
    const { error: statusError } = await admin.from('profiles').update({ status: 'SUSPENDED', updated_at: new Date().toISOString() }).eq('id', target.id);
    if (statusError) throw statusError;
    const { data: actorProfile } = await admin.from('profiles').select('id').eq('auth_user_id', auth.user.id).maybeSingle();
    if (actorProfile) await admin.from('audit_logs').insert({ actor_user_id: actorProfile.id, action: 'DASHBOARD_ACCESS_REVOKED', entity_type: 'PROFILE', entity_id: target.id, metadata: { email: target.email, roles: [] } });
    return NextResponse.json({ message: 'Dashboard access removed. The account remains retained for audit history.' });
  } catch (error) { console.error('[DASHBOARD USERS][DELETE]', error); return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to remove dashboard access.' }, { status: 500 }); }
}
