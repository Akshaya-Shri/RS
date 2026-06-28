import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword, signToken, verifyToken, verifySession } from '@/lib/auth';

describe('Auth Utilities Unit Tests', () => {
  describe('Password Hashing', () => {
    it('should hash a password and generate a valid bcrypt hash string', () => {
      const password = 'mySecretPassword123';
      const hash = hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);
    });

    it('should successfully match correct password with generated hash', () => {
      const password = 'mySecretPassword123';
      const hash = hashPassword(password);
      
      const match = comparePassword(password, hash);
      expect(match).toBe(true);
    });

    it('should fail matching wrong password with generated hash', () => {
      const password = 'mySecretPassword123';
      const hash = hashPassword(password);
      
      const match = comparePassword('wrongPassword', hash);
      expect(match).toBe(false);
    });
  });

  describe('JWT Session Tokens', () => {
    const mockPayload = {
      userId: 42,
      username: 'testadmin',
      role: 'admin'
    };

    it('should successfully sign and verify a JWT session token', () => {
      const token = signToken(mockPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const verified = verifyToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(mockPayload.userId);
      expect(verified?.username).toBe(mockPayload.username);
      expect(verified?.role).toBe(mockPayload.role);
    });

    it('should return null for invalid token validation', () => {
      const invalidToken = 'not.a.valid.jwt.token';
      const verified = verifyToken(invalidToken);
      expect(verified).toBeNull();
    });

    it('should verify session token with alternate/explicit secret keys', async () => {
      const token = signToken(mockPayload);
      
      // verifySession handles fallback to default JWT_SECRET if validation with custom key fails
      const verified = await verifySession(token, 'another_secret_key');
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(mockPayload.userId);
    });
  });
});
