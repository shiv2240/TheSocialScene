import { NextRequest, NextResponse } from 'next/server';
import { getCurrentFirebaseUser } from '@/lib/firebase/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

export const runtime = 'nodejs';
const schema = z.object({ otp: z.string().regex(/^\d{6}$/) });
const SESSION_COOKIE = 'tss_profile_phone_otp_session';
const PHONE_COOKIE = 'tss_profile_phone_otp_phone';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentFirebaseUser();
    if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Enter the complete 6-digit OTP.' }, { status: 400 });
    const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
    const phone = request.cookies.get(PHONE_COOKIE)?.value;
    if (!sessionId || !phone) return NextResponse.json({ error: 'Your OTP session expired. Please request a new OTP.' }, { status: 400 });
    const apiKey = process.env.TWOFACTOR_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OTP service is not configured.' }, { status: 500 });
    const endpoint = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/VERIFY/${encodeURIComponent(sessionId)}/${encodeURIComponent(parsed.data.otp)}`;
    const providerResponse = await fetch(endpoint, { cache: 'no-store' });
    const body = await providerResponse.json().catch(() => null);
    const status = String(body?.Status ?? body?.status ?? '').toLowerCase();
    if (!providerResponse.ok || status !== 'success') return NextResponse.json({ error: 'Invalid or expired OTP.' }, { status: 401 });
    const supabase = getSupabaseAdmin();
    const { data: conflict } = await supabase.from('profiles').select('id').eq('phone', phone).neq('firebase_uid', user.uid).maybeSingle();
    if (conflict) return NextResponse.json({ error: 'This mobile number is already linked to another account.' }, { status: 409 });
    const { error } = await supabase.from('profiles').update({ phone, phone_verified: true, updated_at: new Date().toISOString() }).eq('firebase_uid', user.uid);
    if (error) throw error;
    const response = NextResponse.json({ ok: true, phone });
    response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: '/' });
    response.cookies.set(PHONE_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: '/' });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to verify phone number.' }, { status: 500 });
  }
}
