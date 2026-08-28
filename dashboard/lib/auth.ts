import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const DASHBOARD_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'HOST',
  'EVENT_MANAGER',
  'CHECKIN_STAFF',
  'EDITOR',
  'FINANCE',
  'SUPPORT',
] as const;

export type DashboardRole = (typeof DASHBOARD_ROLES)[number];

const ROLE_PRIORITY: DashboardRole[] = [
  'SUPER_ADMIN', 'ADMIN', 'FINANCE', 'EVENT_MANAGER', 'HOST', 'CHECKIN_STAFF', 'EDITOR', 'SUPPORT',
];

function normalizeRoles(value: unknown): DashboardRole[] {
  if (!Array.isArray(value)) return [];
  return value.filter((role): role is DashboardRole => typeof role === 'string' && DASHBOARD_ROLES.includes(role as DashboardRole));
}

function getPrimaryRole(roles: DashboardRole[]) {
  return ROLE_PRIORITY.find((role) => roles.includes(role)) || null;
}

export async function getDashboardAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, role: null as DashboardRole | null, roles: [] as DashboardRole[], mustChangePassword: false };

  const { data: rolesData, error } = await supabase.rpc('get_my_dashboard_roles');
  if (error) {
    console.error('Dashboard roles lookup failed:', error);
    return { user, role: null as DashboardRole | null, roles: [] as DashboardRole[], mustChangePassword: false };
  }

  const roles = normalizeRoles(rolesData);
  const role = getPrimaryRole(roles);
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('must_change_password')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (profileError) console.error('Dashboard profile lookup failed:', profileError);

  return {
    user,
    role,
    roles,
    mustChangePassword: profile?.must_change_password === true,
  };
}

export async function requireDashboardAuth(options?: { allowPasswordSetup?: boolean }) {
  const auth = await getDashboardAuth();
  if (!auth.user) redirect('/login');
  if (!auth.roles.length || !auth.role) redirect('/unauthorized');
  if (auth.mustChangePassword && !options?.allowPasswordSetup) redirect('/change-password');
  return auth as { user: NonNullable<typeof auth.user>; role: DashboardRole; roles: DashboardRole[]; mustChangePassword: boolean };
}
