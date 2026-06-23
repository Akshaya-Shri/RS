import { NextResponse } from 'next/server';
import pool from '@/lib/db';

async function logAudit(action: string, entityType: string, entityId: number, performedBy: string) {
  try {
    await pool.query(
      'INSERT INTO audit_logs (action, entity_type, entity_id, performed_by) VALUES ($1, $2, $3, $4)',
      [action, entityType, entityId, performedBy]
    );
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT p.*, s.company_name as supplier_name 
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.deleted_at IS NULL
      ORDER BY p.purchase_date DESC
    `);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Failed to fetch purchases:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch purchases' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    const { supplier_id, purchase_date, total_amount, items } = await req.json();

    if (!supplier_id || !total_amount || !items || !items.length) {
      return NextResponse.json({ success: false, message: 'Invalid purchase data' }, { status: 400 });
    }

    // Begin TRANSACTION
    await client.query('BEGIN');

    // 1. Insert purchase record
    const purchaseRes = await client.query(
      `INSERT INTO purchases (supplier_id, purchase_date, total_amount)
       VALUES ($1, $2, $3) RETURNING *`,
      [supplier_id, purchase_date || new Date(), total_amount]
    );
    const purchase = purchaseRes.rows[0];
    const purchaseId = purchase.id;

    // 2. Insert items and update stock
    for (const item of items) {
      const { product_id, quantity, purchase_rate } = item;

      if (!product_id || !quantity || !purchase_rate) {
        throw new Error('Invalid purchase item details');
      }

      // Insert purchase item
      await client.query(
        `INSERT INTO purchase_items (purchase_id, product_id, quantity, purchase_rate)
         VALUES ($1, $2, $3, $4)`,
        [purchaseId, product_id, quantity, purchase_rate]
      );

      // Update product stock, cost price, and stock_status
      await client.query(
        `UPDATE products 
         SET stock = stock + $1,
             cost_price = $2,
             last_cost = $2,
             stock_status = CASE 
                 WHEN (stock + $1) - reserved <= 0 THEN 'out_of_stock'
                 WHEN (stock + $1) - reserved <= low_stock_threshold THEN 'low'
                 ELSE 'in_stock'
             END,
             stock_updated_at = now()
         WHERE id = $3`,
        [quantity, purchase_rate, product_id]
      );

      // Create stock ledger entry
      await client.query(
        `INSERT INTO stock_ledger (product_id, transaction_type, quantity, reference_type, reference_id)
         VALUES ($1, 'purchase', $2, 'purchase', $3)`,
        [product_id, quantity, purchaseId]
      );
    }

    // 3. Update supplier ledger
    // Get last balance
    const lastLedgerRes = await client.query(
      `SELECT balance_after FROM supplier_ledger 
       WHERE supplier_id = $1 AND deleted_at IS NULL 
       ORDER BY created_at DESC, id DESC LIMIT 1`,
      [supplier_id]
    );
    const prevBalance = lastLedgerRes.rows.length > 0 ? parseFloat(lastLedgerRes.rows[0].balance_after) : 0.0;
    const newBalance = prevBalance + parseFloat(total_amount);

    // Insert supplier ledger entry
    await client.query(
      `INSERT INTO supplier_ledger (supplier_id, transaction_type, amount, reference_id, balance_after)
       VALUES ($1, 'purchase', $2, $3, $4)`,
      [supplier_id, 'purchase', total_amount, purchaseId, newBalance]
    );

    // Commit TRANSACTION
    await client.query('COMMIT');

    await logAudit('Log Purchase', 'purchases', purchaseId, 'admin');

    return NextResponse.json({ success: true, data: purchase }, { status: 201 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Failed to save purchase:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to save purchase' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(req: Request) {
  const client = await pool.connect();
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, message: 'Purchase ID is required' }, { status: 400 });
    }

    await client.query('BEGIN');

    // Fetch purchase and its items
    const purchaseRes = await client.query('SELECT * FROM purchases WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (purchaseRes.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Purchase not found' }, { status: 404 });
    }
    const purchase = purchaseRes.rows[0];

    const itemsRes = await client.query('SELECT * FROM purchase_items WHERE purchase_id = $1', [id]);
    const items = itemsRes.rows;

    // 1. Soft delete the purchase
    await client.query('UPDATE purchases SET deleted_at = now() WHERE id = $1', [id]);

    // 2. Revert stock changes for each item
    for (const item of items) {
      // Revert stock (subtract quantity)
      await client.query(
        `UPDATE products 
         SET stock = GREATEST(0, stock - $1),
             stock_status = CASE 
                 WHEN GREATEST(0, stock - $1) - reserved <= 0 THEN 'out_of_stock'
                 WHEN GREATEST(0, stock - $1) - reserved <= low_stock_threshold THEN 'low'
                 ELSE 'in_stock'
             END,
             stock_updated_at = now()
         WHERE id = $2`,
        [item.quantity, item.product_id]
      );

      // Create negative stock ledger entry representing deletion
      await client.query(
        `INSERT INTO stock_ledger (product_id, transaction_type, quantity, reference_type, reference_id)
         VALUES ($1, 'purchase_cancel', $2, 'purchase', $3)`,
        [item.product_id, -item.quantity, id]
      );
    }

    // 3. Update supplier ledger (revert balance)
    const lastLedgerRes = await client.query(
      `SELECT balance_after FROM supplier_ledger 
       WHERE supplier_id = $1 AND deleted_at IS NULL 
       ORDER BY created_at DESC, id DESC LIMIT 1`,
      [purchase.supplier_id]
    );
    const prevBalance = lastLedgerRes.rows.length > 0 ? parseFloat(lastLedgerRes.rows[0].balance_after) : 0.0;
    const newBalance = prevBalance - parseFloat(purchase.total_amount);

    await client.query(
      `INSERT INTO supplier_ledger (supplier_id, transaction_type, amount, reference_id, balance_after)
       VALUES ($1, 'purchase_cancel', $2, $3, $4)`,
      [purchase.supplier_id, 'purchase_cancel', -purchase.total_amount, id, newBalance]
    );

    // Soft delete any ledger entries pointing to this purchase
    await client.query('UPDATE supplier_ledger SET deleted_at = now() WHERE reference_id = $1 AND transaction_type = \'purchase\'', [id]);

    await client.query('COMMIT');

    await logAudit('Cancel Purchase', 'purchases', id, 'admin');

    return NextResponse.json({ success: true, message: 'Purchase cancelled and inventory reverted successfully' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Failed to cancel purchase:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to cancel purchase' }, { status: 500 });
  } finally {
    client.release();
  }
}
