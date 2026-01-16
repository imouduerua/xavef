
import { NextResponse, type NextRequest } from 'next/server';

/**
 * @deprecated This server-side session management is deprecated for the admin user.
 * Admin authentication is now handled entirely on the client-side for simplicity
 * to bypass server environment issues. This file is kept to prevent breaking
 * any potential future flows but its functions are no longer called by the
 * admin login/logout process.
 */

export async function POST(request: NextRequest) {
    console.error("DEPRECATED: /api/auth/session POST endpoint was called. This should not happen for admin login.");
    return NextResponse.json(
        { success: false, error: 'This authentication method is deprecated.' },
        { status: 410 }
    );
}

export async function DELETE() {
  console.error("DEPRECATED: /api/auth/session DELETE endpoint was called. This should not happen for admin logout.");
  return NextResponse.json(
        { success: false, error: 'This authentication method is deprecated.' },
        { status: 410 }
    );
}
