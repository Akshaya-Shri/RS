const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:1234@localhost:5432/revathi_store';

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to "revathi_store" for migration.');

    // 1. Alter schema
    console.log('Altering products table schema if needed...');
    
    // Helper function to add column if not exists
    const addColumnIfNotExists = async (tableName, columnName, dataType, defaultValue = '') => {
      const checkQuery = `
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      `;
      const res = await client.query(checkQuery, [tableName, columnName]);
      if (res.rowCount === 0) {
        console.log(`Adding column "${columnName}" to table "${tableName}"...`);
        let alterQuery = `ALTER TABLE ${tableName} ADD COLUMN "${columnName}" ${dataType}`;
        if (defaultValue !== '') {
          alterQuery += ` DEFAULT ${defaultValue}`;
        }
        await client.query(alterQuery);
      }
    };

    // Add columns to products table
    await addColumnIfNotExists('products', 'imageUrl', 'VARCHAR(255)', `'/images/Oilimages/groundnutoil.png'`);
    await addColumnIfNotExists('products', 'price', 'NUMERIC(10,2)', '0');
    await addColumnIfNotExists('products', 'sizes', 'VARCHAR(50)[]', `ARRAY['1L']::VARCHAR(50)[]`);
    await addColumnIfNotExists('products', 'available', 'BOOLEAN', 'TRUE');
    await addColumnIfNotExists('products', 'name_ta', 'VARCHAR(255)');
    await addColumnIfNotExists('products', 'description_ta', 'TEXT');
    await client.query('ALTER TABLE products DROP COLUMN IF EXISTS benefits');
    await addColumnIfNotExists('products', 'benefits', 'TEXT[]');
    await addColumnIfNotExists('products', 'benefits_ta', 'TEXT[]');
    await addColumnIfNotExists('products', 'usage', 'TEXT');
    await addColumnIfNotExists('products', 'usage_ta', 'TEXT');
    await addColumnIfNotExists('products', 'sku', 'VARCHAR(100)');
    await addColumnIfNotExists('products', 'barcode', 'VARCHAR(100)', `''`);
    await addColumnIfNotExists('products', 'stock', 'INTEGER', '0');
    await addColumnIfNotExists('products', 'reserved', 'INTEGER', '0');
    await addColumnIfNotExists('products', 'incoming', 'INTEGER', '0');
    await addColumnIfNotExists('products', 'min_stock', 'INTEGER', '0');
    await addColumnIfNotExists('products', 'reorder_qty', 'INTEGER', '0');
    await addColumnIfNotExists('products', 'backorder_allowed', 'BOOLEAN', 'FALSE');
    await addColumnIfNotExists('products', 'locations', 'JSONB', `'[]'::jsonb`);
    await addColumnIfNotExists('products', 'variants', 'JSONB', `'[]'::jsonb`);
    await addColumnIfNotExists('products', 'batches', 'JSONB', `'[]'::jsonb`);
    await addColumnIfNotExists('products', 'cost_price', 'NUMERIC(10,2)', '0');
    await addColumnIfNotExists('products', 'last_cost', 'NUMERIC(10,2)', '0');
    await addColumnIfNotExists('products', 'unit', 'VARCHAR(50)', `'/ 1L'`);
    await addColumnIfNotExists('products', 'pack_size', 'INTEGER');
    await addColumnIfNotExists('products', 'supplierId', 'INTEGER');
    await addColumnIfNotExists('products', 'leadTimeDays', 'INTEGER', '7');
    await addColumnIfNotExists('products', 'low_stock_threshold', 'INTEGER', '0');
    await addColumnIfNotExists('products', 'stock_status', 'VARCHAR(50)', `'in_stock'`);
    await addColumnIfNotExists('products', 'stock_updated_at', 'TIMESTAMP WITH TIME ZONE');

    // Add columns to orders table
    console.log('Altering orders table schema if needed...');
    await addColumnIfNotExists('orders', 'customer_name', 'VARCHAR(255)');
    await addColumnIfNotExists('orders', 'customer_phone', 'VARCHAR(50)');
    await addColumnIfNotExists('orders', 'customer_email', 'VARCHAR(255)');
    await addColumnIfNotExists('orders', 'address', 'TEXT');
    await addColumnIfNotExists('orders', 'city', 'VARCHAR(100)');
    await addColumnIfNotExists('orders', 'state', 'VARCHAR(100)');
    await addColumnIfNotExists('orders', 'pincode', 'VARCHAR(20)');

    // Alter order_items table instead of recreating it
    console.log('Altering order_items table schema...');
    await addColumnIfNotExists('order_items', 'product_id', 'INTEGER REFERENCES products(id) ON DELETE CASCADE');
    await addColumnIfNotExists('order_items', 'size', 'VARCHAR(50)');
    await client.query('ALTER TABLE order_items ALTER COLUMN product_variant_id DROP NOT NULL');

    // Create inventory_audit table
    console.log('Creating inventory_audit table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_audit (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        change INTEGER NOT NULL,
        reason VARCHAR(255),
        "user" VARCHAR(100),
        "before" JSONB,
        "after" JSONB,
        at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    console.log('Database tables altered and set up.');

    // 2. Import Products
    const productsPath = path.join(__dirname, 'src/data/products.json');
    if (fs.existsSync(productsPath)) {
      console.log('Importing products from json...');
      const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
      for (const p of productsData) {
        // Map category in JSON to type in DB
        const type = p.category; // groundnut, coconut, sesame, castor, deepam
        
        const benefitsArray = Array.isArray(p.benefits) ? p.benefits : [];
        const benefitsTaArray = Array.isArray(p.benefits_ta) ? p.benefits_ta : [];

        // Insert or update products
        const insertQuery = `
          INSERT INTO products (
            id, name, name_ta, description, description_ta, type, slug, 
            "imageUrl", price, sizes, available, benefits, benefits_ta, 
            "usage", usage_ta, sku, barcode, stock, reserved, incoming, 
            min_stock, reorder_qty, backorder_allowed, locations, 
            variants, batches, cost_price, last_cost, unit, 
            "pack_size", "supplierId", "leadTimeDays", 
            low_stock_threshold, stock_status, stock_updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
            $29, $30, $31, $32, $33, $34, $35
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            name_ta = EXCLUDED.name_ta,
            description = EXCLUDED.description,
            description_ta = EXCLUDED.description_ta,
            type = EXCLUDED.type,
            slug = EXCLUDED.slug,
            "imageUrl" = EXCLUDED."imageUrl",
            price = EXCLUDED.price,
            sizes = EXCLUDED.sizes,
            available = EXCLUDED.available,
            benefits = EXCLUDED.benefits,
            benefits_ta = EXCLUDED.benefits_ta,
            "usage" = EXCLUDED."usage",
            usage_ta = EXCLUDED.usage_ta,
            sku = EXCLUDED.sku,
            barcode = EXCLUDED.barcode,
            stock = EXCLUDED.stock,
            reserved = EXCLUDED.reserved,
            incoming = EXCLUDED.incoming,
            min_stock = EXCLUDED.min_stock,
            reorder_qty = EXCLUDED.reorder_qty,
            backorder_allowed = EXCLUDED.backorder_allowed,
            locations = EXCLUDED.locations,
            variants = EXCLUDED.variants,
            batches = EXCLUDED.batches,
            cost_price = EXCLUDED.cost_price,
            last_cost = EXCLUDED.last_cost,
            unit = EXCLUDED.unit,
            "pack_size" = EXCLUDED."pack_size",
            "supplierId" = EXCLUDED."supplierId",
            "leadTimeDays" = EXCLUDED."leadTimeDays",
            low_stock_threshold = EXCLUDED.low_stock_threshold,
            stock_status = EXCLUDED.stock_status,
            stock_updated_at = EXCLUDED.stock_updated_at
        `;

        const values = [
          p.id,
          p.name,
          p.name_ta || null,
          p.description || null,
          p.description_ta || null,
          type,
          p.slug,
          p.imageUrl || '/images/Oilimages/groundnutoil.png',
          p.price || 0,
          p.sizes || [],
          p.available ?? true,
          benefitsArray,
          benefitsTaArray,
          p.usage || null,
          p.usage_ta || null,
          p.sku || null,
          p.barcode || '',
          p.stock || 0,
          p.reserved || 0,
          p.incoming || 0,
          p.min_stock || 0,
          p.reorder_qty || 0,
          p.backorder_allowed ?? false,
          JSON.stringify(p.locations || []),
          JSON.stringify(p.variants || []),
          JSON.stringify(p.batches || []),
          p.cost_price || 0,
          p.last_cost || 0,
          p.unit || 'ml',
          p.pack_size || null,
          p.supplierId || null,
          p.leadTimeDays || 7,
          p.low_stock_threshold || 0,
          p.stock_status || 'in_stock',
          p.stock_updated_at ? new Date(p.stock_updated_at) : null
        ];

        await client.query(insertQuery, values);
      }
      console.log('Products imported successfully.');
      
      // Update serial sequence for products table so new records don't hit duplicate key errors
      await client.query("SELECT setval('products_id_seq', COALESCE((SELECT MAX(id)+1 FROM products), 1), false)");
    }

    // 3. Import Orders
    const ordersPath = path.join(__dirname, 'src/data/orders.json');
    if (fs.existsSync(ordersPath)) {
      console.log('Importing orders from json...');
      const ordersData = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
      for (const o of ordersData) {
        const orderQuery = `
          INSERT INTO orders (
            id, total_amount, status, payment_img_url, transaction_id, created_at,
            customer_name, customer_phone, customer_email, address, city, state, pincode
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
          )
          ON CONFLICT (id) DO UPDATE SET
            total_amount = EXCLUDED.total_amount,
            status = EXCLUDED.status,
            payment_img_url = EXCLUDED.payment_img_url,
            transaction_id = EXCLUDED.transaction_id,
            created_at = EXCLUDED.created_at,
            customer_name = EXCLUDED.customer_name,
            customer_phone = EXCLUDED.customer_phone,
            customer_email = EXCLUDED.customer_email,
            address = EXCLUDED.address,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            pincode = EXCLUDED.pincode
        `;
        await client.query(orderQuery, [
          o.id,
          o.total_amount,
          o.status || 'pending',
          o.payment_img_url || null,
          o.transaction_id || null,
          o.created_at ? new Date(o.created_at) : new Date(),
          o.customer_name,
          o.customer_phone,
          o.customer_email || null,
          o.address,
          o.city,
          o.state,
          o.pincode
        ]);

        // Insert items
        if (Array.isArray(o.items)) {
          // Clear existing items for this order to avoid duplicates on re-run
          await client.query('DELETE FROM order_items WHERE order_id = $1', [o.id]);
          for (const item of o.items) {
            const itemQuery = `
              INSERT INTO order_items (
                order_id, product_id, size, quantity, price
              ) VALUES ($1, $2, $3, $4, $5)
            `;
            await client.query(itemQuery, [
              o.id,
              item.product_id,
              item.size,
              item.quantity,
              item.price
            ]);
          }
        }
      }
      console.log('Orders and order items imported successfully.');
      
      // Update serial sequence for orders table
      await client.query("SELECT setval('orders_id_seq', COALESCE((SELECT MAX(id)+1 FROM orders), 1), false)");
    }

    console.log('Migration finished successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

main();
