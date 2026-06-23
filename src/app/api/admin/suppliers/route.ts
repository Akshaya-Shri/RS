import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// helper to log audit entries
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
    const id = searchParams.get('id');

    if (id) {
      // Fetch detailed history for a single supplier: purchases, payments, ledger entries
      const supplierRes = await pool.query(`
        SELECT s.*,
          (SELECT COALESCE(SUM(total_amount), 0) FROM purchases WHERE supplier_id = s.id AND deleted_at IS NULL) as total_purchases,
          (SELECT COALESCE(SUM(amount_paid), 0) FROM supplier_payments WHERE supplier_id = s.id) as total_payments
        FROM suppliers s
        WHERE s.id = $1 AND s.deleted_at IS NULL
      `, [id]);

      if (supplierRes.rows.length === 0) {
        return NextResponse.json({ success: false, message: 'Supplier not found' }, { status: 404 });
      }

      const supplier = supplierRes.rows[0];
      supplier.outstanding_balance = parseFloat(supplier.total_purchases) - parseFloat(supplier.total_payments);

      // Fetch purchase history
      const purchasesRes = await pool.query(
        'SELECT * FROM purchases WHERE supplier_id = $1 AND deleted_at IS NULL ORDER BY purchase_date DESC',
        [id]
      );

      // Fetch payment history
      const paymentsRes = await pool.query(
        'SELECT * FROM supplier_payments WHERE supplier_id = $1 ORDER BY created_at DESC',
        [id]
      );

      // Fetch ledger history
      const ledgerRes = await pool.query(
        'SELECT * FROM supplier_ledger WHERE supplier_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
        [id]
      );

      return NextResponse.json({
        success: true,
        data: {
          supplier,
          purchases: purchasesRes.rows,
          payments: paymentsRes.rows,
          ledger: ledgerRes.rows
        }
      });
    }

    // Fetch all active suppliers with aggregated outstanding balances
    const result = await pool.query(`
      SELECT s.*, 
        COALESCE(p.total, 0)::NUMERIC as total_purchases,
        COALESCE(pm.total, 0)::NUMERIC as total_payments,
        (COALESCE(p.total, 0) - COALESCE(pm.total, 0))::NUMERIC as outstanding_balance
      FROM suppliers s
      LEFT JOIN (
        SELECT supplier_id, SUM(total_amount) as total 
        FROM purchases 
        WHERE deleted_at IS NULL 
        GROUP BY supplier_id
      ) p ON s.id = p.supplier_id
      LEFT JOIN (
        SELECT supplier_id, SUM(amount_paid) as total 
        FROM supplier_payments 
        GROUP BY supplier_id
      ) pm ON s.id = pm.supplier_id
      WHERE s.deleted_at IS NULL
      ORDER BY s.company_name ASC
    `);

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Failed to fetch suppliers:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { company_name, agency_name, address, phone } = await req.json();

    if (!company_name) {
      return NextResponse.json({ success: false, message: 'Company name is required' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO suppliers (company_name, agency_name, address, phone)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [company_name, agency_name, address, phone]
    );

    const newSupplier = result.rows[0];
    await logAudit('Create Supplier', 'suppliers', newSupplier.id, 'admin');

    return NextResponse.json({ success: true, data: newSupplier }, { status: 201 });
  } catch (error) {
    console.error('Failed to create supplier:', error);
    return NextResponse.json({ success: false, message: 'Failed to create supplier' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, company_name, agency_name, address, phone } = await req.json();

    if (!id || !company_name) {
      return NextResponse.json({ success: false, message: 'ID and Company name are required' }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE suppliers 
       SET company_name = $1, agency_name = $2, address = $3, phone = $4
       WHERE id = $5 AND deleted_at IS NULL RETURNING *`,
      [company_name, agency_name, address, phone, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Supplier not found' }, { status: 404 });
    }

    const updatedSupplier = result.rows[0];
    await logAudit('Update Supplier', 'suppliers', updatedSupplier.id, 'admin');

    return NextResponse.json({ success: true, data: updatedSupplier });
  } catch (error) {
    console.error('Failed to update supplier:', error);
    return NextResponse.json({ success: false, message: 'Failed to update supplier' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    // Soft delete only
    const result = await pool.query(
      `UPDATE suppliers SET deleted_at = now() WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Supplier not found' }, { status: 404 });
    }

    await logAudit('Soft Delete Supplier', 'suppliers', id, 'admin');

    return NextResponse.json({ success: true, message: 'Supplier soft deleted successfully' });
  } catch (error) {
    console.error('Failed to delete supplier:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete supplier' }, { status: 500 });
  }
}
