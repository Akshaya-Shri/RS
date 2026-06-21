import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    let query = 'SELECT * FROM inventory_audit ORDER BY at DESC';
    const params: any[] = [];
    if (Number.isFinite(limit) && limit > 0) {
      query += ' LIMIT $1';
      params.push(limit);
    }

    const result = await pool.query(query, params);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Failed to read inventory audit:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch audit history' }, { status: 500 });
  }
}
