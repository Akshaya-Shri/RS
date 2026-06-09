import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PRODUCTS_FILE = path.join(process.cwd(), 'src/data/products.json');

function readProducts() {
  try {
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function writeProducts(products: any[]) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
}

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: 'Product id required' }, { status: 400 });

    const products = readProducts();
    const idx = products.findIndex((p: any) => p.id === id);
    if (idx === -1) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });

    const prod = products[idx];
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

    // reset to placeholder
    products[idx].imageUrl = '/images/Oilimages/groundnutoil.png';
    writeProducts(products);

    return NextResponse.json({ success: true, data: products[idx] });
  } catch (error) {
    console.error('Failed to remove product image:', error);
    return NextResponse.json({ success: false, message: 'Failed to remove image' }, { status: 500 });
  }
}
