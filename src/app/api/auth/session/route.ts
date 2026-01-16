
import { NextResponse, type NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { app, firestore } from '@/firebase/server-init';
import { cookies } from 'next/headers';
import { collection, query, orderBy, limit, getDocs, serverTimestamp, doc } from 'firebase-admin/firestore';

/**
 * Checks if a user is an admin. If they are the first user and no other admins exist,
 * it promotes them to admin by creating a document in the 'admins' collection.
 * @param uid The user's ID to check.
 * @returns A promise that resolves to true if the user is an admin, false otherwise.
 */
async function ensureAdminUser(uid: string): Promise<boolean> {
  try {
    // Standard check: Is the user in the 'admins' collection?
    const adminDocRef = firestore.collection('admins').doc(uid);
    const adminDoc = await adminDocRef.get();
    if (adminDoc.exists && adminDoc.data()?.isAdmin === true) {
      return true;
    }

    // BOOTSTRAP LOGIC: If no admins exist, treat the first user ever created as the admin.
    const adminsSnapshot = await firestore.collection('admins').limit(1).get();
    if (adminsSnapshot.empty) {
      const usersQuery = query(firestore.collection('users'), orderBy('createdAt', 'asc'), limit(1));
      const usersSnapshot = await usersQuery.get();

      if (!usersSnapshot.empty && usersSnapshot.docs[0].id === uid) {
        console.warn(`BOOTSTRAPPING ADMIN: Granting admin access to first registered user: ${uid}`);
        // Atomically create the admin document to promote the user.
        await adminDocRef.set({
          isAdmin: true,
          promotedBy: 'system-bootstrap',
          promotedAt: serverTimestamp(),
        });
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error in ensureAdminUser:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  try {
    const decodedToken = await getAuth(app).verifyIdToken(idToken);
    const userIsAdmin = await ensureAdminUser(decodedToken.uid);

    if (!userIsAdmin) {
      return NextResponse.json({ success: false, error: 'Permission denied. You are not an administrator.' }, { status: 403 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await getAuth(app).createSessionCookie(idToken, { expiresIn });

    cookies().set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Session Login Error:', error);
    const errorMessage = error.code === 'auth/id-token-expired' 
      ? 'Login session has expired. Please try again.'
      : 'Failed to create session due to a server error.';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 401 });
  }
}

export async function DELETE() {
  try {
    cookies().delete('session');
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Session Logout Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to clear session.' }, { status: 500 });
  }
}
