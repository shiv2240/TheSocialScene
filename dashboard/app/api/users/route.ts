import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { MANAGEABLE_DASHBOARD_ROLES, provisionDashboardUser, type ManageableDashboardRole } from '@/lib/dashboard-user-provisioning';

export const runtime = 'nodejs';

const createUserSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(8).max(20).optional().or(z.literal('')),
  role: z.enum(MANAGEABLE_DASHBOARD_ROLES),
});

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  const { data: role, error } = await supabase.rpc('get_my_dashboard_role');
  if (error) return { error: NextResponse.json({ error: 'Unable to resolve dashboard role.' }, { status: 500 }) };
  if (role !== 'SUPER_ADMIN') return { error: NextResponse.json({ error: 'Only Super Admins can manage dashboard users.' }, { status: 403 }) };
  return { supabase, user };
}

type ProfileRow = {
  id: string;
  auth_user_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  must_change_password: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};
type RoleMappingRow = { user_id: string; role_id: string };
type RoleRow = { id: string; name: string; description: string | null };

export async function GET() {
  const auth = await requireSuperAdmin();
  if ('error' in auth) return auth.error;

  try {
    // Use the authenticated client for reads. RBAC read policies grant a
    // SUPER_ADMIN access to dashboard profiles, role mappings and definitions.
    // This keeps GET /api/users functional without requiring the service-role
    // secret in the deployment environment.
    const { data: profiles, error: profilesError } = await auth.supabase
      .from('profiles')
      .select('id,auth_user_id,full_name,email,phone,status,must_change_password,created_at,updated_at')
      .not('auth_user_id', 'is', null)
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    const profileRows = (profiles ?? []) as ProfileRow[];
    const profileIds = profileRows.map((profile: ProfileRow) => profile.id);

    let roleMappings: RoleMappingRow[] = [];
    let roles: RoleRow[] = [];

    if (profileIds.length > 0) {
      const { data: mappings, error: mappingsError } = await auth.supabase
        .from('user_roles')
        .select('user_id,role_id')
        .in('user_id', profileIds);
      if (mappingsError) throw mappingsError;

      roleMappings = (mappings ?? []) as RoleMappingRow[];
      const roleIds = [...new Set(roleMappings.map((mapping) => mapping.role_id))];

      if (roleIds.length > 0) {
        const { data: roleRows, error: rolesError } = await auth.supabase
          .from('roles')
          .select('id,name,description')
          .in('id', roleIds);
        if (rolesError) throw rolesError;
        roles = (roleRows ?? []) as RoleRow[];
      }
    }

    const roleById = new Map(roles.map((role) => [role.id, role]));
    const roleByUserId = new Map<string, { name: string; description: string | null }>();

    for (const mapping of roleMappings) {
      const role = roleById.get(mapping.role_id);
      if (role && !roleByUserId.has(mapping.user_id)) {
        roleByUserId.set(mapping.user_id, { name: role.name, description: role.description });
      }
    }

    const users = profileRows.map((profile: ProfileRow) => {
      const role = roleByUserId.get(profile.id);
      return {
        id: profile.id,
        auth_user_id: profile.auth_user_id,
        name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        status: profile.status,
        must_change_password: profile.must_change_password,
        created_at: profile.created_at,
        role: role?.name || 'UNASSIGNED',
        role_description: role?.description || null,
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('[DASHBOARD USERS][GET]', error);
    return NextResponse.json({
      error: 'Unable to load dashboard users.',
      ...(process.env.NODE_ENV !== 'production' && { detail: error instanceof Error ? error.message : String(error) }),
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if ('error' in auth) return auth.error;

  try {
    const parsed = createUserSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Enter a valid name, email, phone and role.' }, { status: 400 });

    const admin = getSupabaseAdmin();
    const email = parsed.data.email.toLowerCase();
    const { data: existingProfile, error: lookupError } = await admin.from('profiles').select('id,auth_user_id').ilike('email', email).maybeSingle();
    if (lookupError) throw lookupError;
    if (existingProfile?.auth_user_id) return NextResponse.json({ error: 'A dashboard account already exists for this email address.' }, { status: 409 });

    const provisioned = await provisionDashboardUser({
      fullName: parsed.data.full_name,
      email,
      phone: parsed.data.phone || null,
      role: parsed.data.role as ManageableDashboardRole,
    });

    const { data: actorProfile } = await admin.from('profiles').select('id').eq('auth_user_id', auth.user.id).maybeSingle();
    if (actorProfile) {
      await admin.from('audit_logs').insert({
        actor_user_id: actorProfile.id,
        action: 'DASHBOARD_USER_CREATED',
        entity_type: 'PROFILE',
        entity_id: provisioned.profileId,
        metadata: { role: provisioned.role, email: provisioned.email },
      });
    }

    return NextResponse.json({ user: provisioned, message: 'Invitation sent. The user must set a password before first dashboard use.' }, { status: 201 });
  } catch (error) {
    console.error('[DASHBOARD USERS][POST]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create dashboard user.' }, { status: 500 });
  }
}
