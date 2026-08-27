import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const MANAGEABLE_DASHBOARD_ROLES = [
  'ADMIN',
  'HOST',
  'EVENT_MANAGER',
  'CHECKIN_STAFF',
  'EDITOR',
  'FINANCE',
  'SUPPORT',
] as const;

export type ManageableDashboardRole = (typeof MANAGEABLE_DASHBOARD_ROLES)[number];

const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://admin.thesocialscene.club';
const resendFrom = process.env.RESEND_FROM_EMAIL || 'The Social Scene <no-reply@auth.thesocialscene.club>';

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;');
}

async function sendInvitationEmail(input: { email: string; fullName: string; role: string; actionLink: string }) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) throw new Error('RESEND_API_KEY is not configured for dashboard invitations.');

  const safeName = escapeHtml(input.fullName);
  const safeRole = escapeHtml(input.role.replace(/_/g, ' '));
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [input.email],
      subject: 'Your Social Scene dashboard invitation',
      text: `Hi ${input.fullName},\n\nYou have been invited to The Social Scene dashboard as ${input.role.replace(/_/g, ' ')}.\n\nUse this secure link to activate your account and set your password:\n${input.actionLink}\n\nThis invitation link is intended only for you.\n\nThe Social Scene Team`,
      html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;background:#090b12;font-family:Arial,Helvetica,sans-serif;color:#f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding-top:40px;padding-bottom:40px;"><table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#151823;border-radius:12px;"><tr><td style="padding-top:40px;padding-right:40px;padding-bottom:40px;padding-left:40px;"><p style="font-size:16px;line-height:24px;color:#f5f5f5;">Hi ${safeName},</p><p style="font-size:16px;line-height:24px;color:#d8dbe5;">You have been invited to The Social Scene dashboard as <strong style="color:#f5f5f5;">${safeRole}</strong>.</p><p style="font-size:16px;line-height:24px;color:#d8dbe5;">Use the secure button below to activate your account and set your password.</p><table cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:8px;background:#ff6b35;"><a href="${escapeHtml(input.actionLink)}" style="display:inline-block;padding-top:14px;padding-right:24px;padding-bottom:14px;padding-left:24px;font-size:16px;line-height:20px;color:#ffffff;text-decoration:none;font-weight:bold;">Activate Dashboard Account</a></td></tr></table><p style="font-size:13px;line-height:20px;color:#9da3b3;">If you did not expect this invitation, you can ignore this email.</p><p style="font-size:14px;line-height:22px;color:#d8dbe5;">The Social Scene Team</p></td></tr></table></td></tr></table></body></html>`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('[DASHBOARD INVITATION][RESEND]', {
      status: response.status,
      from: resendFrom,
      recipient: input.email,
      response: body,
    });

    let providerMessage = body;
    try {
      const parsed = JSON.parse(body) as { message?: string; name?: string };
      providerMessage = parsed.message || parsed.name || body;
    } catch {
      // Keep the raw provider response when it is not JSON.
    }

    throw new Error(`Resend rejected the invitation email (${response.status}): ${providerMessage}`);
  }
}

export async function provisionDashboardUser(input: {
  fullName: string;
  email: string;
  phone?: string | null;
  role: ManageableDashboardRole;
}) {
  const admin = getSupabaseAdmin();
  const email = input.email.trim().toLowerCase();
  const redirectTo = `${dashboardUrl}/auth/callback?next=/change-password`;

  // Generate the Supabase invitation link without asking Supabase's email
  // provider to send the message. Delivery is handled by the production
  // Resend account configured for The Social Scene.
  const { data: generated, error: generateError } = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      redirectTo,
      data: { full_name: input.fullName.trim(), dashboard_role: input.role },
    },
  });

  if (generateError) throw new Error(generateError.message || 'Unable to create the dashboard invitation.');
  if (!generated.user || !generated.properties?.action_link) throw new Error('Dashboard invitation did not return a secure activation link.');

  const authUserId = generated.user.id;

  try {
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id,auth_user_id,full_name,email')
      .eq('auth_user_id', authUserId)
      .single();
    if (profileError || !profile) throw new Error('Dashboard account was created but its profile could not be provisioned.');

    const { error: profileUpdateError } = await admin
      .from('profiles')
      .update({
        full_name: input.fullName.trim(),
        phone: input.phone?.trim() || null,
        status: 'ACTIVE',
        must_change_password: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);
    if (profileUpdateError) throw new Error('Unable to finish dashboard profile provisioning.');

    const { data: roleRow, error: roleLookupError } = await admin
      .from('roles')
      .select('id')
      .eq('name', input.role)
      .single();
    if (roleLookupError || !roleRow) throw new Error(`Dashboard role ${input.role} is not configured.`);

    const { error: roleInsertError } = await admin
      .from('user_roles')
      .insert({ user_id: profile.id, role_id: roleRow.id });
    if (roleInsertError) {
      throw new Error(roleInsertError.code === '23505' ? 'This user already has the selected dashboard role.' : 'Unable to assign the dashboard role.');
    }

    await sendInvitationEmail({
      email,
      fullName: input.fullName.trim(),
      role: input.role,
      actionLink: generated.properties.action_link,
    });

    return { authUserId, profileId: profile.id, role: input.role, email };
  } catch (error) {
    // Do not leave an unusable dashboard account behind if provisioning or
    // invitation delivery fails. The Super Admin can retry safely.
    await admin.auth.admin.deleteUser(authUserId).catch((cleanupError) => {
      console.error('[DASHBOARD INVITATION][CLEANUP]', cleanupError);
    });
    throw error;
  }
}
