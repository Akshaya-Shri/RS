import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let query = 'SELECT *, type AS category FROM products';
    const params: any[] = [];
    if (category) {
      query += ' WHERE type = $1';
      params.push(category);
    }
    query += ' ORDER BY id ASC';

    const result = await pool.query(query, params);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Failed to read products for public API:', error);
    return NextResponse.json({ success: false, message: 'Failed to read products' }, { status: 500 });
  }
}
