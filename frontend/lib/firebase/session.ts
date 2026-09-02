import { cookies } from 'next/headers';
import { getFirebaseAdminAuth } from '@/lib/firebase/admin';

export const FIREBASE_SESSION_COOKIE = 'tss_firebase_session';
export const FIREBASE_SESSION_MAX_AGE = 5 * 24 * 60 * 60 * 1000;

export async function getCurrentFirebaseUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(FIREBASE_SESSION_COOKIE)?.value;
  if (!sessionCookie) return null;

  try {
    // Session cookies are cryptographically verified locally. Revocation checks
    // require a network round-trip to Firebase and were adding hundreds of ms to
    // every authenticated API request. Logout clears the session cookie locally.
    return await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, false);
  } catch {
    return null;
  }
}
