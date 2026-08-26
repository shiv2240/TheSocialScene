import { NextRequest, NextResponse } from 'next/server';
import { getCurrentFirebaseUser } from '@/lib/firebase/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

export const runtime = 'nodejs';
const schema = z.object({ phone: z.string().regex(/^[6-9]\d{9}$/) });
const SESSION_COOKIE = 'tss_profile_phone_otp_session';
const PHONE_COOKIE = 'tss_profile_phone_otp_phone';
const LAST_SENT_COOKIE = 'tss_profile_phone_otp_last_sent';
const RESEND_COOLDOWN_SECONDS = 30;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentFirebaseUser();
    if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Enter a valid 10-digit Indian mobile number.' }, { status: 400 });

    const lastSent = Number(request.cookies.get(LAST_SENT_COOKIE)?.value ?? 0);
    if (lastSent && Date.now() - lastSent < RESEND_COOLDOWN_SECONDS * 1000) {
      return NextResponse.json({ error: 'Please wait before requesting another OTP.' }, { status: 429 });
    }

    const { phone } = parsed.data;
    const supabase = getSupabaseAdmin();
    const { data: conflict, error: conflictError } = await supabase.from('profiles').select('id').eq('phone', `+91${phone}`).neq('firebase_uid', user.uid).maybeSingle();
    if (conflictError) throw conflictError;
    if (conflict) return NextResponse.json({ error: 'This mobile number is already linked to another account.' }, { status: 409 });

    const apiKey = process.env.TWOFACTOR_API_KEY;
    const templateName = process.env.TWOFACTOR_OTP_TEMPLATE_NAME || 'The Social Scene OTP';
    if (!apiKey) return NextResponse.json({ error: 'OTP service is not configured.' }, { status: 500 });

    const endpoint = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/+91${phone}/AUTOGEN/${encodeURIComponent(templateName)}`;
    const providerResponse = await fetch(endpoint, { cache: 'no-store' });
    const body = await providerResponse.json().catch(() => null);
    const status = String(body?.Status ?? body?.status ?? '').toLowerCase();
    if (!providerResponse.ok || status !== 'success' || !body?.Details) return NextResponse.json({ error: 'Unable to send OTP. Please try again.' }, { status: 502 });

    const response = NextResponse.json({ ok: true, expiresIn: 600 });
    response.cookies.set(SESSION_COOKIE, String(body.Details), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 600, path: '/' });
    response.cookies.set(PHONE_COOKIE, `+91${phone}`, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 600, path: '/' });
    response.cookies.set(LAST_SENT_COOKIE, String(Date.now()), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: RESEND_COOLDOWN_SECONDS, path: '/' });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to send OTP.' }, { status: 500 });
  }
}
