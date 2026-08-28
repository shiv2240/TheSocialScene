import type { SupabaseClient } from '@supabase/supabase-js';
import type { DashboardRole } from '@/lib/auth';

export async function getCurrentDashboardRoles(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc('get_my_dashboard_roles');
  if (error) return { roles: [] as DashboardRole[], error };
  const roles = Array.isArray(data)
    ? data.filter((role): role is DashboardRole => typeof role === 'string')
    : [];
  return { roles, error: null };
}

export function hasDashboardRole(roles: DashboardRole[], allowed: readonly DashboardRole[]) {
  return roles.some((role) => allowed.includes(role));
}

export function isOnlyHostRole(roles: DashboardRole[]) {
  return roles.includes('HOST') && !roles.some((role) => ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'EDITOR'].includes(role));
}
