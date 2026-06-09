import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
const PRODUCTS_FILE = path.join(process.cwd(), 'src/data/products.json');

function readProducts() {
  try {
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeProducts(products: any[]) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
}

function defaultInventory() {
  return {
    sku: '',
    barcode: '',
    stock: 0,
    reserved: 0,
    incoming: 0,
    min_stock: 0,
    reorder_qty: 0,
    backorder_allowed: false,
    locations: [],
    variants: [],
    batches: [],
    cost_price: 0,
    last_cost: 0,
    unit: null,
    pack_size: null,
    supplierId: null,
    leadTimeDays: null,
    low_stock_threshold: 0,
    stock_status: 'in_stock',
    stock_updated_at: null
  };
}

export async function GET() {
  try {
    const products = readProducts();
    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error('Failed to read products:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const products = readProducts();
    const nextId = products.reduce((max: number, p: any) => Math.max(max, p.id || 0), 0) + 1;

    const newProduct = {
      id: nextId,
      name: payload.name || 'Untitled',
      price: payload.price || 0,
      category: payload.category || 'general',
      slug: payload.slug || `product-${nextId}`,
      imageUrl: payload.imageUrl || '/images/Oilimages/groundnutoil.png',
      sizes: payload.sizes || [],
      description: payload.description || '',
      available: payload.available ?? true
    };

    // attach inventory defaults and allow overrides from payload
    const inventoryDefaults = defaultInventory();
    const inventoryFromPayload = {
      sku: payload.sku ?? inventoryDefaults.sku,
      barcode: payload.barcode ?? inventoryDefaults.barcode,
      stock: payload.stock ?? inventoryDefaults.stock,
      reserved: payload.reserved ?? inventoryDefaults.reserved,
      incoming: payload.incoming ?? inventoryDefaults.incoming,
      min_stock: payload.min_stock ?? inventoryDefaults.min_stock,
      reorder_qty: payload.reorder_qty ?? inventoryDefaults.reorder_qty,
      backorder_allowed: payload.backorder_allowed ?? inventoryDefaults.backorder_allowed,
      locations: payload.locations ?? inventoryDefaults.locations,
      variants: payload.variants ?? inventoryDefaults.variants,
      batches: payload.batches ?? inventoryDefaults.batches,
      cost_price: payload.cost_price ?? inventoryDefaults.cost_price,
      last_cost: payload.last_cost ?? inventoryDefaults.last_cost,
      unit: payload.unit ?? inventoryDefaults.unit,
      pack_size: payload.pack_size ?? inventoryDefaults.pack_size,
      supplierId: payload.supplierId ?? inventoryDefaults.supplierId,
      leadTimeDays: payload.leadTimeDays ?? inventoryDefaults.leadTimeDays,
      low_stock_threshold: payload.low_stock_threshold ?? inventoryDefaults.low_stock_threshold,
      stock_status: payload.stock_status ?? inventoryDefaults.stock_status,
      stock_updated_at: payload.stock_updated_at ?? inventoryDefaults.stock_updated_at
    };

    Object.assign(newProduct, inventoryFromPayload);

    products.unshift(newProduct);
    writeProducts(products);

    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json({ success: false, message: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const payload = await req.json();
    const { id } = payload;
    if (!id) return NextResponse.json({ success: false, message: 'Product id required' }, { status: 400 });

    const products = readProducts();
    const idx = products.findIndex((p: any) => p.id === id);
    if (idx === -1) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });

    products[idx] = { ...products[idx], ...payload };
    writeProducts(products);

    return NextResponse.json({ success: true, data: products[idx] });
  } catch (error) {
    console.error('Failed to update product:', error);
    return NextResponse.json({ success: false, message: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: 'Product id required' }, { status: 400 });

    const products = readProducts();
    const updated = products.filter((p: any) => p.id !== id);
    writeProducts(updated);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete product:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete product' }, { status: 500 });
  }
}
