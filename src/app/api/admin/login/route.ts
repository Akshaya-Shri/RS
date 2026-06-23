import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { action, username, password } = await req.json();

    if (action === 'logout') {
      const response = NextResponse.json({ success: true });
      response.cookies.delete('revathi_admin_auth');
      return response;
    }

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Username and password are required' }, { status: 400 });
    }

    // Connect to database and fetch user
    const userResult = await pool.query('SELECT * FROM users WHERE (name = $1 OR email = $1) AND role = \'admin\'', [username]); if (userResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const user = userResult.rows[0];

    // Check password
    const isMatch = comparePassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    // Sign secure JWT token
    const token = signToken({
      userId: user.id,
      username: user.name,
      role: user.role
    });

    const response = NextResponse.json({ success: true });

    // Set secure HTTP-only cookie, expires in 24 hours
    response.cookies.set({
      name: 'revathi_admin_auth',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24
    });

    // Save login log and session
    try {
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      const userAgent = req.headers.get('user-agent') || 'unknown';
      
      // Save login log
      await pool.query(
        'INSERT INTO login_logs (user_id, ip_address) VALUES ($1, $2)',
        [user.id, ip]
      );

      // Save user session for DB session verification
      await pool.query(
        'INSERT INTO user_sessions (user_id, token, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
        [user.id, token, ip, userAgent]
      );
    } catch (logErr) {
      console.error('Failed to write login log or session:', logErr);
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
