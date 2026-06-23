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

  console.log('--- USER SESSIONS ---');
  const sessions = await client.query('SELECT * FROM user_sessions');
  console.log(sessions.rows);

  await client.end();
}

main().catch(console.error);

