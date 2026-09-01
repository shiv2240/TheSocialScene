import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentFirebaseUser } from '@/lib/firebase/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(100).optional(),
  email: z.union([z.string().trim().email().max(200), z.literal('')]).optional(),
  email_verified: z.boolean().optional(),
  marketing_opt_in: z.boolean().optional(),
});

const onboardingSchema = z.object({ full_name: z.string().trim().min(2).max(100), age: z.coerce.number().int().min(13).max(120) });
const profileSelect = 'id, full_name, username, age, onboarding_completed, phone, phone_verified, email, email_verified, marketing_opt_in, status, created_at';
const privateCacheHeaders = { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=30' };

function makeUsername(fullName: string) {
  const base = fullName.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '').slice(0, 24) || 'member';
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}_${suffix}`.slice(0, 32);
}

export async function GET() {
  const user = await getCurrentFirebaseUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });

  const supabase = getSupabaseAdmin();
  let { data: profile, error } = await supabase.from('profiles').select(profileSelect).eq('firebase_uid', user.uid).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: { 'Cache-Control': 'no-store' } });

  if (!profile) {
    const { data: created, error: createError } = await supabase.from('profiles').insert({
      firebase_uid: user.uid,
      phone: user.phone_number || null,
      phone_verified: Boolean(user.phone_number),
      email: user.email || null,
      email_verified: Boolean(user.email_verified),
      full_name: user.name || 'The Social Scene Member',
      onboarding_completed: false,
    }).select(profileSelect).single();
    if (createError) return NextResponse.json({ error: createError.message }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    profile = created;
  }

  return NextResponse.json({ profile }, { headers: privateCacheHeaders });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentFirebaseUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = onboardingSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid full name and age.' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: current, error: currentError } = await supabase.from('profiles').select('id, onboarding_completed').eq('firebase_uid', user.uid).maybeSingle();
  if (currentError) return NextResponse.json({ error: currentError.message }, { status: 500 });
  if (!current) return NextResponse.json({ error: 'Your profile is not ready yet. Please sign in again.' }, { status: 400 });
  if (current.onboarding_completed) return NextResponse.json({ error: 'Onboarding has already been completed.' }, { status: 409 });

  let profile: Record<string, unknown> | null = null;
  let lastError: { code?: string; message?: string } | null = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await supabase.from('profiles').update({ full_name: parsed.data.full_name, age: parsed.data.age, username: makeUsername(parsed.data.full_name), onboarding_completed: true, updated_at: new Date().toISOString() }).eq('firebase_uid', user.uid).eq('onboarding_completed', false).select(profileSelect).single();
    if (!error) { profile = data as Record<string, unknown>; break; }
    lastError = error;
    if (error.code !== '23505') break;
  }
  if (!profile) return NextResponse.json({ error: lastError?.message || 'Unable to complete onboarding.' }, { status: lastError?.code === '23505' ? 409 : 400 });
  return NextResponse.json({ profile });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentFirebaseUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Enter valid profile details.' }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.marketing_opt_in !== undefined) updates.marketing_opt_in = parsed.data.marketing_opt_in;
  if (parsed.data.email !== undefined && parsed.data.email_verified !== true) return NextResponse.json({ error: 'Email can only be saved after Firebase verification.' }, { status: 400 });
  if (parsed.data.email_verified === true) {
    if (!user.email || !user.email_verified) return NextResponse.json({ error: 'Firebase email verification is not complete.' }, { status: 400 });
    updates.email = user.email.toLowerCase();
    updates.email_verified = true;
  }

  const supabase = getSupabaseAdmin();
  const { data: profile, error } = await supabase.from('profiles').update(updates).eq('firebase_uid', user.uid).select(profileSelect).single();
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'That email address is already associated with another account.' }, { status: 409 });
    return NextResponse.json({ error: `Unable to save profile: ${error.message}` }, { status: 400 });
  }
  return NextResponse.json({ profile });
}
