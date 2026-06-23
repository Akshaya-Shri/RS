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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');

    if (customerId) {
      // Fetch full history of transactions for a specific customer
      const res = await pool.query(
        'SELECT * FROM tin_transactions WHERE customer_id = $1 ORDER BY created_at DESC',
        [customerId]
      );
      return NextResponse.json({ success: true, data: res.rows });
    }

    // 1. Fetch customer-wise pending tins
    const customerTinsRes = await pool.query(`
      SELECT c.id as customer_id, c.name as customer_name, c.mobile as customer_mobile,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'issue' THEN t.quantity ELSE 0 END), 0)::INTEGER as issued,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'return' THEN t.quantity ELSE 0 END), 0)::INTEGER as returned,
        (
          COALESCE(SUM(CASE WHEN t.transaction_type = 'issue' THEN t.quantity ELSE 0 END), 0) - 
          COALESCE(SUM(CASE WHEN t.transaction_type = 'return' THEN t.quantity ELSE 0 END), 0)
        )::INTEGER as balance
      FROM customers c
      JOIN tin_transactions t ON c.id = t.customer_id
      GROUP BY c.id, c.name, c.mobile
      ORDER BY balance DESC
    `);

    // 2. Fetch total pending tins
    const totalPendingRes = await pool.query(`
      SELECT COALESCE(SUM(CASE WHEN transaction_type = 'issue' THEN quantity ELSE -quantity END), 0)::INTEGER as total_pending 
      FROM tin_transactions
    `);

    // 3. Fetch recent transaction log
    const recentTxRes = await pool.query(`
      SELECT t.*, c.name as customer_name, c.mobile as customer_mobile
      FROM tin_transactions t
      JOIN customers c ON t.customer_id = c.id
      ORDER BY t.created_at DESC
      LIMIT 20
    `);

    return NextResponse.json({
      success: true,
      data: {
        customerBalances: customerTinsRes.rows,
        totalPending: totalPendingRes.rows[0]?.total_pending || 0,
        recentTransactions: recentTxRes.rows
      }
    });
  } catch (error) {
    console.error('Failed to fetch tin transactions:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch tin transactions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    const { customer_id, transaction_type, quantity } = await req.json();

    if (!customer_id || !transaction_type || !quantity || quantity <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid transaction details' }, { status: 400 });
    }

    if (transaction_type !== 'issue' && transaction_type !== 'return') {
      return NextResponse.json({ success: false, message: 'Invalid transaction type' }, { status: 400 });
    }

    await client.query('BEGIN');

    // Get current tin balance for this customer
    const balanceRes = await client.query(`
      SELECT COALESCE(SUM(CASE WHEN transaction_type = 'issue' THEN quantity ELSE -quantity END), 0)::INTEGER as balance
      FROM tin_transactions
      WHERE customer_id = $1
    `, [customer_id]);
    
    const currentBalance = balanceRes.rows.length > 0 ? balanceRes.rows[0].balance : 0;

    // Validation: returned quantity cannot exceed issued balance
    if (transaction_type === 'return' && quantity > currentBalance) {
      throw new Error(`Returned quantity (${quantity}) exceeds current pending balance (${currentBalance})`);
    }

    const balanceAfter = currentBalance + (transaction_type === 'issue' ? quantity : -quantity);

    // Insert tin transaction
    const insertRes = await client.query(
      `INSERT INTO tin_transactions (customer_id, transaction_type, quantity, balance_after)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [customer_id, transaction_type, quantity, balanceAfter]
    );

    const transaction = insertRes.rows[0];

    await client.query('COMMIT');

    await logAudit(
      `${transaction_type === 'issue' ? 'Issued Full' : 'Returned Empty'} Tin`,
      'tin_transactions',
      transaction.id,
      'admin'
    );

    return NextResponse.json({ success: true, data: transaction }, { status: 201 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Failed to log tin transaction:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to log tin transaction' }, { status: 500 });
  } finally {
    client.release();
  }
}
