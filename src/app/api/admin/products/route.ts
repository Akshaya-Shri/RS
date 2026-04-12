import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src/data/products.json');

function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeDB(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export async function GET() {
  const products = readDB();
  return NextResponse.json({ success: true, data: products });
}

export async function POST(req: Request) {
  try {
    const newProduct = await req.json();
    const products = readDB();
    
    // Assign a new ID based on the max ID
    const maxId = products.reduce((max: number, p: any) => Math.max(max, p.id || 0), 0);
    newProduct.id = maxId + 1;
    
    products.push(newProduct);
    writeDB(products);
    
    return NextResponse.json({ success: true, data: newProduct });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to add product' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const updatedProduct = await req.json();
    const products = readDB();
    
    const index = products.findIndex((p: any) => p.id === updatedProduct.id);
    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }
    
    products[index] = { ...products[index], ...updatedProduct };
    writeDB(products);
    
    return NextResponse.json({ success: true, data: products[index] });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update product' }, { status: 500 });
  }
}
