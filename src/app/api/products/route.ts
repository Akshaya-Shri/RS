import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    let query = 'SELECT * FROM products';
    let params: any[] = [];
    
    if (category) {
      query += ' WHERE type = ?';
      params.push(category);
    }
    
    const [rows] = await pool.query(query, params);
    
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch products' }, { status: 500 });
  }
}
