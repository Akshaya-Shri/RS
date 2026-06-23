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
    const id = searchParams.get('id');
    const query = searchParams.get('query');

    if (id) {
      // Get detailed single customer profile with sales history
      const custRes = await pool.query(`
        SELECT c.*,
          (SELECT COUNT(*) FROM sales WHERE customer_id = c.id AND deleted_at IS NULL) as total_orders,
          (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE customer_id = c.id AND deleted_at IS NULL) as total_spent
        FROM customers c
        WHERE c.id = $1
      `, [id]);

      if (custRes.rows.length === 0) {
        return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
      }

      // Fetch purchase history (sales)
      const salesRes = await pool.query(
        'SELECT * FROM sales WHERE customer_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
        [id]
      );

      // Fetch tin history
      const tinsRes = await pool.query(
        'SELECT * FROM tin_transactions WHERE customer_id = $1 ORDER BY created_at DESC',
        [id]
      );

      return NextResponse.json({
        success: true,
        data: {
          customer: custRes.rows[0],
          sales: salesRes.rows,
          tins: tinsRes.rows
        }
      });
    }

    let sql = `
      SELECT c.*,
        COALESCE(s.sales_count, 0)::INTEGER as total_orders,
        COALESCE(s.total_spent, 0)::NUMERIC as total_spent,
        s.last_purchase_date
      FROM customers c
      LEFT JOIN (
        SELECT customer_id, 
          COUNT(id) as sales_count, 
          SUM(total_amount) as total_spent,
          MAX(created_at) as last_purchase_date
        FROM sales
        WHERE deleted_at IS NULL
        GROUP BY customer_id
      ) s ON c.id = s.customer_id
    `;
    const params: any[] = [];

    if (query) {
      sql += ` WHERE c.name ILIKE $1 OR c.mobile ILIKE $1 `;
      params.push(`%${query}%`);
    }

    sql += ` ORDER BY c.name ASC `;

    const result = await pool.query(sql, params);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, mobile, address, gst_number } = await req.json();

    if (!name || !mobile) {
      return NextResponse.json({ success: false, message: 'Name and mobile are required' }, { status: 400 });
    }

    // Check if customer already exists by mobile
    const checkRes = await pool.query('SELECT * FROM customers WHERE mobile = $1', [mobile]);
    if (checkRes.rows.length > 0) {
      return NextResponse.json({ success: false, message: 'Customer with this mobile number already exists' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO customers (name, mobile, address, gst_number)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, mobile, address || null, gst_number || null]
    );

    const newCustomer = result.rows[0];
    await logAudit('Create Customer', 'customers', newCustomer.id, 'admin');

    return NextResponse.json({ success: true, data: newCustomer }, { status: 201 });
  } catch (error) {
    console.error('Failed to create customer:', error);
    return NextResponse.json({ success: false, message: 'Failed to create customer' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name, mobile, address, gst_number } = await req.json();

    if (!id || !name || !mobile) {
      return NextResponse.json({ success: false, message: 'ID, name, and mobile are required' }, { status: 400 });
    }

    // Check if mobile number is used by another customer
    const checkRes = await pool.query('SELECT * FROM customers WHERE mobile = $1 AND id != $2', [mobile, id]);
    if (checkRes.rows.length > 0) {
      return NextResponse.json({ success: false, message: 'Mobile number is already used by another customer' }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE customers 
       SET name = $1, mobile = $2, address = $3, gst_number = $4
       WHERE id = $5 RETURNING *`,
      [name, mobile, address, gst_number, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    const updatedCustomer = result.rows[0];
    await logAudit('Update Customer', 'customers', updatedCustomer.id, 'admin');

    return NextResponse.json({ success: true, data: updatedCustomer });
  } catch (error) {
    console.error('Failed to update customer:', error);
    return NextResponse.json({ success: false, message: 'Failed to update customer' }, { status: 500 });
  }
}
