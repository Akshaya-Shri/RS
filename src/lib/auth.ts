import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'revathi-store-erp-super-secret-key-1975-oil-mill';

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(payload: { userId: number; username: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): { userId: number; username: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; username: string; role: string };
  } catch (error) {
    return null;
  }
}

export async function verifySession(token: string, secret?: string): Promise<{ userId: number; username: string; role: string } | null> {
  try {
    const key = secret || JWT_SECRET;
    try {
      return jwt.verify(token, key) as { userId: number; username: string; role: string };
    } catch (e) {
      if (key !== JWT_SECRET) {
        return jwt.verify(token, JWT_SECRET) as { userId: number; username: string; role: string };
      }
      throw e;
    }
  } catch (error) {
    return null;
  }
}
