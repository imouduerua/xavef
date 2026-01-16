
import { NextResponse, type NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { app } from '@/firebase/server-init';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  try {
    const decodedToken = await getAuth(app).verifyIdToken(idToken);
    
    // Hardcode admin check to a specific email
    const userIsAdmin = decodedToken.email === 'admin@xavef.com';

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
