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

export async function getDashboardAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, role: null as DashboardRole | null };

  const { data: role, error } = await supabase.rpc('get_my_dashboard_role');
  if (error) {
    console.error('Dashboard role lookup failed:', error);
    return { user, role: null as DashboardRole | null };
  }

  return {
    user,
    role: (DASHBOARD_ROLES.includes(role as DashboardRole) ? role : null) as DashboardRole | null,
  };
}

export async function requireDashboardAuth() {
  const auth = await getDashboardAuth();
  if (!auth.user) redirect('/login');
  if (!auth.role) redirect('/unauthorized');
  return auth as { user: NonNullable<typeof auth.user>; role: DashboardRole };
}
