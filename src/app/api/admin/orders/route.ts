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

export async function GET() {
  try {
    const orders = readOrders();

    // Add customer info (simplified for JSON approach)
    const ordersWithCustomerInfo = orders.map((order: any) => ({
      ...order,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone
    }));

    return NextResponse.json({ success: true, data: ordersWithCustomerInfo });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ success: false, message: 'Order ID and status are required' }, { status: 400 });
    }

    const validStatuses = ['pending', 'verified', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
    }

    const orders = readOrders();
    const orderIndex = orders.findIndex((order: any) => order.id === id);

    if (orderIndex === -1) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const order = orders[orderIndex];
    orders[orderIndex].status = status;
    writeOrders(orders);

    // Send WhatsApp notification for status update
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
      // Don't fail the status update if notification fails
    }

    return NextResponse.json({ success: true, message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ success: false, message: 'Failed to update order status' }, { status: 500 });
  }
}