import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'default_super_secret_key_for_revathi_store_admin_portal';

  // If user is trying to access an admin page
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // Check if they are accessing the login page itself (handle trailing slash)
    if (request.nextUrl.pathname.startsWith('/admin/login')) {
      const authCookie = request.cookies.get('revathi_admin_auth');
      const session = authCookie ? await verifySession(authCookie.value, ADMIN_JWT_SECRET) : null;
      
      // If already logged in, redirect to admin home
      if (session) {
        const dashboardUrl = new URL('/admin', request.url);
        return NextResponse.redirect(dashboardUrl);
      }
      return NextResponse.next();
    }

    // Check for our secure signed auth cookie
    const authCookie = request.cookies.get('revathi_admin_auth');
    const session = authCookie ? await verifySession(authCookie.value, ADMIN_JWT_SECRET) : null;
    
    if (!session) {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Also protect admin API routes from unauthorized external calls
  // Exclude login and logout endpoints so users can hit them unauthenticated if necessary
  if (request.nextUrl.pathname.startsWith('/api/admin') && 
      !request.nextUrl.pathname.startsWith('/api/admin/login') &&
      !request.nextUrl.pathname.startsWith('/api/admin/logout')) {
    const authCookie = request.cookies.get('revathi_admin_auth');
    const session = authCookie ? await verifySession(authCookie.value, ADMIN_JWT_SECRET) : null;
    
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

// Only run middleware on admin and API routes to save performance
export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
};

