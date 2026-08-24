import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getFirebaseAdminAuth } from '@/lib/firebase/admin';
import { FIREBASE_SESSION_COOKIE } from '@/lib/firebase/session';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(FIREBASE_SESSION_COOKIE)?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Your sign-in session has expired. Please sign in again.' }, { status: 401 });
    }

    const decoded = await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true);
    const customToken = await getFirebaseAdminAuth().createCustomToken(decoded.uid);

    return NextResponse.json({ customToken });
  } catch {
    return NextResponse.json({ error: 'Your sign-in session has expired. Please sign in again.' }, { status: 401 });
  }
}
