import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'revathi-store-erp-super-secret-key-1975-oil-mill';

// Pure JS JWT decoder for reading claims (Edge-safe)
function parseJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const paddedBase64 = pad ? base64 + '='.repeat(4 - pad) : base64;
    const jsonPayload = atob(paddedBase64);
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// WebCrypto HMAC SHA-256 signature verifier (Edge-safe)
async function verifyHS256(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [header, payload, signature] = parts;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Convert base64url signature back to array buffer
    const sigBase64 = signature.replace(/-/g, '+').replace(/_/g, '/');
    const pad = sigBase64.length % 4;
    const paddedSig = pad ? sigBase64 + '='.repeat(4 - pad) : sigBase64;
    
    const sigBinary = atob(paddedSig);
    const sigBuffer = new Uint8Array(sigBinary.length);
    for (let i = 0; i < sigBinary.length; i++) {
      sigBuffer[i] = sigBinary.charCodeAt(i);
    }

    const data = encoder.encode(`${header}.${payload}`);
    return await crypto.subtle.verify('HMAC', key, sigBuffer, data);
  } catch (err) {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect admin UI routes
  if (pathname.startsWith('/admin')) {
    if (pathname.startsWith('/admin/login')) {
      return NextResponse.next();
    }

    const authCookie = request.cookies.get('revathi_admin_auth');
    if (!authCookie || !authCookie.value) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    const token = authCookie.value;
    const isValid = await verifyHS256(token, JWT_SECRET);
    const payload = parseJwt(token);

    if (!isValid || !payload || payload.exp * 1000 < Date.now() || payload.role !== 'admin') {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('revathi_admin_auth');
      return response;
    }
  }

  // Protect admin API routes
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/login')) {
    const authCookie = request.cookies.get('revathi_admin_auth');
    if (!authCookie || !authCookie.value) {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 401 });
    }

    const token = authCookie.value;
    const isValid = await verifyHS256(token, JWT_SECRET);
    const payload = parseJwt(token);

    if (!isValid || !payload || payload.exp * 1000 < Date.now() || payload.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized session' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
