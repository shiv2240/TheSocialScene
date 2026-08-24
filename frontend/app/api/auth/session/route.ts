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
    const decoded = await firebaseAuth.verifyIdToken(idToken, true);
    const sessionCookie = await firebaseAuth.createSessionCookie(idToken, {
      expiresIn: FIREBASE_SESSION_MAX_AGE,
    });

    const supabase = getSupabaseAdmin();
    const lookupFilters = [`firebase_uid.eq.${decoded.uid}`];
    if (decoded.email) lookupFilters.push(`email.eq.${decoded.email}`);
    if (decoded.phone_number) lookupFilters.push(`phone.eq.${decoded.phone_number}`);

    const { data: existingProfile, error: findError } = await supabase
      .from('profiles')
      .select('id, phone, phone_verified, firebase_uid, email')
      .or(lookupFilters.join(','))
      .limit(1)
      .maybeSingle();

    if (findError) throw findError;

    const profilePayload: Record<string, unknown> = {
      firebase_uid: decoded.uid,
      email: decoded.email ?? existingProfile?.email ?? null,
      email_verified: Boolean(decoded.email_verified),
      full_name: decoded.name ?? 'The Social Scene Member',
      updated_at: new Date().toISOString(),
    };

    if (decoded.phone_number && !existingProfile?.phone) {
      profilePayload.phone = decoded.phone_number;
      profilePayload.phone_verified = true;
    }

    let profileId = existingProfile?.id;
    if (profileId) {
      const { error: updateError } = await supabase.from('profiles').update(profilePayload).eq('id', profileId);
      if (updateError) throw updateError;
    } else {
      const { data: inserted, error: insertError } = await supabase.from('profiles').insert(profilePayload).select('id').single();
      if (insertError) throw insertError;
      profileId = inserted.id;
    }

    const response = NextResponse.json({ ok: true, profileId, firebaseUid: decoded.uid });
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
      { status: 401 },
    );
  }
}
