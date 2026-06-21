import { cookies } from 'next/headers';
import { verifySession } from './auth';
import { pool } from './db';

/**
 * Verifies the admin session token against both cryptographic JWT signature
 * and the database user_sessions registry.
 */
export async function verifyDbSession() {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('revathi_admin_auth');
    if (!authCookie) return null;

    const token = authCookie.value;
    const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'default_super_secret_key_for_revathi_store_admin_portal';

    // 1. Cryptographic cryptographic verification
    const payload = await verifySession(token, ADMIN_JWT_SECRET);
    if (!payload) return null;

    // 2. Database validation
    const res = await pool.query(
      'SELECT id, user_id FROM user_sessions WHERE token = $1 LIMIT 1',
      [token]
    );

    if (res.rowCount === 0) {
      return null;
    }

    return {
      username: payload.username,
      userId: res.rows[0].user_id,
      sessionRecordId: res.rows[0].id
    };
  } catch (error) {
    console.error('Database session verification failed:', error);
    return null;
  }
}
