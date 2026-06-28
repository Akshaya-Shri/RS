import { vi, describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/admin/login/route';
import { pool } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// Mock the database pool module to avoid hitting a running database instance
vi.mock('@/lib/db', () => {
  const mockQuery = vi.fn();
  return {
    pool: {
      query: mockQuery
    },
    default: {
      query: mockQuery
    }
  };
});

describe('Admin Login API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if username or password is not provided', async () => {
    const req = new Request('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '', password: '' })
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.message).toContain('Username and password are required');
  });

  it('should return 401 if the admin user is not found in the database', async () => {
    // Mock user query to return 0 rows (no matching user)
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const req = new Request('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'nonexistent', password: 'password123' })
    });

    const response = await POST(req);
    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.message).toContain('Invalid credentials');
  });

  it('should return 401 if the password does not match the database hash', async () => {
    const testHash = hashPassword('correctPassword');
    // Mock database to return user but with mismatched password
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{
        id: 1,
        name: 'admin',
        role: 'admin',
        password_hash: testHash
      }],
      rowCount: 1
    });

    const req = new Request('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrongPassword' })
    });

    const response = await POST(req);
    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.message).toContain('Invalid credentials');
  });

  it('should return 200, write session log, and set secure cookie on correct credentials', async () => {
    const password = 'mySuperSecurePassword';
    const testHash = hashPassword(password);
    
    // Mock DB queries:
    // 1. User fetch query
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{
        id: 1,
        name: 'admin',
        email: 'admin@revathistore.com',
        role: 'admin',
        password_hash: testHash
      }],
      rowCount: 1
    });
    // 2. Insert into login_logs (successful write)
    vi.mocked(pool.query).mockResolvedValueOnce({ rowCount: 1 });
    // 3. Insert into user_sessions (successful write)
    vi.mocked(pool.query).mockResolvedValueOnce({ rowCount: 1 });

    const req = new Request('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Vitest-Test-Agent',
        'X-Forwarded-For': '192.168.1.1'
      },
      body: JSON.stringify({ username: 'admin', password })
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);

    // Verify authentication cookies were set in headers
    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain('revathi_admin_auth');
    expect(setCookie).toContain('HttpOnly');
  });

  it('should successfully delete authentication cookie on logout action', async () => {
    const req = new Request('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' })
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    
    const json = await response.json();
    expect(json.success).toBe(true);

    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain('revathi_admin_auth=;'); // Cleans the cookie value
  });
});
