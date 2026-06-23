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

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  console.log('--- USERS IN DB (5433) ---');
  const users = await client.query('SELECT id, name, email, role, username FROM users');
  console.log(users.rows);

  console.log('\n--- COLUMNS IN orders (5433) ---');
  const orderCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'orders'
  `);
  console.log(orderCols.rows.map(r => `${r.column_name} (${r.data_type})`));

  console.log('\n--- ALL TABLES (5433) ---');
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  console.log(tables.rows.map(r => r.table_name));

  await client.end();
}

main().catch(console.error);
