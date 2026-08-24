import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentFirebaseUser } from '@/lib/firebase/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const profileSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  email: z.union([z.string().email().max(200), z.literal('')]).optional(),
  marketing_opt_in: z.boolean().optional(),
});

export async function GET() {
  const user = await getCurrentFirebaseUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, phone_verified, email, email_verified, marketing_opt_in, status, created_at')
    .eq('firebase_uid', user.uid)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentFirebaseUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid profile data.' }, { status: 400 });

  const updates: Record<string, unknown> = {
    ...parsed.data,
    updated_at: new Date().toISOString(),
  };

  if (typeof updates.email === 'string') {
    updates.email_verified = updates.email === user.email && Boolean(user.email_verified);
    if (updates.email === '') updates.email = null;
  }

  const supabase = getSupabaseAdmin();
  const { data: profile, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('firebase_uid', user.uid)
    .select('id, full_name, phone, phone_verified, email, email_verified, marketing_opt_in, status, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ profile });
}
