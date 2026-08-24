import { cookies } from 'next/headers';
import { getFirebaseAdminAuth } from '@/lib/firebase/admin';

export const FIREBASE_SESSION_COOKIE = 'tss_firebase_session';
export const FIREBASE_SESSION_MAX_AGE = 5 * 24 * 60 * 60 * 1000;

export async function getCurrentFirebaseUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(FIREBASE_SESSION_COOKIE)?.value;
  if (!sessionCookie) return null;

  try {
    return await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}
