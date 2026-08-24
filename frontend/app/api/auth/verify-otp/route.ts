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
  const traceId = crypto.randomUUID();
  const log = (step: string, details?: Record<string, unknown>) => {
    console.log(`[VERIFY OTP][${traceId}] ${step}`, details ?? '');
  };

  try {
    log('START');

    const { otp } = await request.json();
    if (!/^\d{6}$/.test(String(otp ?? ''))) {
      log('INVALID OTP FORMAT');
      return NextResponse.json({ error: 'Enter the complete 6-digit OTP.' }, { status: 400 });
    }

    const sessionId = request.cookies.get(OTP_SESSION_COOKIE)?.value;
    const phone = request.cookies.get(OTP_PHONE_COOKIE)?.value;
    if (!sessionId || !phone) {
      log('OTP SESSION MISSING', { hasSessionId: Boolean(sessionId), hasPhone: Boolean(phone) });
      return NextResponse.json({ error: 'Your OTP session has expired. Please request a new OTP.' }, { status: 400 });
    }

    const apiKey = process.env.TWOFACTOR_API_KEY;
    if (!apiKey) {
      log('2FACTOR API KEY MISSING');
      return NextResponse.json({ error: 'OTP service is not configured.' }, { status: 500 });
    }

    log('2FACTOR VERIFY START', { phoneSuffix: phone.slice(-4) });
    const endpoint = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/VERIFY/${encodeURIComponent(sessionId)}/${encodeURIComponent(String(otp))}`;
    const providerResponse = await fetch(endpoint, { cache: 'no-store' });
    const providerBody = await providerResponse.json().catch(() => null);
    const providerStatus = String(providerBody?.Status ?? providerBody?.status ?? '').toLowerCase();

    log('2FACTOR VERIFY RESPONSE', {
      httpStatus: providerResponse.status,
      providerStatus,
      providerDetails: providerBody?.Details ?? providerBody?.details ?? null,
    });

    if (!providerResponse.ok || providerStatus !== 'success') {
      log('2FACTOR VERIFY FAILED');
      return NextResponse.json({ error: 'Invalid or expired OTP.' }, { status: 401 });
    }

    log('2FACTOR VERIFY SUCCESS');

    log('FIREBASE ADMIN INIT START');
    const firebaseAuth = getFirebaseAdminAuth();
    log('FIREBASE ADMIN INIT SUCCESS');

    let firebaseUser;
    try {
      log('FIREBASE GET USER START');
      firebaseUser = await firebaseAuth.getUserByPhoneNumber(phone);
      log('FIREBASE GET USER SUCCESS', { uid: firebaseUser.uid });
      if (!firebaseUser.phoneNumber) throw new Error('Firebase user has no phone number.');
    } catch (error) {
      log('FIREBASE GET USER FAILED - CREATING USER', {
        error: error instanceof Error ? error.message : String(error),
      });
      firebaseUser = await firebaseAuth.createUser({ phoneNumber: phone });
      log('FIREBASE CREATE USER SUCCESS', { uid: firebaseUser.uid });
    }

    log('SUPABASE ADMIN INIT START');
    const supabase = getSupabaseAdmin();
    log('SUPABASE ADMIN INIT SUCCESS');

    log('SUPABASE PROFILE LOOKUP START', { phoneSuffix: phone.slice(-4) });
    const { data: existingProfile, error: findError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('phone', phone)
      .maybeSingle();

    if (findError) {
      log('SUPABASE PROFILE LOOKUP FAILED', {
        message: findError.message,
        code: findError.code,
        details: findError.details,
        hint: findError.hint,
      });
      throw findError;
    }

    log('SUPABASE PROFILE LOOKUP SUCCESS', { exists: Boolean(existingProfile) });

    if (existingProfile) {
      log('SUPABASE PROFILE UPDATE START', { profileId: existingProfile.id });
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          firebase_uid: firebaseUser.uid,
          phone_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProfile.id);
      if (updateError) {
        log('SUPABASE PROFILE UPDATE FAILED', {
          message: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint,
        });
        throw updateError;
      }
      log('SUPABASE PROFILE UPDATE SUCCESS');
    } else {
      log('SUPABASE PROFILE INSERT START');
      const { error: insertError } = await supabase.from('profiles').insert({
        firebase_uid: firebaseUser.uid,
        phone,
        phone_verified: true,
        email: firebaseUser.email ?? null,
        email_verified: Boolean(firebaseUser.emailVerified),
        full_name: firebaseUser.displayName ?? 'The Social Scene Member',
      });
      if (insertError) {
        log('SUPABASE PROFILE INSERT FAILED', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
        });
        throw insertError;
      }
      log('SUPABASE PROFILE INSERT SUCCESS');
    }

    log('FIREBASE CUSTOM TOKEN START', { uid: firebaseUser.uid });
    const customToken = await firebaseAuth.createCustomToken(firebaseUser.uid, {
      phone_verified: true,
    });
    log('FIREBASE CUSTOM TOKEN SUCCESS');

    log('VERIFY OTP SUCCESS');
    return clearOtpCookies(NextResponse.json({ ok: true, customToken, firebaseUid: firebaseUser.uid }));
  } catch (error) {
    console.error(`[VERIFY OTP][${traceId}] FATAL ERROR`, {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to verify OTP.' },
      { status: 500 },
    );
  }
}
