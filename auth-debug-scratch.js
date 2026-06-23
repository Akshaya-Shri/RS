const { Client } = require('pg');
const fs = require('fs');
const jwt = require('jsonwebtoken');

async function main() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });

  const BASE_URL = 'http://localhost:3000';
  console.log('Sending login request...');
  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: env.ADMIN_USER || 'admin',
      password: env.ADMIN_PASS || 'admin123'
    })
  });

  console.log(`Login status: ${loginRes.status}`);
  const loginJson = await loginRes.json();
  console.log('Login response:', loginJson);

  const setCookie = loginRes.headers.get('set-cookie');
  console.log(`Set-Cookie header: ${setCookie}`);
  if (!setCookie) {
    console.log('No cookie returned!');
    return;
  }

  const match = setCookie.match(/revathi_admin_auth=([^;]+)/);
  if (!match) {
    console.log('No revathi_admin_auth cookie match!');
    return;
  }
  const token = match[1];
  console.log(`Extracted token: ${token}`);

  // Decode JWT
  const decoded = jwt.decode(token);
  console.log('Decoded JWT payload:', decoded);

  // Check signature
  const JWT_SECRET = env.JWT_SECRET || 'revathi-store-erp-super-secret-key-1975-oil-mill';
  const ADMIN_JWT_SECRET = env.ADMIN_JWT_SECRET || 'default_super_secret_key_for_revathi_store_admin_portal';
  try {
    const v1 = jwt.verify(token, ADMIN_JWT_SECRET);
    console.log('✓ Cryptographic verify with ADMIN_JWT_SECRET succeeded:', v1);
  } catch (err) {
    console.log(`✗ Cryptographic verify with ADMIN_JWT_SECRET failed: ${err.message}`);
  }
  try {
    const v2 = jwt.verify(token, JWT_SECRET);
    console.log('✓ Cryptographic verify with JWT_SECRET succeeded:', v2);
  } catch (err) {
    console.log(`✗ Cryptographic verify with JWT_SECRET failed: ${err.message}`);
  }

  // Connect to DB and check session
  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();

  console.log('Querying user_sessions for token...');
  const sessionRes = await client.query('SELECT * FROM user_sessions WHERE token = $1', [token]);
  console.log(`Sessions count: ${sessionRes.rowCount}`);
  if (sessionRes.rowCount > 0) {
    console.log('Session row:', sessionRes.rows[0]);
  } else {
    console.log('Checking all sessions in DB...');
    const allSessions = await client.query('SELECT * FROM user_sessions');
    console.log(allSessions.rows);
  }

  await client.end();
}

main().catch(console.error);
