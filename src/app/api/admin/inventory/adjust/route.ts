import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PRODUCTS_FILE = path.join(process.cwd(), 'src/data/products.json');
const AUDIT_FILE = path.join(process.cwd(), 'src/data/inventory_audit.json');

function readProducts() {
  try {
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function writeProducts(products: any[]) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
}

function readAudit() {
  try {
    const data = fs.readFileSync(AUDIT_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function writeAudit(audit: any[]) {
  fs.writeFileSync(AUDIT_FILE, JSON.stringify(audit, null, 2), 'utf8');
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { product_id, change, type = 'stock', reason = 'manual adjustment', user = 'admin' } = payload;

    if (typeof product_id === 'undefined' || typeof change !== 'number') {
      return NextResponse.json({ success: false, message: 'product_id and numeric change are required' }, { status: 400 });
    }

    const products = readProducts();
    const prod = products.find((p: any) => p.id === product_id);
    if (!prod) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });

    // ensure numeric fields exist
    prod.stock = typeof prod.stock === 'number' ? prod.stock : 0;
    prod.reserved = typeof prod.reserved === 'number' ? prod.reserved : 0;
    prod.incoming = typeof prod.incoming === 'number' ? prod.incoming : 0;

    const old = { stock: prod.stock, reserved: prod.reserved, incoming: prod.incoming };

    if (type === 'reserved') {
      prod.reserved = Math.max(0, prod.reserved + change);
    } else if (type === 'incoming') {
      prod.incoming = Math.max(0, prod.incoming + change);
    } else {
      // default: adjust stock
      prod.stock = Math.max(0, prod.stock + change);
    }

    // update status
    const lowThreshold = typeof prod.low_stock_threshold === 'number' ? prod.low_stock_threshold : 0;
    const available = prod.stock - prod.reserved;
    prod.stock_status = available <= 0 ? 'out_of_stock' : (available <= lowThreshold ? 'low' : 'in_stock');
    prod.stock_updated_at = new Date().toISOString();

    writeProducts(products);

    // audit
    const audit = readAudit();
    const id = audit.length ? Math.max(...audit.map((a: any) => a.id || 0)) + 1 : 1;
    audit.push({
      id,
      product_id: prod.id,
      type,
      change,
      reason,
      user,
      before: old,
      after: { stock: prod.stock, reserved: prod.reserved, incoming: prod.incoming },
      at: new Date().toISOString()
    });
    writeAudit(audit);

    return NextResponse.json({ success: true, data: prod });
  } catch (error) {
    console.error('Inventory adjust error:', error);
    return NextResponse.json({ success: false, message: 'Failed to adjust inventory' }, { status: 500 });
  }
}
