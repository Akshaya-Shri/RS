const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// 1. Read environment variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  const dotenvContent = fs.readFileSync(envPath, 'utf8');
  dotenvContent.split('\n').forEach(line => {
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

const DB_HOST = env.DB_HOST || 'localhost';
const DB_USER = env.DB_USER || 'postgres';
const DB_PASSWORD = env.DB_PASSWORD || '';
const DB_NAME = env.DB_NAME || 'revathi_store';
const DB_PORT = parseInt(env.DB_PORT || '5432');
const BASE_URL = 'http://localhost:3000';

function getDbClient() {
  if (env.DATABASE_URL) {
    return new Client({ connectionString: env.DATABASE_URL });
  }
  return new Client({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT
  });
}

async function runTest() {
  console.log('=== STARTING POSTGRESQL VALIDATION AUDIT (TASK 3) ===');

  let client = getDbClient();
  try {
    await client.connect();
    console.log('✓ Connected to PostgreSQL database.');
  } catch (err) {
    console.error('✗ Failed to connect to database:', err);
    process.exit(1);
  }

  let authCookie = '';
  let orderProductId = null;
  let createdOrderId = null;

  try {
    // --- Step 0: Admin Authentication ---
    console.log('\n--- STEP 0: Admin Login Authentication ---');
    const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: env.ADMIN_USER || 'admin',
        password: env.ADMIN_PASS || 'admin123'
      })
    });
    if (!loginRes.ok) {
      throw new Error(`Admin login returned status ${loginRes.status}`);
    }
    const loginJson = await loginRes.json();
    if (!loginJson.success) {
      throw new Error('Admin login API response did not indicate success');
    }
    const setCookieHeader = loginRes.headers.get('set-cookie');
    if (setCookieHeader) {
      const match = setCookieHeader.match(/revathi_admin_auth=([^;]+)/);
      if (match) {
        authCookie = match[1];
      }
    }
    if (!authCookie) {
      throw new Error('Failed to retrieve authentication cookie');
    }
    console.log('✓ Admin logged in successfully.');

    // --- Step 1: Products CRUD Verification ---
    console.log('\n--- STEP 1: Products CRUD Audits ---');
    const testProductPayload = {
      name: 'E2E Test Product Oil',
      name_ta: 'முழுக்கட்டுப்பாட்டு எண்ணெய்',
      description: 'Organic E2E test oil description',
      description_ta: 'உகந்த கரிம எண்ணெய் விளக்கம்',
      category: 'groundnut',
      slug: `e2e-test-product-oil-${Date.now()}`,
      imageUrl: '/images/Oilimages/groundnutoil.png',
      price: 250.00,
      sizes: ['500ml', '1L'],
      available: true,
      benefits: ['Healthy', 'Organic'],
      benefits_ta: ['ஆரோக்கியமான', 'இயற்கையான'],
      usage: 'Cooking oil',
      usage_ta: 'சமையல் எண்ணெய்',
      sku: 'E2E-TEST-SKU-123',
      barcode: '123456789012',
      stock: 50,
      reserved: 0,
      incoming: 5,
      min_stock: 5,
      reorder_qty: 20,
      backorder_allowed: false,
      locations: ['Shelf A-1'],
      variants: [],
      batches: [],
      cost_price: 180.00,
      last_cost: 175.00,
      unit: 'ml',
      pack_size: 1000,
      supplierId: 1,
      leadTimeDays: 5,
      low_stock_threshold: 10,
      stock_status: 'in_stock'
    };

    // 1.1 Create Product
    console.log('1.1 Create Product via POST /api/admin/products...');
    const createRes = await fetch(`${BASE_URL}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `revathi_admin_auth=${authCookie}`
      },
      body: JSON.stringify(testProductPayload)
    });
    if (!createRes.ok) {
      throw new Error(`Product creation failed with status ${createRes.status}`);
    }
    const createJson = await createRes.json();
    if (!createJson.success) {
      throw new Error(`Product creation response error: ${createJson.message}`);
    }
    const createdProduct = createJson.data;
    const testProductId = createdProduct.id;
    console.log(`✓ Product created successfully with ID: ${testProductId}`);

    // Verify in PostgreSQL directly
    console.log('Checking database table "products" for direct persistence of fields...');
    const dbProductRes = await client.query('SELECT * FROM products WHERE id = $1', [testProductId]);
    if (dbProductRes.rowCount === 0) {
      throw new Error('Created product was not found in PostgreSQL products table');
    }
    const dbProduct = dbProductRes.rows[0];
    if (dbProduct.name !== testProductPayload.name || parseFloat(dbProduct.price) !== testProductPayload.price || dbProduct.sku !== testProductPayload.sku) {
      throw new Error(`DB values mismatch. Name: ${dbProduct.name}, Price: ${dbProduct.price}, SKU: ${dbProduct.sku}`);
    }
    console.log('✓ Verified product columns match in PostgreSQL.');

    // 1.2 Edit Product
    console.log('\n1.2 Edit Product via PUT /api/admin/products...');
    const editPayload = {
      id: testProductId,
      name: 'E2E Test Product Oil (Edited)',
      price: 275.50,
      sku: 'E2E-TEST-SKU-123-EDITED'
    };
    const editRes = await fetch(`${BASE_URL}/api/admin/products`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `revathi_admin_auth=${authCookie}`
      },
      body: JSON.stringify(editPayload)
    });
    if (!editRes.ok) {
      throw new Error(`Product update failed with status ${editRes.status}`);
    }
    const editJson = await editRes.json();
    if (!editJson.success) {
      throw new Error(`Product update response error: ${editJson.message}`);
    }
    console.log('✓ Product updated successfully via PUT API.');

    // Verify in PostgreSQL directly
    console.log('Checking database table "products" for edited fields...');
    const dbEditedRes = await client.query('SELECT name, price, sku FROM products WHERE id = $1', [testProductId]);
    const dbEditedProduct = dbEditedRes.rows[0];
    if (dbEditedProduct.name !== editPayload.name || parseFloat(dbEditedProduct.price) !== editPayload.price || dbEditedProduct.sku !== editPayload.sku) {
      throw new Error(`Edited values mismatch. Name: ${dbEditedProduct.name}, Price: ${dbEditedProduct.price}, SKU: ${dbEditedProduct.sku}`);
    }
    console.log('✓ Verified updated fields in PostgreSQL.');

    // 1.3 Fetch Products (Public & Admin)
    console.log('\n1.3 Fetching products from public and admin APIs...');
    
    // Public fetch
    const publicFetchRes = await fetch(`${BASE_URL}/api/products`);
    if (!publicFetchRes.ok) {
      throw new Error(`Public fetch returned status ${publicFetchRes.status}`);
    }
    const publicJson = await publicFetchRes.json();
    const publicFound = publicJson.data.find(p => p.id === testProductId);
    if (!publicFound) {
      throw new Error('Created product not found in public products list response');
    }
    console.log('✓ Product successfully retrieved from public GET /api/products.');

    // Admin fetch
    const adminFetchRes = await fetch(`${BASE_URL}/api/admin/products`, {
      headers: { 'Cookie': `revathi_admin_auth=${authCookie}` }
    });
    if (!adminFetchRes.ok) {
      throw new Error(`Admin fetch returned status ${adminFetchRes.status}`);
    }
    const adminJson = await adminFetchRes.json();
    const adminFound = adminJson.data.find(p => p.id === testProductId);
    if (!adminFound) {
      throw new Error('Created product not found in admin products list response');
    }
    console.log('✓ Product successfully retrieved from admin GET /api/admin/products.');

    // 1.4 Deactivate Product (Soft-delete via available=false)
    console.log('\n1.4 Deactivating Product (Soft-Delete) via PUT /api/admin/products...');
    const deactivateRes = await fetch(`${BASE_URL}/api/admin/products`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `revathi_admin_auth=${authCookie}`
      },
      body: JSON.stringify({ id: testProductId, available: false })
    });
    if (!deactivateRes.ok) {
      throw new Error(`Deactivate product returned status ${deactivateRes.status}`);
    }
    const dbDeactivatedRes = await client.query('SELECT available FROM products WHERE id = $1', [testProductId]);
    if (dbDeactivatedRes.rows[0].available !== false) {
      throw new Error('Product available status did not update to false in PostgreSQL');
    }
    console.log('✓ Product successfully deactivated in PostgreSQL.');

    // 1.5 Delete Product (Hard-delete)
    console.log('\n1.5 Deleting Product (Hard-Delete) via DELETE /api/admin/products...');
    const deleteRes = await fetch(`${BASE_URL}/api/admin/products`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `revathi_admin_auth=${authCookie}`
      },
      body: JSON.stringify({ id: testProductId })
    });
    if (!deleteRes.ok) {
      throw new Error(`Delete product returned status ${deleteRes.status}`);
    }
    const dbDeletedRes = await client.query('SELECT 1 FROM products WHERE id = $1 AND deleted_at IS NULL', [testProductId]);
    if (dbDeletedRes.rowCount > 0) {
      throw new Error('Product still exists (and is not soft-deleted) in PostgreSQL after DELETE call');
    }
    console.log('✓ Product successfully deleted from PostgreSQL.');

    // Create a new E2E product to run the remaining tests (Inventory & Orders)
    console.log('\nCreating a fresh test product for inventory and orders tests...');
    const prepRes = await fetch(`${BASE_URL}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `revathi_admin_auth=${authCookie}`
      },
      body: JSON.stringify({
        ...testProductPayload,
        name: 'E2E Product for Ordering',
        slug: `e2e-order-product-${Date.now()}`,
        stock: 20
      })
    });
    const prepJson = await prepRes.json();
    orderProductId = prepJson.data.id;
    console.log(`✓ Prepared test product. ID: ${orderProductId}, Initial Stock: 20`);


    // --- Step 2: Inventory Audits ---
    console.log('\n--- STEP 2: Inventory Validation & Audit ---');
    
    // 2.1 Stock Update & Adjustment API
    console.log('2.1 Adjusting stock (Adding 10 items) via POST /api/admin/inventory/adjust...');
    const adjustRes = await fetch(`${BASE_URL}/api/admin/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `revathi_admin_auth=${authCookie}`
      },
      body: JSON.stringify({
        product_id: orderProductId,
        change: 10,
        type: 'stock',
        reason: 'Restocking shipment'
      })
    });
    if (!adjustRes.ok) {
      throw new Error(`Inventory adjustment returned status ${adjustRes.status}`);
    }
    
    // Verify updated stock directly in DB
    const dbInvRes = await client.query('SELECT stock, reserved, incoming FROM products WHERE id = $1', [orderProductId]);
    const dbInv = dbInvRes.rows[0];
    console.log(`Current DB Stock: ${dbInv.stock} (Expected: 30), Reserved: ${dbInv.reserved}`);
    if (dbInv.stock !== 30) {
      throw new Error(`Stock mismatch after adjustment. Expected 30, got ${dbInv.stock}`);
    }
    console.log('✓ Verified updated stock in PostgreSQL.');

    // Verify audit log entry
    console.log('Checking inventory_audit table for change logging...');
    const dbAuditRes = await client.query(
      'SELECT * FROM inventory_audit WHERE product_id = $1 ORDER BY id DESC LIMIT 1',
      [orderProductId]
    );
    if (dbAuditRes.rowCount === 0) {
      throw new Error('No record found in inventory_audit table for product');
    }
    const auditRecord = dbAuditRes.rows[0];
    console.log(`Audit Record: Change: ${auditRecord.change}, Reason: "${auditRecord.reason}"`);
    if (auditRecord.change !== 10 || auditRecord.reason !== 'Restocking shipment') {
      throw new Error(`Audit log values mismatch. Change: ${auditRecord.change}, Reason: ${auditRecord.reason}`);
    }
    console.log('✓ Verified audit log entry in PostgreSQL.');

    // 2.2 Inventory Read API
    console.log('\n2.2 Reading inventory summary from GET /api/admin/inventory...');
    const invReadRes = await fetch(`${BASE_URL}/api/admin/inventory`, {
      headers: { 'Cookie': `revathi_admin_auth=${authCookie}` }
    });
    if (!invReadRes.ok) {
      throw new Error(`Inventory read API returned status ${invReadRes.status}`);
    }
    const invReadJson = await invReadRes.json();
    const invProduct = invReadJson.data.find(p => p.id === orderProductId);
    if (!invProduct) {
      throw new Error('Test product not found in inventory response');
    }
    console.log(`API response stock: ${invProduct.stock}, expected: 30.`);
    if (invProduct.stock !== 30) {
      throw new Error('Inventory read API returned incorrect stock value');
    }
    console.log('✓ Inventory read API verified.');


    // --- Step 3: Orders Verification ---
    console.log('\n--- STEP 3: Orders Validation ---');
    
    // 3.1 Order Creation
    console.log('3.1 Placing customer order for 3 items of test product...');
    const orderPayload = {
      customer_name: 'Postgres Validator User',
      customer_phone: '9876543210',
      customer_email: 'validator@example.com',
      address: '456 DB Integrity Road',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641001',
      transaction_id: 'TXN-99998888',
      payment_img_url: '/uploads/proof.png',
      total_amount: 826.50, // 3 * 275.50 = 826.50
      items: [
        {
          product_id: orderProductId,
          size: '1L',
          quantity: 3,
          price: 275.50
        }
      ]
    };

    const placeOrderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    if (!placeOrderRes.ok) {
      throw new Error(`Order placement failed with status ${placeOrderRes.status}`);
    }
    const placeOrderJson = await placeOrderRes.json();
    createdOrderId = placeOrderJson.data.orderId;
    console.log(`✓ Order placed successfully. Order ID: ${createdOrderId}`);

    // Verify DB states: Reserved stock should increase by 3, physical stock unchanged (remaining 30)
    console.log('Verifying stock reservation in database...');
    const reserveProdRes = await client.query('SELECT stock, reserved FROM products WHERE id = $1', [orderProductId]);
    const reserveProd = reserveProdRes.rows[0];
    console.log(`DB Stock: ${reserveProd.stock} (Expected: 30), Reserved: ${reserveProd.reserved} (Expected: 3)`);
    if (reserveProd.stock !== 30 || reserveProd.reserved !== 3) {
      throw new Error(`Reservation error. Stock: ${reserveProd.stock}, Reserved: ${reserveProd.reserved}`);
    }
    
    // Verify records in "orders" and "order_items" tables
    const dbOrderRes = await client.query('SELECT * FROM orders WHERE id = $1', [createdOrderId]);
    if (dbOrderRes.rowCount === 0) {
      throw new Error('Order not found in PostgreSQL orders table');
    }
    const dbOrderItemsRes = await client.query('SELECT * FROM order_items WHERE order_id = $1', [createdOrderId]);
    if (dbOrderItemsRes.rowCount === 0) {
      throw new Error('No items found in PostgreSQL order_items table for order');
    }
    console.log(`✓ Verified 'orders' and 'order_items' records exist.`);

    // 3.2 Order Retrieval
    console.log('\n3.2 Retrieving order as admin via GET /api/admin/orders...');
    const adminOrdersRes = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { 'Cookie': `revathi_admin_auth=${authCookie}` }
    });
    if (!adminOrdersRes.ok) {
      throw new Error(`Admin orders fetch returned status ${adminOrdersRes.status}`);
    }
    const adminOrdersJson = await adminOrdersRes.json();
    const retrievedOrder = adminOrdersJson.data.find(o => o.id === createdOrderId);
    if (!retrievedOrder) {
      throw new Error('Placed order not found in admin orders retrieval list');
    }
    console.log(`Retrieved customer name: "${retrievedOrder.customer_name}". Items length: ${retrievedOrder.items.length}`);
    if (retrievedOrder.items[0].product_id !== orderProductId || retrievedOrder.items[0].quantity !== 3) {
      throw new Error('Retrieved order items mismatch');
    }
    console.log('✓ Order retrieval API verified.');

    // 3.3 Order Status Update (Mark Shipped)
    console.log('\n3.3 Updating order status to "shipped" via PUT /api/admin/orders...');
    const updateStatusRes = await fetch(`${BASE_URL}/api/admin/orders`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `revathi_admin_auth=${authCookie}`
      },
      body: JSON.stringify({
        id: createdOrderId,
        status: 'shipped'
      })
    });
    if (!updateStatusRes.ok) {
      throw new Error(`Update order status returned status ${updateStatusRes.status}`);
    }

    // Verify DB states: physical stock should be reduced (30 - 3 = 27), reserved released (3 - 3 = 0)
    console.log('Verifying inventory deduction in database...');
    const shippedProdRes = await client.query('SELECT stock, reserved FROM products WHERE id = $1', [orderProductId]);
    const shippedProd = shippedProdRes.rows[0];
    console.log(`DB Stock: ${shippedProd.stock} (Expected: 27), Reserved: ${shippedProd.reserved} (Expected: 0)`);
    if (shippedProd.stock !== 27 || shippedProd.reserved !== 0) {
      throw new Error(`Inventory deduction failed. Stock: ${shippedProd.stock}, Reserved: ${shippedProd.reserved}`);
    }
    
    // Verify inventory audit record was created for the shipment deduction
    const shipAuditRes = await client.query(
      'SELECT * FROM inventory_audit WHERE product_id = $1 AND reason LIKE $2 ORDER BY id DESC LIMIT 1',
      [orderProductId, `%Order #${createdOrderId} shipped%`]
    );
    if (shipAuditRes.rowCount === 0) {
      throw new Error('Shipment deduction was not logged in inventory_audit table');
    }
    console.log('✓ Inventory adjustment audit log verified for shipping.');


    // --- Step 4: Verify Persistence After Restart ---
    console.log('\n--- STEP 4: Restart & Persistence Verification ---');
    console.log('Closing current PostgreSQL connection pool (simulating service restart)...');
    await client.end();
    console.log('PostgreSQL connection terminated.');

    console.log('Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Establishing a NEW connection client (simulating startup recovery)...');
    client = getDbClient();
    await client.connect();
    console.log('✓ Successfully connected to PostgreSQL again.');

    console.log('Verifying data states in the new session...');
    
    // Verify product state
    const postRestartProd = await client.query('SELECT stock, reserved FROM products WHERE id = $1', [orderProductId]);
    if (postRestartProd.rowCount === 0) {
      throw new Error('Product not found in DB after reconnect!');
    }
    const finalProd = postRestartProd.rows[0];
    console.log(`Post-Restart Stock: ${finalProd.stock} (Expected: 27), Reserved: ${finalProd.reserved} (Expected: 0)`);
    if (finalProd.stock !== 27 || finalProd.reserved !== 0) {
      throw new Error(`Data corruption detected post restart! Stock: ${finalProd.stock}`);
    }

    // Verify order state
    const postRestartOrder = await client.query('SELECT status FROM orders WHERE id = $1', [createdOrderId]);
    if (postRestartOrder.rowCount === 0 || postRestartOrder.rows[0].status !== 'shipped') {
      throw new Error(`Order state incorrect post restart! Status: ${postRestartOrder.rows[0]?.status}`);
    }
    console.log(`Post-Restart Order Status: "${postRestartOrder.rows[0].status}" (Expected: "shipped")`);

    console.log('\n✓ Data persistence and system integrity successfully verified!');
    console.log('\n=== ALL POSTGRESQL VALIDATION TESTS PASSED ===');

  } catch (error) {
    console.error('\n✗ VALIDATION FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    // Cleanup temporary test resources
    console.log('\nCleaning up E2E validation test resources...');
    try {
      // Re-establish connection if closed
      if (client && !client._connected) {
        client = getDbClient();
        await client.connect();
      }
      
      // Clear audit log entries, order items, order, and product created for this E2E run
      const testOrdersRes = await client.query(
        "SELECT id FROM orders WHERE customer_name = 'Postgres Validator User'"
      );
      for (const row of testOrdersRes.rows) {
        await client.query('DELETE FROM order_items WHERE order_id = $1', [row.id]);
        await client.query('DELETE FROM orders WHERE id = $1', [row.id]);
      }
      
      if (orderProductId) {
        await client.query('DELETE FROM inventory_audit WHERE product_id = $1', [orderProductId]);
        await client.query('DELETE FROM products WHERE id = $1', [orderProductId]);
      }
      console.log('✓ Cleaned up test orders, order items, audit records, and products.');
    } catch (cleanUpErr) {
      console.error('✗ Failed to clean up database test records:', cleanUpErr);
    }
    
    if (client) {
      await client.end();
      console.log('DB Connection closed.');
    }
  }
}

runTest();
