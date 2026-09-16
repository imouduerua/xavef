
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { app } from '@/firebase/server-init';
import 'server-only';

export async function POST(request: NextRequest) {
  const idToken = await request.text();

  // Session expires in 5 days.
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  try {
    const auth = getAuth(app);
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    const isSecure = process.env.NODE_ENV === 'production';
    cookies().set('session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: isSecure, path: '/' });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error creating session cookie:', error);
    // Ensure the client receives a structured error message.
    const errorMessage = error.message || 'An unexpected server error occurred.';
    return NextResponse.json({ success: false, error: `Server error: ${errorMessage}` }, { status: 401 });
  }
}

export async function DELETE() {
  cookies().delete('session');
  return NextResponse.json({ success: true });
}
