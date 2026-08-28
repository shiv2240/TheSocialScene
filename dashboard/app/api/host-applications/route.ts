import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { provisionDashboardUser } from '@/lib/dashboard-user-provisioning';
import { getCurrentDashboardRoles, hasDashboardRole } from '@/lib/dashboard-rbac';

export const runtime = 'nodejs';
const reviewSchema = z.object({ applicationId: z.string().uuid(), action: z.enum(['APPROVE', 'REJECT']), rejection_reason: z.string().trim().max(1000).optional().or(z.literal('')) });
const HOST_APPLICATION_ROLES = ['SUPER_ADMIN', 'ADMIN'] as const;

async function requireHostApplicationManager() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  const { roles, error } = await getCurrentDashboardRoles(supabase);
  if (error) return { error: NextResponse.json({ error: 'Unable to resolve dashboard roles.' }, { status: 500 }) };
  if (!hasDashboardRole(roles, HOST_APPLICATION_ROLES)) return { error: NextResponse.json({ error: 'You do not have host application management permission.' }, { status: 403 }) };
  return { supabase, user, roles };
}

export async function GET() {
  const auth = await requireHostApplicationManager();
  if ('error' in auth) return auth.error;
  try {
    const { data: applications, error } = await auth.supabase.from('host_applications').select('id,full_name,email,phone,organization_name,city,event_types,experience,proposed_event,expected_frequency,social_links,why_host,status,profile_id,reviewed_by,reviewed_at,rejection_reason,credentials_sent_at,created_at,updated_at').order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ applications: applications ?? [] });
  } catch (error) { console.error('[HOST APPLICATIONS][GET]', error); return NextResponse.json({ error: 'Unable to load host applications.' }, { status: 500 }); }
}

async function sendExistingAccountSetupEmail(email: string, fullName: string) {
  const admin = getSupabaseAdmin();
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://admin.thesocialscene.club';
  const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo: `${dashboardUrl}/auth/callback?next=/change-password` } });
  if (error || !data.properties?.action_link) throw new Error(error?.message || 'Unable to generate the dashboard setup link.');
  const apiKey = process.env.RESEND_API_KEY; const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error('Existing dashboard account requires RESEND_API_KEY and RESEND_FROM_EMAIL to be configured for setup email delivery.');
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [email], subject: 'Your Social Scene host dashboard access is ready', text: `Hi ${fullName},\n\nYour host dashboard access has been approved. Use this secure link to set or reset your dashboard password:\n\n${data.properties.action_link}\n\nYou will then be able to manage your events and view host-only performance data.`, html: `<p>Hi ${fullName},</p><p>Your host dashboard access has been approved.</p><p><a href="${data.properties.action_link}">Set your dashboard password</a></p><p>After setup, you can manage your events and view host-only performance data.</p>` }) });
  if (!response.ok) throw new Error('Unable to send the dashboard setup email.');
}

export async function PATCH(request: NextRequest) {
  const auth = await requireHostApplicationManager();
  if ('error' in auth) return auth.error;
  try {
    const parsed = reviewSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid application review request.' }, { status: 400 });
    const admin = getSupabaseAdmin();
    const { data: application, error: applicationError } = await admin.from('host_applications').select('*').eq('id', parsed.data.applicationId).single();
    if (applicationError) throw applicationError;
    if (application.status !== 'PENDING') return NextResponse.json({ error: `This application is already ${application.status.toLowerCase()}.` }, { status: 409 });
    const { data: reviewer } = await admin.from('profiles').select('id').eq('auth_user_id', auth.user.id).maybeSingle();
    if (!reviewer) return NextResponse.json({ error: 'Reviewer profile not found.' }, { status: 400 });
    if (parsed.data.action === 'REJECT') {
      const { data: updated, error } = await admin.from('host_applications').update({ status: 'REJECTED', rejection_reason: parsed.data.rejection_reason || null, reviewed_by: reviewer.id, reviewed_at: new Date().toISOString() }).eq('id', application.id).select('id,status,reviewed_at,rejection_reason').single();
      if (error) throw error;
      await admin.from('audit_logs').insert({ actor_user_id: reviewer.id, action: 'HOST_APPLICATION_REJECTED', entity_type: 'HOST_APPLICATION', entity_id: application.id, metadata: { reason: parsed.data.rejection_reason || null, roles: auth.roles } });
      return NextResponse.json({ application: updated });
    }
    let profileId: string; let emailDelivery: 'INVITATION' | 'SETUP_LINK' = 'INVITATION';
    const { data: existingProfile, error: existingProfileError } = await admin.from('profiles').select('id,auth_user_id').ilike('email', application.email).maybeSingle();
    if (existingProfileError) throw existingProfileError;
    if (existingProfile?.auth_user_id) {
      profileId = existingProfile.id;
      const { data: hostRole, error: hostRoleError } = await admin.from('roles').select('id').eq('name', 'HOST').single();
      if (hostRoleError) throw hostRoleError;
      const { error: roleError } = await admin.from('user_roles').upsert({ user_id: profileId, role_id: hostRole.id }, { onConflict: 'user_id,role_id' });
      if (roleError) throw roleError;
      const { error: profileUpdateError } = await admin.from('profiles').update({ full_name: application.full_name, phone: application.phone || null, status: 'ACTIVE', must_change_password: true }).eq('id', profileId);
      if (profileUpdateError) throw profileUpdateError;
      await sendExistingAccountSetupEmail(application.email, application.full_name); emailDelivery = 'SETUP_LINK';
    } else {
      const provisioned = await provisionDashboardUser({ fullName: application.full_name, email: application.email, phone: application.phone, role: 'HOST' }); profileId = provisioned.profileId;
    }
    const { data: updated, error: updateError } = await admin.from('host_applications').update({ status: 'APPROVED', profile_id: profileId, reviewed_by: reviewer.id, reviewed_at: new Date().toISOString(), credentials_sent_at: new Date().toISOString(), rejection_reason: null }).eq('id', application.id).select('id,status,profile_id,reviewed_at,credentials_sent_at').single();
    if (updateError) throw updateError;
    await admin.from('audit_logs').insert({ actor_user_id: reviewer.id, action: 'HOST_APPLICATION_APPROVED', entity_type: 'HOST_APPLICATION', entity_id: application.id, metadata: { profile_id: profileId, email_delivery: emailDelivery, roles: auth.roles } });
    return NextResponse.json({ application: updated, message: emailDelivery === 'INVITATION' ? 'Host approved and dashboard invitation sent.' : 'Host approved and password setup email sent.' });
  } catch (error) { console.error('[HOST APPLICATIONS][PATCH]', error); return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to process host application.' }, { status: 500 }); }
}
