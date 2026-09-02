import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminAuth } from '@/lib/firebase/admin';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { FIREBASE_SESSION_COOKIE, FIREBASE_SESSION_MAX_AGE } from '@/lib/firebase/session';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Missing Firebase ID token.' }, { status: 400 });
    }

    const firebaseAuth = getFirebaseAdminAuth();
    const supabase = getSupabaseAdmin();
    const decoded = await firebaseAuth.verifyIdToken(idToken, false);

    const lookupFilters = [`firebase_uid.eq.${decoded.uid}`];
    if (decoded.email) lookupFilters.push(`email.eq.${decoded.email}`);
    if (decoded.phone_number) lookupFilters.push(`phone.eq.${decoded.phone_number}`);

    const [sessionCookie, { data: existingProfile, error: findError }] = await Promise.all([
      firebaseAuth.createSessionCookie(idToken, { expiresIn: FIREBASE_SESSION_MAX_AGE }),
      supabase
        .from('profiles')
        .select('id, full_name, phone, phone_verified, firebase_uid, email, email_verified, onboarding_completed')
        .or(lookupFilters.join(','))
        .limit(1)
        .maybeSingle(),
    ]);
    if (findError) throw findError;

    const profilePayload: Record<string, unknown> = {
      firebase_uid: decoded.uid,
      updated_at: new Date().toISOString(),
    };

    if (!existingProfile?.onboarding_completed && decoded.name) profilePayload.full_name = decoded.name;
    if (decoded.email) {
      profilePayload.email = decoded.email;
      profilePayload.email_verified = Boolean(decoded.email_verified);
    }
    if (decoded.phone_number && !existingProfile?.phone) {
      profilePayload.phone = decoded.phone_number;
      profilePayload.phone_verified = true;
    }

    let profileId = existingProfile?.id;
    let profile = existingProfile;

    if (profileId) {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(profilePayload)
        .eq('id', profileId)
        .select('id, full_name, email, email_verified, phone, phone_verified, onboarding_completed')
        .single();
      if (updateError) throw updateError;
      profile = updatedProfile;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert({
          ...profilePayload,
          phone: decoded.phone_number ?? null,
          phone_verified: Boolean(decoded.phone_number),
          email: decoded.email ?? null,
          email_verified: Boolean(decoded.email_verified),
          full_name: decoded.name ?? 'The Social Scene Member',
          onboarding_completed: false,
        })
        .select('id, full_name, email, email_verified, phone, phone_verified, onboarding_completed')
        .single();
      if (insertError) throw insertError;
      profileId = inserted.id;
      profile = inserted;
    }

    // Return the profile together with the session response. The login flow can
    // now route using the authoritative server result without immediately
    // making a second /api/profile request and racing the new cookie.
    const response = NextResponse.json({
      ok: true,
      profileId,
      firebaseUid: decoded.uid,
      profile,
    });

    response.cookies.set(FIREBASE_SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Math.floor(FIREBASE_SESSION_MAX_AGE / 1000),
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to establish authentication session.' },
      { status: 401 }
    );
  }
}
