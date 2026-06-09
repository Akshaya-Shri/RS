import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ORDERS_FILE = path.join(process.cwd(), 'src/data/orders.json');
const PRODUCTS_FILE = path.join(process.cwd(), 'src/data/products.json');

function readProducts() {
  try {
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeProducts(products: any[]) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
}

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

    // Reserve stock for each item to prevent overselling
    const products = readProducts();
    for (const item of newOrder.items) {
      const prod = products.find((p: any) => p.id === item.product_id);
      if (!prod) {
        return NextResponse.json({ success: false, message: `Product ${item.product_id} not found` }, { status: 400 });
      }

      // Ensure inventory fields exist
      prod.stock = typeof prod.stock === 'number' ? prod.stock : 0;
      prod.reserved = typeof prod.reserved === 'number' ? prod.reserved : 0;
      prod.backorder_allowed = !!prod.backorder_allowed;

      const available = prod.stock - prod.reserved;
      if (item.quantity > available && !prod.backorder_allowed) {
        return NextResponse.json({ success: false, message: `Insufficient stock for ${prod.name || prod.id}` }, { status: 409 });
      }

      // Reserve (if available) or allow backorder (do not reserve)
      if (item.quantity <= available) {
        prod.reserved += item.quantity;
        // update stock_status
        const lowThreshold = typeof prod.low_stock_threshold === 'number' ? prod.low_stock_threshold : 0;
        prod.stock_status = (prod.stock - prod.reserved) <= 0 ? 'out_of_stock' : ((prod.stock - prod.reserved) <= lowThreshold ? 'low' : 'in_stock');
      } else {
        // backorder: increment incoming or leave reserved unchanged
        prod.incoming = (typeof prod.incoming === 'number' ? prod.incoming : 0) + item.quantity;
        prod.stock_status = 'backorder';
      }
    }

    // persist product reservations
    writeProducts(products);

    // persist order after stock reserved
    orders.push(newOrder);
    writeOrders(orders);

    // Send notification (SMS if configured, otherwise WhatsApp)
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