import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const ALLOWED_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'HOST', 'EVENT_MANAGER', 'CHECKIN_STAFF']);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const { data: role } = await supabase.rpc('get_my_dashboard_role');
    if (!ALLOWED_ROLES.has(String(role))) return NextResponse.json({ error: 'You do not have check-in permission.' }, { status: 403 });

    const { ticketCode, eventId, deviceInfo } = await request.json();
    if (!ticketCode || !eventId) return NextResponse.json({ error: 'Ticket code and event are required.' }, { status: 400 });

    const admin = getSupabaseAdmin();
    const { data: staffProfile, error: staffError } = await admin.from('profiles').select('id').eq('auth_user_id', user.id).maybeSingle();
    if (staffError) throw staffError;
    if (!staffProfile) return NextResponse.json({ error: 'Staff profile not found.' }, { status: 400 });

    const { data, error } = await admin.rpc('checkin_ticket', {
      p_ticket_code: String(ticketCode),
      p_event_id: eventId,
      p_staff_profile_id: staffProfile.id,
      p_device_info: deviceInfo || 'Dashboard QR Scanner',
    });
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Check-in API error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to process check-in.' }, { status: 500 });
  }
}
