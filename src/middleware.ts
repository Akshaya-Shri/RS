import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'default_super_secret_key_for_revathi_store_admin_portal';

  // If user is trying to access an admin page
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // Allow the login page itself to be accessed (handle trailing slash)
    if (request.nextUrl.pathname.startsWith('/admin/login')) {
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
  if (request.nextUrl.pathname.startsWith('/api/admin') && 
      !request.nextUrl.pathname.startsWith('/api/admin/login') &&
      !request.nextUrl.pathname.startsWith('/api/admin/upload')) {
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
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
