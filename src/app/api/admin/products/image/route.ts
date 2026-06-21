import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyDbSession } from '@/lib/auth-db';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const session = await verifyDbSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 401 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: 'Product id required' }, { status: 400 });

    const existing = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    const prod = existing.rows[0];
    const imageUrl: string = prod.imageUrl || '';
    // Only delete local files under /images or /uploads
    if (imageUrl && (imageUrl.startsWith('/images/') || imageUrl.startsWith('/uploads/'))) {
      const filePath = path.join(process.cwd(), 'public', imageUrl.replace(/^\//, ''));
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {
        console.error('Failed to remove image file:', e);
      }
    }

    // reset to placeholder in database
    const result = await pool.query(
      'UPDATE products SET "imageUrl" = $1 WHERE id = $2 RETURNING *, type AS category',
      ['/images/Oilimages/groundnutoil.png', id]
    );

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Failed to remove product image:', error);
    return NextResponse.json({ success: false, message: 'Failed to remove image' }, { status: 500 });
  }
}
