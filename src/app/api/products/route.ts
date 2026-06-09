import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PRODUCTS_FILE = path.join(process.cwd(), 'src/data/products.json');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Try database first if available; otherwise fallback to filesystem JSON
    try {
      const dbModule = await import('@/lib/db');
      const pool = dbModule.default ?? (dbModule.pool ?? dbModule);
      if (pool && typeof pool.query === 'function') {
        let query = 'SELECT * FROM products';
        const params: any[] = [];
        if (category) {
          query += ' WHERE type = $1';
          params.push(category);
        }
        const result = await pool.query(query, params);
        const rows = result.rows;
        return NextResponse.json({ success: true, data: rows });
      }
    } catch (dbErr) {
      // ignore and fallback to file
    }

    // Filesystem fallback
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    let products = JSON.parse(data);
    if (category) products = products.filter((p: any) => p.category === category);
    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error('Failed to read products for public API:', error);
    return NextResponse.json({ success: false, message: 'Failed to read products' }, { status: 500 });
  }
}
