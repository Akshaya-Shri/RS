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
      FROM supplier_payments p
      JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.created_at DESC
    `);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    const { supplier_id, amount_paid, payment_method, collector_name } = await req.json();

    if (!supplier_id || !amount_paid || !payment_method) {
      return NextResponse.json({ success: false, message: 'Invalid payment data' }, { status: 400 });
    }

    // Begin TRANSACTION
    await client.query('BEGIN');

    // 1. Insert payment record
    const paymentRes = await client.query(
      `INSERT INTO supplier_payments (supplier_id, amount_paid, payment_method, collector_name)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [supplier_id, amount_paid, payment_method, collector_name]
    );
    const payment = paymentRes.rows[0];
    const paymentId = payment.id;

    // 2. Update supplier ledger
    // Get last balance
    const lastLedgerRes = await client.query(
      `SELECT balance_after FROM supplier_ledger 
       WHERE supplier_id = $1 AND deleted_at IS NULL 
       ORDER BY created_at DESC, id DESC LIMIT 1`,
      [supplier_id]
    );
    const prevBalance = lastLedgerRes.rows.length > 0 ? parseFloat(lastLedgerRes.rows[0].balance_after) : 0.0;
    const newBalance = prevBalance - parseFloat(amount_paid);

    // Insert supplier ledger entry
    await client.query(
      `INSERT INTO supplier_ledger (supplier_id, transaction_type, amount, reference_id, balance_after)
       VALUES ($1, 'payment', $2, $3, $4)`,
      [supplier_id, 'payment', amount_paid, paymentId, newBalance]
    );

    // Commit TRANSACTION
    await client.query('COMMIT');

    await logAudit('Record Supplier Payment', 'supplier_payments', paymentId, 'admin');

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Failed to record payment:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to record payment' }, { status: 500 });
  } finally {
    client.release();
  }
}
