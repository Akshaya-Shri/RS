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

  console.log('Altering orders table...');
  await client.query(`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS city VARCHAR(100);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS state VARCHAR(100);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);
  `);
  console.log('orders altered.');

  console.log('Altering order_items table...');
  await client.query(`
    ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE CASCADE;
    ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size VARCHAR(50);
    ALTER TABLE order_items ALTER COLUMN product_variant_id DROP NOT NULL;
  `);
  console.log('order_items altered.');

  await client.end();
}

main().catch(console.error);
