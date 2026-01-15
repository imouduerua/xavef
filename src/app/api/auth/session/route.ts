
import { NextResponse, type NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { app, firestore } from '@/firebase/server-init';
import { cookies } from 'next/headers';

async function isAdmin(uid: string): Promise<boolean> {
  const superAdminUid = process.env.FIREBASE_SUPER_ADMIN_UID;
  if (superAdminUid && uid === superAdminUid) {
    return true;
  }
  try {
    const adminDoc = await firestore.collection('admins').doc(uid).get();
    return adminDoc.exists && adminDoc.data()?.isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  try {
    const decodedToken = await getAuth(app).verifyIdToken(idToken);
    const userIsAdmin = await isAdmin(decodedToken.uid);

    if (!userIsAdmin) {
      return NextResponse.json({ success: false, error: 'Permission denied.' }, { status: 403 });
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
    return NextResponse.json({ success: false, error: 'Failed to create session.' }, { status: 401 });
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
