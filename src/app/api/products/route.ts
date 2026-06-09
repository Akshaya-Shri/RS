import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let query = 'SELECT * FROM products';
    const params: any[] = [];

    if (category) {
      query += ' WHERE type = $1';
      params.push(category);
    }

    const result = await pool.query(query, params);
    const rows = result.rows;

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch products' }, { status: 500 });
  }
}
