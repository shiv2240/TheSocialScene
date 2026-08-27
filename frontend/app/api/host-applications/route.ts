import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

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

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('[HOST APPLICATION][POST]', error);
    return NextResponse.json({ error: 'Unable to submit your host application right now. Please try again.' }, { status: 500 });
  }
}
