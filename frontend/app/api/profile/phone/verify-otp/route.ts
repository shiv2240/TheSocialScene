import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentFirebaseUser } from '@/lib/firebase/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';
import { consumeRateLimit } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';
const schema = z.object({ otp: z.string().regex(/^\d{6}$/) });
const SESSION_COOKIE = 'tss_profile_phone_otp_session';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentFirebaseUser();
    if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Enter the complete 6-digit OTP.' }, { status: 400 });
    const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionToken) return NextResponse.json({ error: 'Your OTP session expired. Please request a new OTP.' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const tokenHash = createHash('sha256').update(sessionToken).digest('hex');
    const { data: otpSession, error: sessionError } = await supabase
      .from('phone_otp_sessions')
      .select('phone, provider_session_id, expires_at, consumed_at')
      .eq('token_hash', tokenHash)
      .eq('firebase_uid', user.uid)
      .maybeSingle();
    if (sessionError) throw sessionError;
    if (!otpSession || otpSession.consumed_at || new Date(otpSession.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Your OTP session expired. Please request a new OTP.' }, { status: 400 });
    }

    if (!await consumeRateLimit(supabase, 'phone-otp-verify-session', tokenHash, 5, 600)) {
      return NextResponse.json({ error: 'Too many incorrect OTP attempts. Request a new OTP.' }, { status: 429 });
    }
    if (!await consumeRateLimit(supabase, 'phone-otp-verify-user', user.uid, 10, 3600)) {
      return NextResponse.json({ error: 'Too many OTP verification attempts. Try again later.' }, { status: 429 });
    }
    const apiKey = process.env.TWOFACTOR_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OTP service is not configured.' }, { status: 500 });
    const endpoint = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/VERIFY/${encodeURIComponent(otpSession.provider_session_id)}/${encodeURIComponent(parsed.data.otp)}`;
    const providerResponse = await fetch(endpoint, { cache: 'no-store' });
    const body = await providerResponse.json().catch(() => null);
    const status = String(body?.Status ?? body?.status ?? '').toLowerCase();
    if (!providerResponse.ok || status !== 'success') return NextResponse.json({ error: 'Invalid or expired OTP.' }, { status: 401 });
    const phone = otpSession.phone;
    const { data: conflict, error: conflictError } = await supabase.from('profiles').select('id').eq('phone', phone).neq('firebase_uid', user.uid).maybeSingle();
    if (conflictError) throw conflictError;
    if (conflict) return NextResponse.json({ error: 'This mobile number is already linked to another account.' }, { status: 409 });
    const { data: consumedSession, error: consumeError } = await supabase
      .from('phone_otp_sessions')
      .update({ consumed_at: new Date().toISOString() })
      .eq('token_hash', tokenHash)
      .eq('firebase_uid', user.uid)
      .is('consumed_at', null)
      .select('token_hash')
      .maybeSingle();
    if (consumeError) throw consumeError;
    if (!consumedSession) return NextResponse.json({ error: 'This OTP session has already been used. Request a new OTP.' }, { status: 409 });
    const { error: profileError } = await supabase.from('profiles').update({ phone, phone_verified: true, updated_at: new Date().toISOString() }).eq('firebase_uid', user.uid);
    if (profileError) throw profileError;
    const response = NextResponse.json({ ok: true, phone });
    response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: '/' });
    response.cookies.set('tss_profile_phone_otp_phone', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: '/' });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to verify phone number.' }, { status: 500 });
  }
}
