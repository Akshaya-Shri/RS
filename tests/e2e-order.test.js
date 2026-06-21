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

async function runTest() {
  console.log('--- STARTING END-TO-END ORDER TESTING ---');
  
  // Connect to the DB
  const client = new Client({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT
  });
  
  try {
    await client.connect();
    console.log('✓ Connected to PostgreSQL database.');
  } catch (err) {
    console.error('✗ Failed to connect to database:', err);
    process.exit(1);
  }

  const productId = 1; // Cold Pressed Groundnut Oil
  let originalStock = 0;
  let originalReserved = 0;
  let createdOrderId = null;

  try {
    // 0. Log in as admin to get authentication cookie for admin endpoints
    console.log('\nStep 0: Logging in as Admin...');
    const loginRes0 = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: env.ADMIN_USER || 'admin',
        password: env.ADMIN_PASS || 'admin123'
      })
    });
    if (!loginRes0.ok) {
      throw new Error(`Admin login returned status ${loginRes0.status}`);
    }
    const loginJson0 = await loginRes0.json();
    if (!loginJson0.success) {
      throw new Error(`Admin login failed`);
    }
    const setCookieHeader0 = loginRes0.headers.get('set-cookie');
    let authCookie = '';
    if (setCookieHeader0) {
      const match = setCookieHeader0.match(/revathi_admin_auth=([^;]+)/);
      if (match) {
        authCookie = match[1];
      }
    }
    if (!authCookie) {
      throw new Error('Failed to retrieve authentication cookie from login response');
    }
    console.log('✓ Admin authenticated successfully.');

    // 2. Fetch original inventory levels
    console.log(`\nStep 1: Fetching initial inventory levels for product ID: ${productId}`);
    const initialRes = await client.query('SELECT name, stock, reserved, incoming FROM products WHERE id = $1', [productId]);
    if (initialRes.rowCount === 0) {
      throw new Error(`Product with ID ${productId} not found in DB`);
    }
    const product = initialRes.rows[0];
    originalStock = product.stock;
    originalReserved = product.reserved;
    console.log(`Product Name: "${product.name}"`);
    console.log(`Initial Stock: ${originalStock}, Reserved: ${originalReserved}`);

    // 3. Upload dummy payment proof
    console.log('\nStep 2: Uploading payment proof...');
    const uploadRes = await fetch(`${BASE_URL}/api/admin/upload`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': `revathi_admin_auth=${authCookie}`
      },
      body: JSON.stringify({
        filename: 'e2e-payment-proof.png',
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      })
    });
    
    if (!uploadRes.ok) {
      throw new Error(`Upload API returned status ${uploadRes.status}`);
    }
    const uploadJson = await uploadRes.json();
    if (!uploadJson.success) {
      throw new Error(`Upload failed: ${uploadJson.message}`);
    }
    const paymentImgUrl = uploadJson.url;
    console.log(`✓ Payment proof uploaded. URL: ${paymentImgUrl}`);

    // 4. Place order (Product purchase & Order creation)
    console.log('\nStep 3: Creating customer order (purchase)...');
    const orderQty = 2;
    const orderData = {
      customer_name: 'E2E Testing User',
      customer_phone: '9999999999',
      customer_email: 'e2e-test@example.com',
      address: '123 E2E Test Lane',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      transaction_id: '888877776666',
      payment_img_url: paymentImgUrl,
      total_amount: 440,
      items: [
        {
          product_id: productId,
          size: '1L',
          quantity: orderQty,
          price: 220
        }
      ]
    };

    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    if (!orderRes.ok) {
      throw new Error(`Order placement API returned status ${orderRes.status}`);
    }
    const orderJson = await orderRes.json();
    if (!orderJson.success) {
      throw new Error(`Order creation failed: ${orderJson.message}`);
    }
    createdOrderId = orderJson.data.orderId;
    console.log(`✓ Order created successfully. Order ID: ${createdOrderId}`);

    // 5. Verify database state: reserved should increase, stock should remain unchanged
    console.log('\nStep 4: Verifying reservation inventory levels in DB...');
    const reservationRes = await client.query('SELECT stock, reserved FROM products WHERE id = $1', [productId]);
    const reservationProd = reservationRes.rows[0];
    console.log(`Post-Order Stock: ${reservationProd.stock} (Expected: ${originalStock})`);
    console.log(`Post-Order Reserved: ${reservationProd.reserved} (Expected: ${originalReserved + orderQty})`);

    if (reservationProd.stock !== originalStock) {
      throw new Error(`Stock should not decrease at order creation. Expected ${originalStock}, got ${reservationProd.stock}`);
    }
    if (reservationProd.reserved !== originalReserved + orderQty) {
      throw new Error(`Reserved stock did not increase correctly. Expected ${originalReserved + orderQty}, got ${reservationProd.reserved}`);
    }
    console.log('✓ Reservation verified in database.');

    // 6. Log in as admin
    console.log('\nStep 5: Logging in as Admin...');
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
      throw new Error(`Admin login failed`);
    }
    const setCookieHeader = loginRes.headers.get('set-cookie');
    if (setCookieHeader) {
      const match = setCookieHeader.match(/revathi_admin_auth=([^;]+)/);
      if (match) {
        authCookie = match[1];
      }
    }
    if (!authCookie) {
      throw new Error('Failed to retrieve authentication cookie from login response');
    }
    console.log('✓ Admin authenticated successfully.');

    // 7. Verify admin order visibility
    console.log('\nStep 6: Verifying order visibility in Admin order dashboard...');
    const adminOrdersRes = await fetch(`${BASE_URL}/api/admin/orders`, {
      method: 'GET',
      headers: {
        'Cookie': `revathi_admin_auth=${authCookie}`
      }
    });
    if (!adminOrdersRes.ok) {
      throw new Error(`Admin orders fetch returned status ${adminOrdersRes.status}`);
    }
    const adminOrdersJson = await adminOrdersRes.json();
    if (!adminOrdersJson.success) {
      throw new Error(`Admin orders fetch failed: ${adminOrdersJson.message}`);
    }
    const foundOrder = adminOrdersJson.data.find(o => o.id === createdOrderId);
    if (!foundOrder) {
      throw new Error(`Created order ID ${createdOrderId} was not visible in admin orders list`);
    }
    console.log(`✓ Order ID ${createdOrderId} verified as visible to Admin.`);

    // 8. Update status to 'shipped' (Finalize inventory reduction)
    console.log('\nStep 7: Admin marking order as Shipped (Fulfillment)...');
    const updateRes = await fetch(`${BASE_URL}/api/admin/orders`, {
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
    if (!updateRes.ok) {
      throw new Error(`Admin order update returned status ${updateRes.status}`);
    }
    const updateJson = await updateRes.json();
    if (!updateJson.success) {
      throw new Error(`Admin order status update failed: ${updateJson.message}`);
    }
    console.log('✓ Order status updated to "shipped"');

    // 9. Verify database state: physical stock should be reduced, reserved should return to original/released state
    console.log('\nStep 8: Verifying stock reduction in DB...');
    const shippedRes = await client.query('SELECT stock, reserved FROM products WHERE id = $1', [productId]);
    const shippedProd = shippedRes.rows[0];
    console.log(`Post-Shipment Stock: ${shippedProd.stock} (Expected: ${originalStock - orderQty})`);
    console.log(`Post-Shipment Reserved: ${shippedProd.reserved} (Expected: ${originalReserved})`);

    if (shippedProd.stock !== originalStock - orderQty) {
      throw new Error(`Physical stock did not decrease correctly. Expected ${originalStock - orderQty}, got ${shippedProd.stock}`);
    }
    if (shippedProd.reserved !== originalReserved) {
      throw new Error(`Reserved stock was not released correctly. Expected ${originalReserved}, got ${shippedProd.reserved}`);
    }
    console.log('✓ Inventory reduction verified in database.');
    console.log('\n--- ALL E2E TESTS PASSED ---');

  } catch (error) {
    console.error('\n✗ TEST RUN FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    // 10. Clean up DB records
    console.log('\nCleaning up database records...');
    try {
      // Revert product stock and reserved
      await client.query('UPDATE products SET stock = $1, reserved = $2 WHERE id = $3', [originalStock, originalReserved, productId]);
      console.log('✓ Restored product inventory levels.');
      
      // Delete order details
      if (createdOrderId) {
        await client.query('DELETE FROM order_items WHERE order_id = $1', [createdOrderId]);
        await client.query('DELETE FROM orders WHERE id = $1', [createdOrderId]);
        console.log(`✓ Deleted test order ID: ${createdOrderId}`);
      }
    } catch (cleanUpErr) {
      console.error('✗ Failed to clean up database records:', cleanUpErr);
    }
    
    await client.end();
    console.log('DB Connection closed.');
  }
}

runTest();
