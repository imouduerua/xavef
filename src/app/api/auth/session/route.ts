
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { app, firestore } from '@/firebase/server-init';
import 'server-only';

// This is the endpoint that creates the session cookie for admin login.
export async function POST(request: NextRequest) {
  // getAuth() must be called with the initialized 'app' instance from server-init.
  const auth = getAuth(app);
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }

    // Verify the ID token first. This will throw an error if the token is invalid.
    const decodedClaims = await auth.verifyIdToken(idToken, true);
    
    // Now, check if the user is an admin on the server side.
    const adminDocRef = firestore.collection('admins').doc(decodedClaims.uid);
    const adminDoc = await adminDocRef.get();
    
    const userIsDbAdmin = adminDoc.exists;
    const userIsSuperAdmin = decodedClaims.email === 'admin@xavef.com';

    // This is the crucial admin check.
    if (!userIsDbAdmin && !userIsSuperAdmin) {
       return NextResponse.json({ error: 'Permission denied. You must be an admin to log in.' }, { status: 403 });
    }

    // Set session expiration to 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    
    // Create the session cookie. This can throw an error if the SDK is not initialized correctly.
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
    // Log the full error on the server for debugging.
    console.error('Error creating session cookie:', error);
    
    const errorMessage = error.message || 'An unknown error occurred.';
    const errorCode = error.code || 'UNKNOWN_CODE';
    
    // Send a generic but informative error to the client.
    return NextResponse.json({ error: `Failed to create session. Server error: ${errorMessage} (Code: ${errorCode})` }, { status: 401 });
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
