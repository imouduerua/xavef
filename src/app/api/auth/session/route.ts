
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { app, firestore } from '@/firebase/server-init';

// This is the endpoint that creates the session cookie.
export async function POST(request: NextRequest) {
  // getAuth() must be called with the initialized 'app' instance
  const auth = getAuth(app);
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }
    
    // Verify the ID token first.
    const decodedClaims = await auth.verifyIdToken(idToken);
    
    // Now, check if the user is an admin.
    const adminDoc = await firestore.collection('admins').doc(decodedClaims.uid).get();
    const userIsDbAdmin = adminDoc.exists;
    const userIsSuperAdmin = decodedClaims.email === 'admin@xavef.com';

    if (!userIsDbAdmin && !userIsSuperAdmin) {
       return NextResponse.json({ error: 'Permission denied. You must be an admin to log in.' }, { status: 403 });
    }

    // Set session expiration to 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    
    // Create the session cookie.
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    // Set the cookie on the response
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
    const errorMessage = error.message || 'An unknown error occurred.';
    const errorCode = error.code || 'UNKNOWN_CODE';
    return NextResponse.json({ error: `Failed to create session. Reason: ${errorMessage} (Code: ${errorCode})` }, { status: 401 });
  }
}

// This is the endpoint that clears the session cookie upon logout.
export async function DELETE() {
  try {
    const sessionCookie = cookies().get('session')?.value;
    if (sessionCookie) {
      // Clear the cookie by setting its maxAge to 0
      cookies().set('session', '', { maxAge: 0 });
    }
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error clearing session cookie:', error);
    return NextResponse.json({ error: 'Failed to clear session.' }, { status: 500 });
  }
}
