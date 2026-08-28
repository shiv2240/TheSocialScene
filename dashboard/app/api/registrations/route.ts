import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentDashboardRoles, hasDashboardRole, isOnlyHostRole } from '@/lib/dashboard-rbac';

const REGISTRATION_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HOST', 'EVENT_MANAGER', 'SUPPORT'] as const;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { roles, error: roleError } = await getCurrentDashboardRoles(supabase);
  if (roleError || !roles.length) return NextResponse.json({ error: 'Unable to resolve dashboard roles.' }, { status: 403 });
  if (!hasDashboardRole(roles, REGISTRATION_ROLES)) return NextResponse.json({ error: 'You do not have registration access.' }, { status: 403 });

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('id').eq('auth_user_id', user.id).maybeSingle();
  if (!profile) return NextResponse.json({ error: 'Dashboard profile not found.' }, { status: 400 });

  let query = admin.from('registrations').select('id,registration_number,event_id,user_id,status,total_amount,currency,created_at,updated_at,events!inner(id,title,slug,host_id),profiles!inner(full_name,email,phone)').order('created_at', { ascending: false }).limit(500);
  if (isOnlyHostRole(roles)) query = query.eq('events.host_id', profile.id);

  const { data: registrations, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ registrations: registrations ?? [] });
}
