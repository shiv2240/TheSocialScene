import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { resendDashboardInvitation } from '@/lib/dashboard-user-provisioning';

export const runtime = 'nodejs';

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid user profile.' }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const { data: role, error: roleError } = await supabase.rpc('get_my_dashboard_role');
  if (roleError) return NextResponse.json({ error: 'Unable to resolve dashboard role.' }, { status: 500 });
  if (role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Only Super Admins can resend dashboard invitations.' }, { status: 403 });

  try {
    const result = await resendDashboardInvitation(id);
    const admin = getSupabaseAdmin();
    const { data: actorProfile } = await admin.from('profiles').select('id').eq('auth_user_id', user.id).maybeSingle();
    if (actorProfile) {
      await admin.from('audit_logs').insert({
        actor_user_id: actorProfile.id,
        action: 'DASHBOARD_INVITATION_RESENT',
        entity_type: 'PROFILE',
        entity_id: id,
        metadata: { email: result.email },
      });
    }
    return NextResponse.json({ message: `Activation email resent to ${result.email}.` });
  } catch (error) {
    console.error('[DASHBOARD INVITATION][RESEND]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to resend activation email.' }, { status: 500 });
  }
}
