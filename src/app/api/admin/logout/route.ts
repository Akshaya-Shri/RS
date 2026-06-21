import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { pool } from '@/lib/db';
import { verifySession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('revathi_admin_auth');
    const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'default_super_secret_key_for_revathi_store_admin_portal';

    if (authCookie) {
      const token = authCookie.value;
      const session = await verifySession(token, ADMIN_JWT_SECRET);
      
      if (session) {
        // 1. Invalidate session token: delete from user_sessions table
        await pool.query('DELETE FROM user_sessions WHERE token = $1', [token]);

        // Get user ID for auditing purposes
        const userRes = await pool.query('SELECT id FROM users WHERE name = $1 LIMIT 1', [session.username]);
        if (userRes.rowCount > 0) {
          const userId = userRes.rows[0].id;
          // 2. Log logout event in audit_logs table
          await pool.query(
            "INSERT INTO audit_logs (entity_type, entity_id, action, performed_by, data) VALUES ('user', $1, 'logout', $1, $2)",
            [userId, JSON.stringify({ reason: 'user logout' })]
          );
        }
      }
    }

    // 3. Database session cleanup: Purge any sessions older than 24 hours
    await pool.query("DELETE FROM user_sessions WHERE created_at < NOW() - INTERVAL '24 hours'");

    // 4. Cookie removal: Delete the auth cookie
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    response.cookies.delete('revathi_admin_auth');
    
    return response;
  } catch (error) {
    console.error('Logout handler error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error during logout' }, { status: 500 });
  }
}
