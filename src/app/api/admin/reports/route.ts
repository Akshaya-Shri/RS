import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'daily';
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];

    const params = [startDate, endDate];

    if (type === 'daily') {
      // 1. Daily Sales
      const salesRes = await pool.query(`
        SELECT s.*, c.name as customer_name 
        FROM sales s 
        JOIN customers c ON s.customer_id = c.id 
        WHERE s.created_at::date >= $1 AND s.created_at::date <= $2 AND s.deleted_at IS NULL
        ORDER BY s.created_at DESC
      `, params);

      // 2. Daily Profits
      const profitRes = await pool.query(`
        SELECT s.invoice_number, s.created_at::date as date, 
               SUM((si.selling_price - si.cost_price) * si.quantity)::NUMERIC as profit,
               SUM(si.selling_price * si.quantity)::NUMERIC as revenue
        FROM sale_items si 
        JOIN sales s ON si.sale_id = s.id 
        WHERE s.created_at::date >= $1 AND s.created_at::date <= $2 AND s.deleted_at IS NULL
        GROUP BY s.id, s.invoice_number, s.created_at::date
        ORDER BY date DESC
      `, params);

      // 3. Daily Stock Movement
      const stockRes = await pool.query(`
        SELECT sl.*, p.name as product_name 
        FROM stock_ledger sl 
        JOIN products p ON sl.product_id = p.id 
        WHERE sl.created_at::date >= $1 AND sl.created_at::date <= $2
        ORDER BY sl.created_at DESC
      `, params);

      // 4. Daily Payments
      const paymentsRes = await pool.query(`
        SELECT sp.*, s.company_name as supplier_name 
        FROM supplier_payments sp 
        JOIN suppliers s ON sp.supplier_id = s.id 
        WHERE sp.created_at::date >= $1 AND sp.created_at::date <= $2
        ORDER BY sp.created_at DESC
      `, params);

      return NextResponse.json({
        success: true,
        data: {
          sales: salesRes.rows,
          profits: profitRes.rows,
          stockMovement: stockRes.rows,
          payments: paymentsRes.rows
        }
      });
    }

    if (type === 'weekly') {
      // 1. Weekly Sales Summary
      const salesSummaryRes = await pool.query(`
        SELECT DATE_TRUNC('week', created_at)::date as label,
               COUNT(*)::INTEGER as total_sales,
               SUM(total_amount)::NUMERIC as revenue
        FROM sales
        WHERE created_at::date >= $1 AND created_at::date <= $2 AND deleted_at IS NULL
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY label DESC
      `, params);

      // 2. Weekly Supplier Summary
      const supplierSummaryRes = await pool.query(`
        SELECT s.id, s.company_name,
               COALESCE(p.total, 0)::NUMERIC as total_purchases,
               COALESCE(pm.total, 0)::NUMERIC as total_payments
        FROM suppliers s
        LEFT JOIN (
          SELECT supplier_id, SUM(total_amount) as total 
          FROM purchases 
          WHERE purchase_date::date >= $1 AND purchase_date::date <= $2 AND deleted_at IS NULL 
          GROUP BY supplier_id
        ) p ON s.id = p.supplier_id
        LEFT JOIN (
          SELECT supplier_id, SUM(amount_paid) as total 
          FROM supplier_payments 
          WHERE created_at::date >= $1 AND created_at::date <= $2 
          GROUP BY supplier_id
        ) pm ON s.id = pm.supplier_id
        WHERE s.deleted_at IS NULL
        ORDER BY s.company_name ASC
      `, params);

      return NextResponse.json({
        success: true,
        data: {
          salesSummary: salesSummaryRes.rows,
          supplierSummary: supplierSummaryRes.rows
        }
      });
    }

    if (type === 'monthly') {
      // 1. Monthly Revenue, Profit
      const monthlyRes = await pool.query(`
        SELECT DATE_TRUNC('month', s.created_at)::date as label,
               COUNT(*)::INTEGER as total_sales,
               SUM(s.total_amount)::NUMERIC as revenue,
               SUM((SELECT SUM((si.selling_price - si.cost_price) * si.quantity) FROM sale_items si WHERE si.sale_id = s.id))::NUMERIC as profit
        FROM sales s
        WHERE s.created_at::date >= $1 AND s.created_at::date <= $2 AND s.deleted_at IS NULL
        GROUP BY DATE_TRUNC('month', s.created_at)
        ORDER BY label DESC
      `, params);

      // 2. Product Sales Summary for Stock levels
      const stockSummaryRes = await pool.query(`
        SELECT p.id, p.name, p.sku, p.stock,
               COALESCE(SUM(si.quantity), 0)::INTEGER as quantity_sold,
               COALESCE(SUM(si.selling_price * si.quantity), 0)::NUMERIC as revenue
        FROM products p
        LEFT JOIN sale_items si ON p.id = si.product_id
        LEFT JOIN sales s ON si.sale_id = s.id AND s.deleted_at IS NULL AND s.created_at::date >= $1 AND s.created_at::date <= $2
        WHERE p.deleted_at IS NULL
        GROUP BY p.id, p.name, p.sku, p.stock
        ORDER BY quantity_sold DESC
      `);

      return NextResponse.json({
        success: true,
        data: {
          monthlySummary: monthlyRes.rows,
          stockSummary: stockSummaryRes.rows
        }
      });
    }

    if (type === 'supplier') {
      // Outstanding Balance & History
      const result = await pool.query(`
        SELECT s.id, s.company_name, s.phone,
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
        ORDER BY outstanding_balance DESC
      `);
      return NextResponse.json({ success: true, data: result.rows });
    }

    if (type === 'tin') {
      // Pending returns report
      const result = await pool.query(`
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
        HAVING (
          COALESCE(SUM(CASE WHEN t.transaction_type = 'issue' THEN t.quantity ELSE 0 END), 0) - 
          COALESCE(SUM(CASE WHEN t.transaction_type = 'return' THEN t.quantity ELSE 0 END), 0)
        ) > 0
        ORDER BY balance DESC
      `);
      return NextResponse.json({ success: true, data: result.rows });
    }

    return NextResponse.json({ success: false, message: 'Invalid report type' }, { status: 400 });
  } catch (error) {
    console.error('Failed to generate report:', error);
    return NextResponse.json({ success: false, message: 'Failed to generate report' }, { status: 500 });
  }
}
