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

function phoneVariants(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const variants = new Set<string>([phone]);
  if (digits.length === 10) {
    variants.add(digits);
    variants.add(`+91${digits}`);
    variants.add(`+91 ${digits}`);
  } else if (digits.length === 12 && digits.startsWith('91')) {
    const national = digits.slice(2);
    variants.add(national);
    variants.add(`+${digits}`);
    variants.add(`+91 ${national}`);
  }
  return [...variants];
}

export async function POST(request: NextRequest) {
  const traceId = crypto.randomUUID();
  const log = (step: string, details?: Record<string, unknown>) => console.log(`[VERIFY OTP][${traceId}] ${step}`, details ?? '');

  try {
    log('START');
    const { otp } = await request.json();
    if (!/^\d{6}$/.test(String(otp ?? ''))) return NextResponse.json({ error: 'Enter the complete 6-digit OTP.' }, { status: 400 });

    const sessionId = request.cookies.get(OTP_SESSION_COOKIE)?.value;
    const phone = request.cookies.get(OTP_PHONE_COOKIE)?.value;
    if (!sessionId || !phone) return NextResponse.json({ error: 'Your OTP session has expired. Please request a new OTP.' }, { status: 400 });

    const apiKey = process.env.TWOFACTOR_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OTP service is not configured.' }, { status: 500 });

    log('2FACTOR VERIFY START', { phoneSuffix: phone.slice(-4) });
    const endpoint = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/VERIFY/${encodeURIComponent(sessionId)}/${encodeURIComponent(String(otp))}`;
    const providerResponse = await fetch(endpoint, { cache: 'no-store' });
    const providerBody = await providerResponse.json().catch(() => null);
    const providerStatus = String(providerBody?.Status ?? providerBody?.status ?? '').toLowerCase();
    log('2FACTOR VERIFY RESPONSE', { httpStatus: providerResponse.status, providerStatus, providerDetails: providerBody?.Details ?? providerBody?.details ?? null });
    if (!providerResponse.ok || providerStatus !== 'success') return NextResponse.json({ error: 'Invalid or expired OTP.' }, { status: 401 });

    const firebaseAuth = getFirebaseAdminAuth();
    let firebaseUser;
    try {
      firebaseUser = await firebaseAuth.getUserByPhoneNumber(phone);
      if (!firebaseUser.phoneNumber) throw new Error('Firebase user has no phone number.');
    } catch (error) {
      log('FIREBASE GET USER FAILED - CREATING USER', { error: error instanceof Error ? error.message : String(error) });
      firebaseUser = await firebaseAuth.createUser({ phoneNumber: phone });
    }

    const supabase = getSupabaseAdmin();

    // Firebase UID is the canonical identity. Resolve it before phone lookup so
    // an existing profile can never be duplicated because of phone formatting.
    const { data: firebaseProfile, error: firebaseProfileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, firebase_uid, onboarding_completed')
      .eq('firebase_uid', firebaseUser.uid)
      .maybeSingle();
    if (firebaseProfileError) throw firebaseProfileError;

    let existingProfile = firebaseProfile;
    if (!existingProfile) {
      const { data: phoneProfiles, error: phoneLookupError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, firebase_uid, onboarding_completed')
        .in('phone', phoneVariants(phone))
        .limit(2);
      if (phoneLookupError) throw phoneLookupError;
      if ((phoneProfiles?.length ?? 0) > 1) throw new Error('Multiple profiles are associated with this mobile number. Please contact support.');
      existingProfile = phoneProfiles?.[0] ?? null;
    }

    log('SUPABASE PROFILE RESOLUTION', {
      foundByFirebaseUid: Boolean(firebaseProfile),
      foundByPhone: Boolean(existingProfile && !firebaseProfile),
      profileId: existingProfile?.id ?? null,
    });

    if (existingProfile) {
      if (existingProfile.firebase_uid && existingProfile.firebase_uid !== firebaseUser.uid) {
        throw new Error('This mobile number is already linked to another account.');
      }

      const updatePayload: Record<string, unknown> = {
        firebase_uid: firebaseUser.uid,
        phone_verified: true,
        updated_at: new Date().toISOString(),
      };
      if (!existingProfile.phone) updatePayload.phone = phone;
      if (!existingProfile.email && firebaseUser.email) updatePayload.email = firebaseUser.email;

      const { error: updateError } = await supabase.from('profiles').update(updatePayload).eq('id', existingProfile.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase.from('profiles').insert({
        firebase_uid: firebaseUser.uid,
        phone,
        phone_verified: true,
        email: firebaseUser.email ?? null,
        email_verified: Boolean(firebaseUser.emailVerified),
        full_name: firebaseUser.displayName ?? 'The Social Scene Member',
        onboarding_completed: false,
      });
      if (insertError) {
        // Handle a concurrent first-login request that created the Firebase UID
        // between our lookup and insert.
        if (insertError.code === '23505' && insertError.message.includes('profiles_firebase_uid_key')) {
          const { data: concurrentProfile, error: concurrentLookupError } = await supabase.from('profiles').select('id').eq('firebase_uid', firebaseUser.uid).maybeSingle();
          if (concurrentLookupError || !concurrentProfile) throw insertError;
        } else {
          throw insertError;
        }
      }
    }

    const customToken = await firebaseAuth.createCustomToken(firebaseUser.uid, { phone_verified: true });
    log('VERIFY OTP SUCCESS', { uid: firebaseUser.uid });
    return clearOtpCookies(NextResponse.json({ ok: true, customToken, firebaseUid: firebaseUser.uid }));
  } catch (error) {
    console.error(`[VERIFY OTP][${traceId}] FATAL ERROR`, {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to verify OTP.' }, { status: 500 });
  }
}
