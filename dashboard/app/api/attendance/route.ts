import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentDashboardRoles, hasDashboardRole, isOnlyHostRole } from '@/lib/dashboard-rbac';

export const runtime = 'nodejs';
const REGISTRATION_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HOST', 'EVENT_MANAGER', 'SUPPORT'] as const;
type CheckinTicket = { registration_id: string | null; ticket_code: string | null };
type CheckinRow = { id: string; ticket_id: string; user_id: string; checked_in_at: string; tickets: CheckinTicket | CheckinTicket[] | null };

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const { roles, error: roleError } = await getCurrentDashboardRoles(supabase);
    if (roleError || !hasDashboardRole(roles, REGISTRATION_ROLES)) return NextResponse.json({ error: 'You do not have attendance access.' }, { status: 403 });

    const admin = getSupabaseAdmin();
    const { data: profile, error: profileError } = await admin.from('profiles').select('id').eq('auth_user_id', user.id).maybeSingle();
    if (profileError || !profile) return NextResponse.json({ error: 'Dashboard profile not found.' }, { status: 400 });

    const eventId = request.nextUrl.searchParams.get('event_id');
    if (!eventId) return NextResponse.json({ error: 'event_id is required.' }, { status: 400 });

    const { data: event, error: eventError } = await admin.from('events').select('id,end_at,host_id').eq('id', eventId).maybeSingle();
    if (eventError) throw eventError;
    if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    if (isOnlyHostRole(roles) && event.host_id !== profile.id) return NextResponse.json({ error: 'You do not have access to this event.' }, { status: 403 });

    const { data: checkins, error: checkinError } = await admin.from('checkins').select('id,ticket_id,user_id,checked_in_at,tickets!inner(registration_id,ticket_code)').eq('event_id', eventId).order('checked_in_at', { ascending: false });
    if (checkinError) throw checkinError;

    const rows = ((checkins ?? []) as CheckinRow[]).map((checkin: CheckinRow) => {
      const ticket = Array.isArray(checkin.tickets) ? checkin.tickets[0] : checkin.tickets;
      return { id: checkin.id, ticket_id: checkin.ticket_id, registration_id: ticket?.registration_id ?? null, user_id: checkin.user_id, ticket_code: ticket?.ticket_code ?? null, checked_in_at: checkin.checked_in_at };
    });

    return NextResponse.json({ event, checkins: rows });
  } catch (error) {
    console.error('[ATTENDANCE][GET]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load attendance.' }, { status: 500 });
  }
}
