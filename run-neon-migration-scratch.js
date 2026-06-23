const { Client } = require('pg');
const fs = require('fs');

async function main() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  let dbUrl = '';
  envContent.split('\n').forEach(line => {
    if (line.startsWith('DATABASE_URL=')) {
      dbUrl = line.split('=')[1].trim();
    }
  });

  const sql = fs.readFileSync('migrations-neon.sql', 'utf8');

  console.log('Connecting to database on 5433...');
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  console.log('Connected.');

  console.log('Executing migrations-neon.sql...');
  // Execute the entire file contents
  try {
    await client.query(sql);
    console.log('✓ Migrations executed successfully.');
  } catch (err) {
    console.error('✗ Migration failed:', err);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
