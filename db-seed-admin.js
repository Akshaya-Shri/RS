const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// 1. Load environment variables from .env.local manually
const envPath = path.join(__dirname, '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      env[key] = val;
    }
  });
}

const connectionString = env.DATABASE_URL || 
  `postgresql://${env.DB_USER || 'postgres'}:${env.DB_PASSWORD || '1234'}@${env.DB_HOST || 'localhost'}:${env.DB_PORT || 5432}/${env.DB_NAME || 'revathi_store'}`;

const ADMIN_USER = env.ADMIN_USER || 'admin';
const ADMIN_PASS = env.ADMIN_PASS || 'admin123';
const ADMIN_EMAIL = env.ADMIN_EMAIL || 'admin@revathistore.com';

async function main() {
  console.log('Connecting to database for seeding...');
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected successfully.');

    // 2. Perform Migration: Add password_hash column to users table
    console.log('Altering "users" table to add "password_hash" column if not exists...');
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
    `);
    console.log('Table altered.');

    // 3. Generate Bcrypt Hash
    console.log(`Generating bcrypt hash for admin user "${ADMIN_USER}"...`);
    const saltRounds = 10;
    const hash = await bcrypt.hash(ADMIN_PASS, saltRounds);

    // 4. Seed User into users table
    console.log('Seeding admin user into "users" table...');
    const userRes = await client.query(`
      INSERT INTO users (name, email, role, password_hash)
      VALUES ($1, $2, 'admin', $3)
      ON CONFLICT (email) 
      DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        role = 'admin'
      RETURNING id;
    `, [ADMIN_USER, ADMIN_EMAIL, hash]);

    const userId = userRes.rows[0].id;
    console.log(`Admin user seeded with ID: ${userId}`);

    // 5. Seed admin user into admins table
    console.log('Seeding admin user into "admins" table if not exists...');
    await client.query(`
      INSERT INTO admins (user_id)
      SELECT $1
      WHERE NOT EXISTS (
        SELECT 1 FROM admins WHERE user_id = $1
      );
    `, [userId]);
    console.log('Admin seeding complete.');

  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
