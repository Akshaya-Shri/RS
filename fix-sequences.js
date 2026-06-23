const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

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

const connectionString = env.DATABASE_URL || 'postgresql://postgres@localhost:5433/revathi_store';

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to align sequences...');

  const tables = [
    'users',
    'products',
    'product_variants',
    'orders',
    'order_items',
    'wholesale_leads',
    'login_logs',
    'suppliers',
    'purchases',
    'purchase_items',
    'supplier_ledger',
    'supplier_payments',
    'customers',
    'sales',
    'sale_items',
    'invoices',
    'stock_ledger',
    'tin_transactions',
    'attendance',
    'audit_logs',
    'admins',
    'inventory_audit'
  ];

  for (const table of tables) {
    try {
      const seqRes = await client.query(`
        SELECT pg_get_serial_sequence($1, 'id') as seq
      `, [table]);
      
      const seq = seqRes.rows[0]?.seq;
      if (!seq) {
        console.log(`No sequence found for table "${table}"`);
        continue;
      }

      const maxRes = await client.query(`SELECT COALESCE(MAX(id), 0) as max_id FROM "${table}"`);
      const maxId = parseInt(maxRes.rows[0].max_id);

      // setval expects value >= 1. If maxId is 0, we can set the sequence to restart from 1.
      if (maxId > 0) {
        await client.query(`SELECT setval($1, $2)`, [seq, maxId]);
        console.log(`✓ Aligned sequence "${seq}" to match max ID: ${maxId}`);
      } else {
        await client.query(`ALTER SEQUENCE ${seq} RESTART WITH 1`);
        console.log(`✓ Restarted sequence "${seq}" since table "${table}" is empty`);
      }
    } catch (err) {
      console.error(`✗ Error processing table "${table}":`, err.message);
    }
  }

  await client.end();
  console.log('All sequences aligned successfully.');
}

main().catch(console.error);
