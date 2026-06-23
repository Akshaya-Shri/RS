const { Client } = require('pg');
const fs = require('fs');

async function testConnection(url, name) {
  console.log(`Testing connection for ${name} using: ${url}`);
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log(`✓ Connected to ${name}`);
    const res = await client.query("SELECT version()");
    console.log(`  Version: ${res.rows[0].version}`);
    
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`  Tables: ${tables.rows.map(r => r.table_name).join(', ')}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`✗ Failed to connect to ${name}: ${err.message}`);
    return false;
  }
}

async function main() {
  // Test from .env.local
  const envContent = fs.readFileSync('.env.local', 'utf8');
  let dbUrl = '';
  envContent.split('\n').forEach(line => {
    if (line.startsWith('DATABASE_URL=')) {
      dbUrl = line.split('=')[1].trim();
    }
  });

  if (dbUrl) {
    await testConnection(dbUrl, '.env.local DATABASE_URL');
  }

  // Also test 5432 and 5433 standard urls
  await testConnection('postgresql://postgres:secret@localhost:5432/revathi_store', 'Local 5432 (secret)');
  await testConnection('postgresql://postgres@localhost:5433/revathi_store', 'Local 5433 (no pass)');
  await testConnection('postgresql://postgres:1234@localhost:5432/revathi_store', 'Local 5432 (1234)');
}

main();
