import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentFirebaseUser } from '@/lib/firebase/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';
import { consumeRateLimit } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';
const schema = z.object({ phone: z.string().regex(/^[6-9]\d{9}$/) });
const SESSION_COOKIE = 'tss_profile_phone_otp_session';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentFirebaseUser();
    if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Enter a valid 10-digit Indian mobile number.' }, { status: 400 });

    const { phone } = parsed.data;
    const supabase = getSupabaseAdmin();
    const { data: conflict, error: conflictError } = await supabase.from('profiles').select('id').eq('phone', `+91${phone}`).neq('firebase_uid', user.uid).maybeSingle();
    if (conflictError) throw conflictError;
    if (conflict) return NextResponse.json({ error: 'This mobile number is already linked to another account.' }, { status: 409 });

    if (!await consumeRateLimit(supabase, 'phone-otp-send-phone-hour', phone, 3, 3600)) {
      return NextResponse.json({ error: 'Too many OTP requests for this number. Try again later.' }, { status: 429 });
    }
    if (!await consumeRateLimit(supabase, 'phone-otp-send-user-hour', user.uid, 5, 3600)) {
      return NextResponse.json({ error: 'You have requested too many OTPs. Try again later.' }, { status: 429 });
    }
    if (!await consumeRateLimit(supabase, 'phone-otp-send-phone-cooldown', phone, 1, 30)) {
      return NextResponse.json({ error: 'Please wait before requesting another OTP.' }, { status: 429 });
    }

    const apiKey = process.env.TWOFACTOR_API_KEY;
    const templateName = process.env.TWOFACTOR_OTP_TEMPLATE_NAME || 'The Social Scene OTP';
    if (!apiKey) return NextResponse.json({ error: 'OTP service is not configured.' }, { status: 500 });

    const endpoint = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/+91${phone}/AUTOGEN/${encodeURIComponent(templateName)}`;
    const providerResponse = await fetch(endpoint, { cache: 'no-store' });
    const body = await providerResponse.json().catch(() => null);
    const status = String(body?.Status ?? body?.status ?? '').toLowerCase();
    if (!providerResponse.ok || status !== 'success' || !body?.Details) return NextResponse.json({ error: 'Unable to send OTP. Please try again.' }, { status: 502 });

    // Keep the provider session ID and target phone on the server. The browser
    // receives only a random, opaque, HTTP-only token bound to the signed-in user.
    const sessionToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(sessionToken).digest('hex');
    // Expired sessions and prior pending sessions are no longer useful.
    const { error: cleanupError } = await supabase.from('phone_otp_sessions').delete().or(`expires_at.lt.${new Date().toISOString()},firebase_uid.eq.${user.uid}`);
    if (cleanupError) throw cleanupError;

    const { error: sessionError } = await supabase.from('phone_otp_sessions').insert({
      token_hash: tokenHash,
      firebase_uid: user.uid,
      phone: `+91${phone}`,
      provider_session_id: String(body.Details),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    if (sessionError) throw sessionError;

    const response = NextResponse.json({ ok: true, expiresIn: 600 });
    response.cookies.set(SESSION_COOKIE, sessionToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 600, path: '/' });
    response.cookies.set('tss_profile_phone_otp_phone', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: '/' });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to send OTP.' }, { status: 500 });
  }
}
