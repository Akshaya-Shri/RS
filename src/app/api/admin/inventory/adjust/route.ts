import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    const payload = await req.json();
    const { product_id, change, type = 'stock', reason = 'manual adjustment', user = 'admin' } = payload;

    if (typeof product_id === 'undefined' || typeof change !== 'number') {
      return NextResponse.json({ success: false, message: 'product_id and numeric change are required' }, { status: 400 });
    }

    await client.query('BEGIN');

    // Fetch product with row-level lock
    const prodRes = await client.query(
      'SELECT id, stock, reserved, incoming, low_stock_threshold, stock_status FROM products WHERE id = $1 FOR UPDATE',
      [product_id]
    );

    if (prodRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    const prod = prodRes.rows[0];
    const old = {
      stock: typeof prod.stock === 'number' ? prod.stock : 0,
      reserved: typeof prod.reserved === 'number' ? prod.reserved : 0,
      incoming: typeof prod.incoming === 'number' ? prod.incoming : 0
    };

    let newStock = old.stock;
    let newReserved = old.reserved;
    let newIncoming = old.incoming;

    if (type === 'reserved') {
      newReserved = Math.max(0, old.reserved + change);
    } else if (type === 'incoming') {
      newIncoming = Math.max(0, old.incoming + change);
    } else {
      // default: adjust stock
      newStock = Math.max(0, old.stock + change);
    }

    // Update status
    const lowThreshold = typeof prod.low_stock_threshold === 'number' ? prod.low_stock_threshold : 0;
    const available = newStock - newReserved;
    const stock_status = available <= 0 ? 'out_of_stock' : (available <= lowThreshold ? 'low' : 'in_stock');
    const stock_updated_at = new Date();

    // Update product table
    const updateRes = await client.query(`
      UPDATE products SET
        stock = $1,
        reserved = $2,
        incoming = $3,
        stock_status = $4,
        stock_updated_at = $5
      WHERE id = $6
      RETURNING *, type AS category
    `, [newStock, newReserved, newIncoming, stock_status, stock_updated_at, product_id]);

    // Insert into inventory_audit
    await client.query(`
      INSERT INTO inventory_audit (
        product_id, type, change, reason, "user", "before", "after", at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      product_id,
      type,
      change,
      reason,
      user,
      JSON.stringify(old),
      JSON.stringify({ stock: newStock, reserved: newReserved, incoming: newIncoming }),
      stock_updated_at
    ]);

    await client.query('COMMIT');
    return NextResponse.json({ success: true, data: updateRes.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Inventory adjust error:', error);
    return NextResponse.json({ success: false, message: 'Failed to adjust inventory' }, { status: 500 });
  } finally {
    client.release();
  }
}
