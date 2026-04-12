import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // If user is trying to access an admin page
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // Allow the login page itself to be accessed
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Check for our simple auth cookie
    const authCookie = request.cookies.get('revathi_admin_auth');
    if (authCookie?.value !== 'authenticated') {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Also protect admin API routes from unauthorized external calls
  if (request.nextUrl.pathname.startsWith('/api/admin') && request.nextUrl.pathname !== '/api/admin/login') {
    const authCookie = request.cookies.get('revathi_admin_auth');
    if (authCookie?.value !== 'authenticated') {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

// Only run middleware on admin and API routes to save performance
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
