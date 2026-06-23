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

  console.log('\n--- COLUMNS IN orders ---');
  const orders = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders'");
  console.log(orders.rows.map(r => `${r.column_name} (${r.data_type})`));

  console.log('\n--- COLUMNS IN order_items ---');
  const orderItems = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'order_items'");
  console.log(orderItems.rows.map(r => `${r.column_name} (${r.data_type})`));

  console.log('\n--- COLUMNS IN products ---');
  const products = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products'");
  console.log(products.rows.map(r => `${r.column_name} (${r.data_type})`));

  await client.end();
}

main().catch(console.error);
