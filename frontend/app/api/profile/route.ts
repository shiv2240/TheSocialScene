import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentFirebaseUser } from '@/lib/firebase/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(100).optional(),
  email: z.union([z.string().trim().email().max(200), z.literal('')]).optional(),
  marketing_opt_in: z.boolean().optional(),
});

const profileSelect = 'id, full_name, phone, phone_verified, email, email_verified, marketing_opt_in, status, created_at';

export async function GET() {
  const user = await getCurrentFirebaseUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(profileSelect)
    .eq('firebase_uid', user.uid)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentFirebaseUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid name and email address.' }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.full_name !== undefined) updates.full_name = parsed.data.full_name;
  if (parsed.data.marketing_opt_in !== undefined) updates.marketing_opt_in = parsed.data.marketing_opt_in;
  if (parsed.data.email !== undefined) {
    const email = parsed.data.email.toLowerCase();
    updates.email = email || null;
    // This is a profile/contact email, not the phone-auth credential.
    // It remains unverified until a dedicated email-verification flow is completed.
    updates.email_verified = false;
  }

  const supabase = getSupabaseAdmin();
  const { data: profile, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('firebase_uid', user.uid)
    .select(profileSelect)
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'That email address is already associated with another account.' }, { status: 409 });
    }
    return NextResponse.json({ error: `Unable to save profile: ${error.message}` }, { status: 400 });
  }

  return NextResponse.json({ profile });
}
