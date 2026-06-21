import { NextResponse } from 'next/server';
import { signSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { action, username, password } = await req.json();

    if (action === 'logout') {
      const response = NextResponse.json({ success: true });
      response.cookies.delete('revathi_admin_auth');
      return response;
    }

    // Replace these with environment variables in a real production setup
    const ADMIN_USER = process.env.ADMIN_USER || 'admin';
    const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
    const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'default_super_secret_key_for_revathi_store_admin_portal';

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const response = NextResponse.json({ success: true });
      
      const maxAge = 60 * 60 * 24; // 24 hours
      const expiresAt = Date.now() + (maxAge * 1000);
      
      const sessionToken = await signSession({ username, expiresAt }, ADMIN_JWT_SECRET);
      
      // Set secure HTTP-only cookie, expires in 24 hours
      response.cookies.set({
        name: 'revathi_admin_auth',
        value: sessionToken,
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: maxAge 
      });

      return response;
    }

    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
