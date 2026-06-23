import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // 1. Today's Sales (Revenue) and Bills count
    const todayRes = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0)::NUMERIC as today_sales,
             COUNT(*)::INTEGER as today_bills
      FROM sales
      WHERE created_at::date = CURRENT_DATE AND deleted_at IS NULL
    `);
    const todaySales = parseFloat(todayRes.rows[0]?.today_sales || 0);
    const todayBills = todayRes.rows[0]?.today_bills || 0;

    // 2. Today's Profit
    const todayProfitRes = await pool.query(`
      SELECT COALESCE(SUM((si.selling_price - si.cost_price) * si.quantity), 0)::NUMERIC as today_profit
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.created_at::date = CURRENT_DATE AND s.deleted_at IS NULL
    `);
    const todayProfit = parseFloat(todayProfitRes.rows[0]?.today_profit || 0);

    // 3. Current Stock Value (Asset value: SUM of stock * cost_price)
    const stockValRes = await pool.query(`
      SELECT COALESCE(SUM(stock * cost_price), 0)::NUMERIC as stock_value
      FROM products
      WHERE deleted_at IS NULL
    `);
    const currentStockValue = parseFloat(stockValRes.rows[0]?.stock_value || 0);

    // 4. Low Stock Items count
    const lowStockRes = await pool.query(`
      SELECT COUNT(*)::INTEGER as low_stock_count
      FROM products
      WHERE stock <= low_stock_threshold AND deleted_at IS NULL
    `);
    const lowStockCount = lowStockRes.rows[0]?.low_stock_count || 0;

    // 5. Total Supplier Outstanding (Payables)
    const supplierOutRes = await pool.query(`
      SELECT (
        (SELECT COALESCE(SUM(total_amount), 0) FROM purchases WHERE deleted_at IS NULL) - 
        (SELECT COALESCE(SUM(amount_paid), 0) FROM supplier_payments)
      )::NUMERIC as outstanding
    `);
    const supplierOutstanding = parseFloat(supplierOutRes.rows[0]?.outstanding || 0);

    // 6. Pending Tin Count
    const tinPendingRes = await pool.query(`
      SELECT COALESCE(SUM(CASE WHEN transaction_type = 'issue' THEN quantity ELSE -quantity END), 0)::INTEGER as pending_tins
      FROM tin_transactions
    `);
    const pendingTins = tinPendingRes.rows[0]?.pending_tins || 0;

    // 7. Recent 5 bills
    const recentBillsRes = await pool.query(`
      SELECT s.*, c.name as customer_name
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.deleted_at IS NULL
      ORDER BY s.created_at DESC
      LIMIT 5
    `);

    // 8. Trends for Charts (Last 10 days)
    const trendsRes = await pool.query(`
      SELECT DATE_TRUNC('day', s.created_at)::DATE as date_label,
             COALESCE(SUM(s.total_amount), 0)::NUMERIC as revenue,
             COALESCE(SUM((si.selling_price - si.cost_price) * si.quantity), 0)::NUMERIC as profit
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE s.deleted_at IS NULL AND s.created_at >= CURRENT_DATE - INTERVAL '10 days'
      GROUP BY DATE_TRUNC('day', s.created_at)
      ORDER BY date_label ASC
    `);

    // 9. Stock Movement Trend (Last 10 ledger entries)
    const stockMoveRes = await pool.query(`
      SELECT sl.*, p.name as product_name
      FROM stock_ledger sl
      JOIN products p ON sl.product_id = p.id
      ORDER BY sl.created_at DESC
      LIMIT 10
    `);

    return NextResponse.json({
      success: true,
      data: {
        widgets: {
          todaySales,
          todayBills,
          todayProfit,
          currentStockValue,
          lowStockCount,
          supplierOutstanding,
          pendingTins
        },
        recentBills: recentBillsRes.rows,
        trends: trendsRes.rows,
        stockMovement: stockMoveRes.rows
      }
    });
  } catch (error) {
    console.error('Failed to fetch dashboard metrics:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch dashboard metrics' }, { status: 500 });
  }
}
