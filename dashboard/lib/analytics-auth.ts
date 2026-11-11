import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type AnalyticsAuthResult =
  | { ok: true; userId: string; roles: string[] }
  | { ok: false; response: NextResponse };

/**
 * Authorize access to privileged analytics endpoints using the database-backed
 * dashboard role assignment. Never trust a role supplied by the browser.
 */
export async function requireAnalyticsAccess(allowedRoles: readonly string[]): Promise<AnalyticsAuthResult> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  }

  const { data, error } = await supabase.rpc('get_my_dashboard_roles');
  if (error) {
    console.error('[ANALYTICS AUTH][ROLES]', error);
    return { ok: false, response: NextResponse.json({ error: 'Unable to verify dashboard permissions.' }, { status: 500 }) };
  }

  const roles = Array.isArray(data) ? data.filter((role): role is string => typeof role === 'string') : [];
  if (!roles.some((role) => allowedRoles.includes(role))) {
    return { ok: false, response: NextResponse.json({ error: 'You do not have permission to access these analytics.' }, { status: 403 }) };
  }

  return { ok: true, userId: user.id, roles };
}
