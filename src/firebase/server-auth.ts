
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { app } from './server-init';
import 'server-only';

// This helper function allows server components and actions
// to get the currently authenticated user.

export async function getAuthenticatedUser() {
  const auth = getAuth(app);
  const sessionCookie = cookies().get('session')?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    // Fetch the full user record to ensure all properties like email are present.
    const userRecord = await auth.getUser(decodedClaims.uid);
    return userRecord;
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return null;
  }
}
