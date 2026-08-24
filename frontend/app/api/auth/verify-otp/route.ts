import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminAuth } from '@/lib/firebase/admin';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const OTP_SESSION_COOKIE = 'tss_otp_session';
const OTP_PHONE_COOKIE = 'tss_otp_phone';

function clearOtpCookies(response: NextResponse) {
  response.cookies.set(OTP_SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: '/' });
  response.cookies.set(OTP_PHONE_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: '/' });
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const { otp } = await request.json();
    if (!/^\d{6}$/.test(String(otp ?? ''))) {
      return NextResponse.json({ error: 'Enter the complete 6-digit OTP.' }, { status: 400 });
    }

    const sessionId = request.cookies.get(OTP_SESSION_COOKIE)?.value;
    const phone = request.cookies.get(OTP_PHONE_COOKIE)?.value;
    if (!sessionId || !phone) {
      return NextResponse.json({ error: 'Your OTP session has expired. Please request a new OTP.' }, { status: 400 });
    }

    const apiKey = process.env.TWOFACTOR_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OTP service is not configured.' }, { status: 500 });
    }

    const endpoint = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/VERIFY/${encodeURIComponent(sessionId)}/${encodeURIComponent(String(otp))}`;
    const providerResponse = await fetch(endpoint, { cache: 'no-store' });
    const providerBody = await providerResponse.json().catch(() => null);
    const providerStatus = String(providerBody?.Status ?? providerBody?.status ?? '').toLowerCase();

    if (!providerResponse.ok || providerStatus !== 'success') {
      return NextResponse.json({ error: 'Invalid or expired OTP.' }, { status: 401 });
    }

    const firebaseAuth = getFirebaseAdminAuth();
    let firebaseUser;
    try {
      firebaseUser = await firebaseAuth.getUserByPhoneNumber(phone);
      if (!firebaseUser.phoneNumber) throw new Error('Firebase user has no phone number.');
    } catch {
      firebaseUser = await firebaseAuth.createUser({ phoneNumber: phone });
    }

    const supabase = getSupabaseAdmin();
    const { data: existingProfile, error: findError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('phone', phone)
      .maybeSingle();

    if (findError) throw findError;

    if (existingProfile) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          firebase_uid: firebaseUser.uid,
          phone_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProfile.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase.from('profiles').insert({
        firebase_uid: firebaseUser.uid,
        phone,
        phone_verified: true,
        email: firebaseUser.email ?? null,
        email_verified: Boolean(firebaseUser.emailVerified),
        full_name: firebaseUser.displayName ?? 'The Social Scene Member',
      });
      if (insertError) throw insertError;
    }

    const customToken = await firebaseAuth.createCustomToken(firebaseUser.uid, {
      phone_verified: true,
    });

    return clearOtpCookies(NextResponse.json({ ok: true, customToken, firebaseUid: firebaseUser.uid }));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to verify OTP.' },
      { status: 500 },
    );
  }
}
