import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ORDERS_FILE = path.join(process.cwd(), 'src/data/orders.json');

// Helper function to read orders
function readOrders() {
  try {
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

// Helper function to write orders
function writeOrders(orders: any[]) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
}

export async function POST(req: Request) {
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

    const orders = readOrders();

    // Generate new order ID
    const maxId = orders.reduce((max: number, order: any) => Math.max(max, order.id || 0), 0);
    const orderId = maxId + 1;

    // Create order object
    const newOrder = {
      id: orderId,
      customer_name,
      customer_phone,
      customer_email: customer_email || null,
      address,
      city,
      state,
      pincode,
      transaction_id,
      payment_img_url,
      total_amount,
      status: 'pending',
      created_at: new Date().toISOString(),
      items: items.map((item: any, index: number) => ({
        id: index + 1,
        product_id: item.product_id,
        size: item.size,
        quantity: item.quantity,
        price: item.price
      }))
    };

    orders.push(newOrder);
    writeOrders(orders);

    // Send WhatsApp notification
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notify/whatsapp`, {
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
      }).catch(err => console.error('WhatsApp notification failed:', err));
    } catch (notifyError) {
      console.error('Failed to send WhatsApp notification:', notifyError);
      // Don't fail the order creation if notification fails
    }

    return NextResponse.json({
      success: true,
      data: { orderId, message: 'Order placed successfully' }
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create order' }, { status: 500 });
  }
}