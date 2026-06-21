import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyDbSession } from '@/lib/auth-db';

export async function GET() {
  try {
    const session = await verifyDbSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 401 });

    const ordersRes = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    const orders = ordersRes.rows;

    if (orders.length > 0) {
      const itemsRes = await pool.query('SELECT * FROM order_items');
      const itemsGrouped = itemsRes.rows.reduce((acc: any, item: any) => {
        if (!acc[item.order_id]) acc[item.order_id] = [];
        acc[item.order_id].push(item);
        return acc;
      }, {});

      orders.forEach((order: any) => {
        order.items = itemsGrouped[order.id] || [];
      });
    }

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await verifyDbSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 401 });

    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ success: false, message: 'Order ID and status are required' }, { status: 400 });
    }

    const validStatuses = ['pending', 'verified', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch order details
      const orderRes = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [id]);
      if (orderRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
      }

      const order = orderRes.rows[0];
      const prevStatus = order.status;

      // Update order status
      await client.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);

      // If moving to shipped from a non-shipped state, finalize inventory
      if (status === 'shipped' && prevStatus !== 'shipped') {
        // Fetch order items
        const itemsRes = await client.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
        const items = itemsRes.rows;

        for (const item of items) {
          const prodRes = await client.query(
            'SELECT id, stock, reserved, incoming, low_stock_threshold FROM products WHERE id = $1 FOR UPDATE',
            [item.product_id]
          );
          if (prodRes.rowCount === 0) continue;

          const prod = prodRes.rows[0];
          const stock = typeof prod.stock === 'number' ? prod.stock : 0;
          const reserved = typeof prod.reserved === 'number' ? prod.reserved : 0;
          const qty = item.quantity || 0;

          // Deduct quantity from total stock, and deduct the corresponding reserved portion
          const reservedDeduct = Math.min(reserved, qty);
          const newReserved = Math.max(0, reserved - reservedDeduct);
          const newStock = Math.max(0, stock - qty);

          // Update stock status
          const lowThreshold = typeof prod.low_stock_threshold === 'number' ? prod.low_stock_threshold : 0;
          const availableAfter = newStock - newReserved;
          const stock_status = availableAfter <= 0 ? 'out_of_stock' : (availableAfter <= lowThreshold ? 'low' : 'in_stock');

          // Update product inventory in DB
          await client.query(`
            UPDATE products SET
              stock = $1,
              reserved = $2,
              stock_status = $3,
              stock_updated_at = NOW()
            WHERE id = $4
          `, [newStock, newReserved, stock_status, prod.id]);

          // Log adjustment in inventory_audit
          await client.query(`
            INSERT INTO inventory_audit (
              product_id, type, change, reason, "user", "before", "after", at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          `, [
            prod.id,
            'stock',
            -qty,
            `Order #${id} shipped`,
            'system',
            JSON.stringify({ stock, reserved, incoming: prod.incoming || 0 }),
            JSON.stringify({ stock: newStock, reserved: newReserved, incoming: prod.incoming || 0 })
          ]);
        }
      }

      await client.query('COMMIT');

      // Send WhatsApp notification for status update outside transaction
      const statusDisplay: Record<string, string> = {
        pending: 'Payment Pending',
        verified: 'Payment Verified ✓',
        shipped: 'Shipped 📦',
        delivered: 'Delivered 🎉',
        cancelled: 'Cancelled'
      };

      try {
        const notifyPath = process.env.SMS_PROVIDER ? '/api/notify/sms' : '/api/notify/whatsapp';
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${notifyPath}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: order.customer_phone,
            messageType: 'status_update',
            orderData: {
              orderId: order.id,
              status: status,
              statusDisplay: statusDisplay[status] || status
            }
          })
        }).catch(err => console.error('Notification failed:', err));
      } catch (notifyError) {
        console.error('Failed to send notification:', notifyError);
      }

      return NextResponse.json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ success: false, message: 'Failed to update order status' }, { status: 500 });
  }
}