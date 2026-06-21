import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyDbSession } from '@/lib/auth-db';

export async function GET() {
  try {
    const session = await verifyDbSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 401 });

    const res = await pool.query('SELECT *, type AS category FROM products ORDER BY id ASC');
    return NextResponse.json({ success: true, data: res.rows });
  } catch (error) {
    console.error('Failed to read products:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await verifyDbSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 401 });

    const payload = await req.json();
    const type = payload.category || payload.type || 'general';

    const insertQuery = `
      INSERT INTO products (
        name, name_ta, description, description_ta, type, slug, 
        "imageUrl", price, sizes, available, benefits, benefits_ta, 
        "usage", usage_ta, sku, barcode, stock, reserved, incoming, 
        min_stock, reorder_qty, backorder_allowed, locations, 
        variants, batches, cost_price, last_cost, unit, 
        "pack_size", "supplierId", "leadTimeDays", 
        low_stock_threshold, stock_status, stock_updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
        $27, $28, $29, $30, $31, $32, $33, $34
      ) RETURNING *, type AS category
    `;

    const values = [
      payload.name || 'Untitled',
      payload.name_ta || null,
      payload.description || '',
      payload.description_ta || null,
      type,
      payload.slug || `product-${Date.now()}`,
      payload.imageUrl || '/images/Oilimages/groundnutoil.png',
      payload.price || 0,
      payload.sizes || [],
      payload.available ?? true,
      payload.benefits || [],
      payload.benefits_ta || [],
      payload.usage || null,
      payload.usage_ta || null,
      payload.sku || '',
      payload.barcode || '',
      payload.stock || 0,
      payload.reserved || 0,
      payload.incoming || 0,
      payload.min_stock || 0,
      payload.reorder_qty || 0,
      payload.backorder_allowed ?? false,
      JSON.stringify(payload.locations || []),
      JSON.stringify(payload.variants || []),
      JSON.stringify(payload.batches || []),
      payload.cost_price || 0,
      payload.last_cost || 0,
      payload.unit || 'ml',
      payload.pack_size || null,
      payload.supplierId || null,
      payload.leadTimeDays || 7,
      payload.low_stock_threshold || 0,
      payload.stock_status || 'in_stock',
      payload.stock_updated_at ? new Date(payload.stock_updated_at) : null
    ];

    const result = await pool.query(insertQuery, values);
    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json({ success: false, message: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await verifyDbSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 401 });

    const payload = await req.json();
    const { id } = payload;
    if (!id) return NextResponse.json({ success: false, message: 'Product id required' }, { status: 400 });

    // Fetch existing product to merge partial updates safely
    const existing = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }
    const current = existing.rows[0];
    const merged = { ...current, ...payload };

    const type = merged.category || merged.type;

    const updateQuery = `
      UPDATE products SET
        name = $1,
        name_ta = $2,
        description = $3,
        description_ta = $4,
        type = $5,
        slug = $6,
        "imageUrl" = $7,
        price = $8,
        sizes = $9,
        available = $10,
        benefits = $11,
        benefits_ta = $12,
        "usage" = $13,
        usage_ta = $14,
        sku = $15,
        barcode = $16,
        stock = $17,
        reserved = $18,
        incoming = $19,
        min_stock = $20,
        reorder_qty = $21,
        backorder_allowed = $22,
        locations = $23,
        variants = $24,
        batches = $25,
        cost_price = $26,
        last_cost = $27,
        unit = $28,
        "pack_size" = $29,
        "supplierId" = $30,
        "leadTimeDays" = $31,
        low_stock_threshold = $32,
        stock_status = $33,
        stock_updated_at = $34
      WHERE id = $35
      RETURNING *, type AS category
    `;

    const values = [
      merged.name,
      merged.name_ta || null,
      merged.description,
      merged.description_ta || null,
      type,
      merged.slug,
      merged.imageUrl,
      merged.price,
      merged.sizes,
      merged.available ?? true,
      merged.benefits || [],
      merged.benefits_ta || [],
      merged.usage || null,
      merged.usage_ta || null,
      merged.sku || '',
      merged.barcode || '',
      merged.stock || 0,
      merged.reserved || 0,
      merged.incoming || 0,
      merged.min_stock || 0,
      merged.reorder_qty || 0,
      merged.backorder_allowed ?? false,
      typeof merged.locations === 'string' ? merged.locations : JSON.stringify(merged.locations || []),
      typeof merged.variants === 'string' ? merged.variants : JSON.stringify(merged.variants || []),
      typeof merged.batches === 'string' ? merged.batches : JSON.stringify(merged.batches || []),
      merged.cost_price || 0,
      merged.last_cost || 0,
      merged.unit || 'ml',
      merged.pack_size || null,
      merged.supplierId || null,
      merged.leadTimeDays || 7,
      merged.low_stock_threshold || 0,
      merged.stock_status || 'in_stock',
      merged.stock_updated_at ? new Date(merged.stock_updated_at) : null,
      id
    ];

    const result = await pool.query(updateQuery, values);
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Failed to update product:', error);
    return NextResponse.json({ success: false, message: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await verifyDbSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 401 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: 'Product id required' }, { status: 400 });

    const result = await pool.query('DELETE FROM products WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete product:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete product' }, { status: 500 });
  }
}
