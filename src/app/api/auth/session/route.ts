
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { app, firestore } from '@/firebase/server-init';
import 'server-only';

export async function POST(request: NextRequest) {
  const auth = getAuth(app);
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }

    const decodedClaims = await auth.verifyIdToken(idToken, true);
    
    const adminDoc = await firestore.collection('admins').doc(decodedClaims.uid).get();
    
    const isDbAdmin = adminDoc.exists;
    const isSuperAdmin = decodedClaims.email === 'admin@xavef.com';

    if (!isDbAdmin && !isSuperAdmin) {
       return NextResponse.json({ error: 'Permission denied. You must be an admin to log in.' }, { status: 403 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    cookies().set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('Error creating session cookie:', error);
    
    const errorMessage = error.code ? `${error.message} (Code: ${error.code})` : 'An unknown server error occurred.';
    return NextResponse.json({ error: `Failed to create session: ${errorMessage}` }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    cookies().delete('session');
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error clearing session cookie:', error);
    return NextResponse.json({ error: 'Failed to clear session.' }, { status: 500 });
  }
}
