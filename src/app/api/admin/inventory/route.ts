import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyDbSession } from '@/lib/auth-db';

export async function GET(req: Request) {
  try {
    const session = await verifyDbSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 401 });

    const res = await pool.query(`
      SELECT 
        id, name, sku, barcode, stock, reserved, incoming, 
        stock_status, low_stock_threshold, locations, variants, "imageUrl"
      FROM products
      ORDER BY id ASC
    `);

    const summary = res.rows.map((p: any) => ({
      id: p.id,
      name: p.name,
      sku: p.sku ?? '',
      barcode: p.barcode ?? '',
      stock: typeof p.stock === 'number' ? p.stock : 0,
      reserved: typeof p.reserved === 'number' ? p.reserved : 0,
      incoming: typeof p.incoming === 'number' ? p.incoming : 0,
      stock_status: p.stock_status ?? 'in_stock',
      low_stock_threshold: typeof p.low_stock_threshold === 'number' ? p.low_stock_threshold : 0,
      locations: p.locations ?? [],
      variants: p.variants ?? [],
      imageUrl: p.imageUrl ?? null
    }));

    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error('Failed to read inventory:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch inventory' }, { status: 500 });
  }
}
