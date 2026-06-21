import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    const {
      customer_name,
      customer_phone,
      customer_email,
      address,
      city,
      state,
      pincode,
      transaction_id,
      payment_img_url,
      items,
      total_amount
    } = await req.json();

    // Validate required fields
    if (!customer_name || !customer_phone || !transaction_id || !items || !total_amount) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Process items and update stock levels in DB
    const processedItems: any[] = [];
    for (const item of items) {
      // Lock product row for safe inventory checking/updating
      const prodRes = await client.query(
        'SELECT id, name, stock, reserved, incoming, backorder_allowed, low_stock_threshold, stock_status FROM products WHERE id = $1 FOR UPDATE',
        [item.product_id]
      );

      if (prodRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ success: false, message: `Product ${item.product_id} not found` }, { status: 400 });
      }

      const prod = prodRes.rows[0];
      const stock = typeof prod.stock === 'number' ? prod.stock : 0;
      const reserved = typeof prod.reserved === 'number' ? prod.reserved : 0;
      const incoming = typeof prod.incoming === 'number' ? prod.incoming : 0;
      const backorder_allowed = !!prod.backorder_allowed;

      const available = stock - reserved;
      if (item.quantity > available && !backorder_allowed) {
        await client.query('ROLLBACK');
        return NextResponse.json({ success: false, message: `Insufficient stock for ${prod.name || prod.id}` }, { status: 409 });
      }

      let newReserved = reserved;
      let newIncoming = incoming;
      let stock_status = prod.stock_status;

      if (item.quantity <= available) {
        newReserved += item.quantity;
        // update stock_status
        const lowThreshold = typeof prod.low_stock_threshold === 'number' ? prod.low_stock_threshold : 0;
        const availableAfter = stock - newReserved;
        stock_status = availableAfter <= 0 ? 'out_of_stock' : (availableAfter <= lowThreshold ? 'low' : 'in_stock');
      } else {
        // backorder: increment incoming
        newIncoming += item.quantity;
        stock_status = 'backorder';
      }

      // Update product inventory in DB
      await client.query(`
        UPDATE products SET
          reserved = $1,
          incoming = $2,
          stock_status = $3,
          stock_updated_at = NOW()
        WHERE id = $4
      `, [newReserved, newIncoming, stock_status, item.product_id]);

      processedItems.push({
        product_id: item.product_id,
        size: item.size,
        quantity: item.quantity,
        price: item.price
      });
    }

    // 2. Insert order record
    const orderRes = await client.query(`
      INSERT INTO orders (
        total_amount, status, payment_img_url, transaction_id, created_at,
        customer_name, customer_phone, customer_email, address, city, state, pincode
      ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [
      total_amount,
      'pending',
      payment_img_url || null,
      transaction_id,
      customer_name,
      customer_phone,
      customer_email || null,
      address,
      city,
      state,
      pincode
    ]);

    const orderId = orderRes.rows[0].id;

    // 3. Insert order items
    for (const item of processedItems) {
      await client.query(`
        INSERT INTO order_items (
          order_id, product_id, size, quantity, price
        ) VALUES ($1, $2, $3, $4, $5)
      `, [orderId, item.product_id, item.size, item.quantity, item.price]);
    }

    await client.query('COMMIT');

    // 4. Send notifications outside of transaction context
    const notifyPath = process.env.SMS_PROVIDER ? '/api/notify/sms' : '/api/notify/whatsapp';
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${notifyPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: customer_phone,
          messageType: 'order_placed',
          orderData: {
            orderId,
            totalAmount: total_amount,
            items: items
          }
        })
      }).catch(err => console.error('Notification failed:', err));
    } catch (notifyError) {
      console.error('Failed to send notification:', notifyError);
    }

    return NextResponse.json({
      success: true,
      data: { orderId, message: 'Order placed successfully' }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Order creation error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create order' }, { status: 500 });
  } finally {
    client.release();
  }
}