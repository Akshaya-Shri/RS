import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signSession } from '@/lib/auth';
import { pool } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'default_super_secret_key_for_revathi_store_admin_portal';

    // Query database for admin user matching name or email and role = 'admin'
    const res = await pool.query(
      "SELECT * FROM users WHERE (name = $1 OR email = $1) AND role = 'admin' LIMIT 1",
      [username]
    );

    if (res.rowCount > 0) {
      const user = res.rows[0];
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (isValid) {
        const response = NextResponse.json({ success: true });
        
        const maxAge = 60 * 60 * 24; // 24 hours
        const expiresAt = Date.now() + (maxAge * 1000);
        
        const sessionToken = await signSession({ username: user.name, expiresAt }, ADMIN_JWT_SECRET);
        
        // Write active session and log to database
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
        const userAgent = req.headers.get('user-agent') || 'unknown';

        await pool.query(
          'INSERT INTO user_sessions (user_id, token, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
          [user.id, sessionToken, ip, userAgent]
        );

        await pool.query(
          "INSERT INTO audit_logs (entity_type, entity_id, action, performed_by, data) VALUES ('user', $1, 'login', $1, $2)",
          [user.id, JSON.stringify({ ip_address: ip, user_agent: userAgent })]
        );

        // Database session cleanup: Purge any sessions older than 24 hours
        await pool.query("DELETE FROM user_sessions WHERE created_at < NOW() - INTERVAL '24 hours'");

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
    }

    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('Login route error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

