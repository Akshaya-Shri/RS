import { NextResponse } from 'next/server';

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

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const response = NextResponse.json({ success: true });
      
      // Set secure HTTP-only cookie, expires in 24 hours
      response.cookies.set({
        name: 'revathi_admin_auth',
        value: 'authenticated',
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 
      });

      return response;
    }

    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
