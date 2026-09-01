import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const applicationSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(8).max(20).optional().or(z.literal('')),
  organization_name: z.string().trim().max(160).optional().or(z.literal('')),
  city: z.string().trim().min(2).max(100),
  event_types: z.array(z.string().trim().min(1).max(60)).min(1).max(8),
  experience: z.string().trim().max(2000).optional().or(z.literal('')),
  proposed_event: z.string().trim().max(2000).optional().or(z.literal('')),
  expected_frequency: z.string().trim().max(100).optional().or(z.literal('')),
  instagram: z.string().trim().max(200).optional().or(z.literal('')),
  website: z.string().trim().max(300).optional().or(z.literal('')),
  why_host: z.string().trim().min(20).max(3000),
  website_check: z.string().max(0).optional().or(z.literal('')),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = applicationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please complete the host application with valid details.', details: parsed.error.flatten() }, { status: 400 });
    }

    if (parsed.data.website_check) {
      return NextResponse.json({ ok: true });
    }

    const data = parsed.data;
    const email = data.email.toLowerCase();
    const admin = getSupabaseAdmin();

    const { data: existingPending, error: lookupError } = await admin
      .from('host_applications')
      .select('id')
      .eq('status', 'PENDING')
      .ilike('email', email)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (existingPending) {
      return NextResponse.json({ error: 'We already have a pending host application for this email address.' }, { status: 409 });
    }

    const { data: existingProfile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .maybeSingle();
    if (profileError) throw profileError;

    if (existingProfile) {
      const { data: existingHostRole, error: roleLookupError } = await admin
        .from('user_roles')
        .select('id,roles!inner(name)')
        .eq('user_id', existingProfile.id)
        .eq('roles.name', 'HOST')
        .maybeSingle();
      if (roleLookupError) throw roleLookupError;
      if (existingHostRole) {
        return NextResponse.json({ error: 'This email already has host dashboard access.' }, { status: 409 });
      }
    }

    const { data: application, error } = await admin
      .from('host_applications')
      .insert({
        full_name: data.full_name,
        email,
        phone: data.phone || null,
        organization_name: data.organization_name || null,
        city: data.city,
        event_types: data.event_types,
        experience: data.experience || null,
        proposed_event: data.proposed_event || null,
        expected_frequency: data.expected_frequency || null,
        social_links: {
          instagram: data.instagram || null,
          website: data.website || null,
        },
        why_host: data.why_host,
      })
      .select('id,status,created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A pending host application already exists for this email address.' }, { status: 409 });
      }
      throw error;
    }

    // ─── Fire-and-forget admin notification email ────────────────────────────
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const appId = application?.id ?? 'N/A';
      const row = (field: string, value: string | null | undefined) =>
        value ? `<tr><td style="padding:6px 12px;color:#1e1a14;font-ght:700;font-size:11px;white-space:nowrap;vertical-align:top;text-transform:uppercase;letter-spacing:0.08em;">${field}</td><td style="padding:6px 12px;color:#2b2520;font-size:12px;vertical-align:top;">${value}</td></tr>` : '';

      resend.emails.send({
        from: 'The Social Scene <noreply@thesocialscene.club>',
        to:   ['support@thesocialscene.club'],
        subject: `🎉 New Host Application — ${data.full_name} (${data.city})`,
        html: `
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;background:#ede4d0;padding:32px;">
            <div style="max-width:560px;margin:0 auto;background:#f7f0e3;border:2px solid #1e1a14;border-radius:16px;overflow:hidden;">
              <!-- Header -->
              <div style="background:#c93a2a;padding:24px 28px;">
                <p style="margin:0;font-size:10px;color:rgba(247,240,227,0.7);text-transform:uppercase;letter-spacing:0.1em;font-weight:700;">● The Social Scene</p>
                <h1 style="margin:6px 0 0;font-size:26px;color:#f7f0e3;letter-spacing:0.03em;font-weight:900;">NEW HOST APPLICATION</h1>
              </div>

              <!-- Body -->
              <div style="padding:24px 28px;">
                <p style="margin:0 0 16px;font-size:12px;color:#1e1a14;">A new host application has been submitted. Review the details below and approve or reject in your Supabase dashboard.</p>
                <table style="width:100%;border-collapse:collapse;background:#ede4d0;border-radius:10px;overflow:hidden;border:1.5px solid rgba(30,26,20,0.15);">
                  <tbody>
                    ${row('Name',       data.full_name)}
                    ${row('Email',      data.email)}
                    ${row('Phone',      data.phone)}
                    ${row('City',       data.city)}
                    ${row('Org / Club', data.organization_name)}
                    ${row('Freq.',      data.expected_frequency)}
                    ${row('Event types', data.event_types.join(', '))}
                    ${row('Instagram',  data.instagram)}
                    ${row('Website',    data.website)}
                  </tbody>
                </table>

                <div style="margin-top:16px;background:#ede4d0;border:1.5px solid rgba(30,26,20,0.15);border-radius:10px;padding:14px 16px;">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#c93a2a;text-transform:uppercase;letter-spacing:0.08em;">Experience</p>
                  <p style="margin:0;font-size:12px;color:#2b2520;line-height:1.6;">${data.experience || '—'}</p>
                </div>
                <div style="margin-top:12px;background:#ede4d0;border:1.5px solid rgba(30,26,20,0.15);border-radius:10px;padding:14px 16px;">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#c93a2a;text-transform:uppercase;letter-spacing:0.08em;">Proposed Event</p>
                  <p style="margin:0;font-size:12px;color:#2b2520;line-height:1.6;">${data.proposed_event || '—'}</p>
                </div>
                <div style="margin-top:12px;background:#ede4d0;border:1.5px solid rgba(30,26,20,0.15);border-radius:10px;padding:14px 16px;">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#c93a2a;text-transform:uppercase;letter-spacing:0.08em;">Why they want to host</p>
                  <p style="margin:0;font-size:12px;color:#2b2520;line-height:1.6;">${data.why_host}</p>
                </div>
              </div>

              <!-- Footer -->
              <div style="padding:16px 28px;border-top:2px solid rgba(30,26,20,0.1);display:flex;justify-content:space-between;align-items:center;">
                <p style="margin:0;font-size:10px;color:rgba(30,26,20,0.4);text-transform:uppercase;letter-spacing:0.08em;">Application ID: ${appId}</p>
                <p style="margin:0;font-size:10px;color:rgba(30,26,20,0.4);">thesocialscene.club</p>
              </div>
            </div>
          </div>
        `,
      }).catch((err: unknown) => {
        console.error('[HOST APPLICATION][EMAIL]', err);
      });
    }

    return NextResponse.json({ application }, { status: 201 });

  } catch (error) {
    console.error('[HOST APPLICATION][POST]', error);
    return NextResponse.json({ error: 'Unable to submit your host application right now. Please try again.' }, { status: 500 });
  }
}
