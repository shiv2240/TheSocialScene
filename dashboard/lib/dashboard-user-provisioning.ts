import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const MANAGEABLE_DASHBOARD_ROLES = [
  'ADMIN',
  'HOST',
  'EVENT_MANAGER',
  'CHECKIN_STAFF',
  'EDITOR',
  'FINANCE',
  'SUPPORT',
] as const;

export type ManageableDashboardRole = (typeof MANAGEABLE_DASHBOARD_ROLES)[number];

const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://admin.thesocialscene.club';

export async function provisionDashboardUser(input: {
  fullName: string;
  email: string;
  phone?: string | null;
  role: ManageableDashboardRole;
}) {
  const admin = getSupabaseAdmin();
  const email = input.email.trim().toLowerCase();

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: input.fullName.trim(), dashboard_role: input.role },
    redirectTo: `${dashboardUrl}/auth/callback?next=/change-password`,
  });

  if (inviteError) throw new Error(inviteError.message || 'Unable to create the dashboard invitation.');
  if (!invited.user) throw new Error('Dashboard invitation did not return a user.');

  const { data: profile, error: profileError } = await admin.from('profiles').select('id,auth_user_id,full_name,email').eq('auth_user_id', invited.user.id).single();
  if (profileError || !profile) {
    await admin.auth.admin.deleteUser(invited.user.id);
    throw new Error('Dashboard account was created but its profile could not be provisioned.');
  }

  const { error: profileUpdateError } = await admin.from('profiles').update({ full_name: input.fullName.trim(), phone: input.phone?.trim() || null, status: 'ACTIVE', must_change_password: true, updated_at: new Date().toISOString() }).eq('id', profile.id);
  if (profileUpdateError) {
    await admin.auth.admin.deleteUser(invited.user.id);
    throw new Error('Unable to finish dashboard profile provisioning.');
  }

  const { data: roleRow, error: roleLookupError } = await admin.from('roles').select('id').eq('name', input.role).single();
  if (roleLookupError || !roleRow) {
    await admin.auth.admin.deleteUser(invited.user.id);
    throw new Error(`Dashboard role ${input.role} is not configured.`);
  }

  const { error: roleInsertError } = await admin.from('user_roles').insert({ user_id: profile.id, role_id: roleRow.id });
  if (roleInsertError) {
    await admin.auth.admin.deleteUser(invited.user.id);
    throw new Error(roleInsertError.code === '23505' ? 'This user already has the selected dashboard role.' : 'Unable to assign the dashboard role.');
  }

  return { authUserId: invited.user.id, profileId: profile.id, role: input.role, email };
}
