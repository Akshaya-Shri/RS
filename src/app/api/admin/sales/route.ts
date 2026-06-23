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
      SELECT s.*, c.name as customer_name, c.mobile as customer_mobile, i.pdf_url
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      LEFT JOIN invoices i ON s.id = i.sale_id
      WHERE s.deleted_at IS NULL
      ORDER BY s.created_at DESC
    `);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Failed to fetch sales:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    const { customer_id, customer_name, customer_mobile, customer_address, customer_gst, total_amount, payment_type, items } = await req.json();

    if (!total_amount || !payment_type || !items || !items.length) {
      return NextResponse.json({ success: false, message: 'Invalid sales data' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Identify or create customer
    let finalCustomerId = customer_id;
    if (!finalCustomerId) {
      if (!customer_name || !customer_mobile) {
        throw new Error('Customer name and mobile are required for new customers');
      }

      // Check if customer exists by mobile
      const checkRes = await client.query('SELECT id FROM customers WHERE mobile = $1', [customer_mobile]);
      if (checkRes.rows.length > 0) {
        finalCustomerId = checkRes.rows[0].id;
      } else {
        const custInsert = await client.query(
          `INSERT INTO customers (name, mobile, address, gst_number)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [customer_name, customer_mobile, customer_address || null, customer_gst || null]
        );
        finalCustomerId = custInsert.rows[0].id;
      }
    }

    // 2. Generate sequential Invoice Number
    const countRes = await client.query('SELECT COUNT(*) FROM sales');
    const invoiceNumber = `INV-${(parseInt(countRes.rows[0].count) + 1).toString().padStart(5, '0')}`;

    // 3. Create Sale record
    const saleRes = await client.query(
      `INSERT INTO sales (customer_id, invoice_number, total_amount, payment_type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [finalCustomerId, invoiceNumber, total_amount, payment_type]
    );
    const sale = saleRes.rows[0];
    const saleId = sale.id;

    // 4. Process items and validate stock
    for (const item of items) {
      const { product_id, quantity, selling_price } = item;

      if (!product_id || !quantity || !selling_price) {
        throw new Error('Invalid sale item details');
      }

      // Fetch product details for validation and cost price lookup
      const prodRes = await client.query('SELECT stock, cost_price, name FROM products WHERE id = $1 FOR UPDATE', [product_id]);
      if (prodRes.rows.length === 0) {
        throw new Error(`Product not found (ID: ${product_id})`);
      }

      const product = prodRes.rows[0];
      const stock = product.stock || 0;
      const costPrice = parseFloat(product.cost_price || 0.00);

      // Validate stock availability
      if (stock < quantity) {
        throw new Error(`Insufficient stock for "${product.name}". Available: ${stock}, Requested: ${quantity}`);
      }

      // Insert sale item
      await client.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, selling_price, cost_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [saleId, product_id, quantity, selling_price, costPrice]
      );

      // Reduce stock in products table
      await client.query(
        `UPDATE products 
         SET stock = stock - $1,
             stock_status = CASE 
                 WHEN (stock - $1) - reserved <= 0 THEN 'out_of_stock'
                 WHEN (stock - $1) - reserved <= low_stock_threshold THEN 'low'
                 ELSE 'in_stock'
             END,
             stock_updated_at = now()
         WHERE id = $2`,
        [quantity, product_id]
      );

      // Create stock ledger entry
      await client.query(
        `INSERT INTO stock_ledger (product_id, transaction_type, quantity, reference_type, reference_id)
         VALUES ($1, 'sale', $2, 'sale', $3)`,
        [product_id, -quantity, saleId]
      );
    }

    // 5. Create Invoice record
    await client.query(
      `INSERT INTO invoices (sale_id, invoice_number)
       VALUES ($1, $2)`,
      [saleId, invoiceNumber]
    );

    // Commit Transaction
    await client.query('COMMIT');

    await logAudit('Create Invoice Sale', 'sales', saleId, 'admin');

    // Fetch customer details to return to the client
    const customerRes = await pool.query('SELECT * FROM customers WHERE id = $1', [finalCustomerId]);

    return NextResponse.json({
      success: true,
      data: {
        sale,
        customer: customerRes.rows[0],
        invoice_number: invoiceNumber
      }
    }, { status: 201 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Failed to create sale:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to record sale' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(req: Request) {
  const client = await pool.connect();
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, message: 'Sale ID is required' }, { status: 400 });
    }

    await client.query('BEGIN');

    // Fetch sale
    const saleRes = await client.query('SELECT * FROM sales WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (saleRes.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Sale not found' }, { status: 404 });
    }
    const sale = saleRes.rows[0];

    // Fetch items to restore stock
    const itemsRes = await client.query('SELECT * FROM sale_items WHERE sale_id = $1', [id]);
    const items = itemsRes.rows;

    // 1. Soft delete the sale and invoice
    await client.query('UPDATE sales SET deleted_at = now() WHERE id = $1', [id]);
    await client.query('UPDATE invoices SET deleted_at = now() WHERE sale_id = $1', [id]);

    // 2. Revert stock changes
    for (const item of items) {
      await client.query(
        `UPDATE products 
         SET stock = stock + $1,
             stock_status = CASE 
                 WHEN (stock + $1) - reserved <= 0 THEN 'out_of_stock'
                 WHEN (stock + $1) - reserved <= low_stock_threshold THEN 'low'
                 ELSE 'in_stock'
             END,
             stock_updated_at = now()
         WHERE id = $2`,
        [item.quantity, item.product_id]
      );

      // Create positive stock ledger entry representing cancelation/refund
      await client.query(
        `INSERT INTO stock_ledger (product_id, transaction_type, quantity, reference_type, reference_id)
         VALUES ($1, 'sale_cancel', $2, 'sale', $3)`,
         [item.product_id, item.quantity, id]
      );
    }

    await client.query('COMMIT');

    await logAudit('Cancel Sale', 'sales', id, 'admin');

    return NextResponse.json({ success: true, message: 'Sale cancelled and stock reverted successfully' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Failed to cancel sale:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to cancel sale' }, { status: 500 });
  } finally {
    client.release();
  }
}
