import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentDashboardRoles, hasDashboardRole } from '@/lib/dashboard-rbac';

export const runtime = 'nodejs';
const CHECKIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HOST', 'EVENT_MANAGER', 'CHECKIN_STAFF'] as const;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    const { roles, error: roleError } = await getCurrentDashboardRoles(supabase);
    if (roleError || !hasDashboardRole(roles, CHECKIN_ROLES)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    const admin = getSupabaseAdmin();
    const { data: events, error } = await admin.from('events').select('id,title,start_at').eq('status', 'PUBLISHED').order('start_at', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ events: events || [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load events.' }, { status: 500 });
  }
}
