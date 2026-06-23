import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      // Get single detailed invoice with items
      const res = await pool.query(`
        SELECT i.*, s.total_amount, s.payment_type, s.created_at as sale_date, 
               c.name as customer_name, c.mobile as customer_mobile, c.address as customer_address, c.gst_number as customer_gst
        FROM invoices i
        JOIN sales s ON i.sale_id = s.id
        JOIN customers c ON s.customer_id = c.id
        WHERE i.id = $1 AND i.deleted_at IS NULL
      `, [id]);

      if (res.rows.length === 0) {
        return NextResponse.json({ success: false, message: 'Invoice not found' }, { status: 404 });
      }

      const invoice = res.rows[0];

      // Fetch items
      const itemsRes = await pool.query(`
        SELECT si.*, p.name as product_name, p.unit
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = $1
      `, [invoice.sale_id]);

      invoice.items = itemsRes.rows;

      return NextResponse.json({ success: true, data: invoice });
    }

    // List all invoices
    const result = await pool.query(`
      SELECT i.*, s.total_amount, s.payment_type, c.name as customer_name, c.mobile as customer_mobile
      FROM invoices i
      JOIN sales s ON i.sale_id = s.id
      JOIN customers c ON s.customer_id = c.id
      WHERE i.deleted_at IS NULL
      ORDER BY i.created_at DESC
    `);

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch invoices' }, { status: 500 });
  }
}

// Track WhatsApp Sharing
export async function POST(req: Request) {
  try {
    const { invoice_number } = await req.json();

    if (!invoice_number) {
      return NextResponse.json({ success: false, message: 'Invoice number is required' }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE invoices SET shared_on_whatsapp = now() WHERE invoice_number = $1 RETURNING *`,
      [invoice_number]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Failed to update sharing log:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
