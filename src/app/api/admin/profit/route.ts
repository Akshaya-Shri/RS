import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'daily'; // daily, weekly, monthly, product

    // 1. Fetch dashboard cards (Today's, Monthly, Top Products)
    const todayRes = await pool.query(`
      SELECT COALESCE(SUM((si.selling_price - si.cost_price) * si.quantity), 0)::NUMERIC as profit,
             COALESCE(SUM(s.total_amount), 0)::NUMERIC as revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.created_at >= CURRENT_DATE AND s.deleted_at IS NULL
    `);

    const monthRes = await pool.query(`
      SELECT COALESCE(SUM((si.selling_price - si.cost_price) * si.quantity), 0)::NUMERIC as profit,
             COALESCE(SUM(s.total_amount), 0)::NUMERIC as revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.created_at >= DATE_TRUNC('month', CURRENT_DATE) AND s.deleted_at IS NULL
    `);

    const topProductsRes = await pool.query(`
      SELECT p.name, 
             COALESCE(SUM((si.selling_price - si.cost_price) * si.quantity), 0)::NUMERIC as profit,
             SUM(si.quantity)::INTEGER as quantity_sold
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.deleted_at IS NULL
      GROUP BY p.id, p.name
      ORDER BY profit DESC
      LIMIT 5
    `);

    // 2. Fetch chart data based on range
    let trendData: any[] = [];
    if (range === 'daily') {
      const trendRes = await pool.query(`
        SELECT DATE_TRUNC('day', s.created_at)::DATE as label,
               COALESCE(SUM((si.selling_price - si.cost_price) * si.quantity), 0)::NUMERIC as profit,
               COALESCE(SUM(s.total_amount), 0)::NUMERIC as revenue
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE s.deleted_at IS NULL AND s.created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', s.created_at)
        ORDER BY label ASC
      `);
      trendData = trendRes.rows;
    } else if (range === 'weekly') {
      const trendRes = await pool.query(`
        SELECT DATE_TRUNC('week', s.created_at)::DATE as label,
               COALESCE(SUM((si.selling_price - si.cost_price) * si.quantity), 0)::NUMERIC as profit,
               COALESCE(SUM(s.total_amount), 0)::NUMERIC as revenue
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE s.deleted_at IS NULL AND s.created_at >= CURRENT_DATE - INTERVAL '12 weeks'
        GROUP BY DATE_TRUNC('week', s.created_at)
        ORDER BY label ASC
      `);
      trendData = trendRes.rows;
    } else if (range === 'monthly') {
      const trendRes = await pool.query(`
        SELECT DATE_TRUNC('month', s.created_at)::DATE as label,
               COALESCE(SUM((si.selling_price - si.cost_price) * si.quantity), 0)::NUMERIC as profit,
               COALESCE(SUM(s.total_amount), 0)::NUMERIC as revenue
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE s.deleted_at IS NULL AND s.created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', s.created_at)
        ORDER BY label ASC
      `);
      trendData = trendRes.rows;
    } else if (range === 'product') {
      const trendRes = await pool.query(`
        SELECT p.name as label,
               COALESCE(SUM((si.selling_price - si.cost_price) * si.quantity), 0)::NUMERIC as profit,
               COALESCE(SUM(si.selling_price * si.quantity), 0)::NUMERIC as revenue
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN sales s ON si.sale_id = s.id
        WHERE s.deleted_at IS NULL
        GROUP BY p.id, p.name
        ORDER BY profit DESC
      `);
      trendData = trendRes.rows;
    }

    return NextResponse.json({
      success: true,
      data: {
        cards: {
          todayProfit: parseFloat(todayRes.rows[0]?.profit || 0),
          todayRevenue: parseFloat(todayRes.rows[0]?.revenue || 0),
          monthlyProfit: parseFloat(monthRes.rows[0]?.profit || 0),
          monthlyRevenue: parseFloat(monthRes.rows[0]?.revenue || 0),
          topProducts: topProductsRes.rows
        },
        trends: trendData
      }
    });
  } catch (error) {
    console.error('Failed to fetch profit reports:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch profit reports' }, { status: 500 });
  }
}
