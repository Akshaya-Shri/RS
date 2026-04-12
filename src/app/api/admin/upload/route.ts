import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const isQR = formData.get('isQR') === 'true';

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save into public/images/Oilimages for products, or public/images for QR
    const uploadDir = isQR 
      ? path.join(process.cwd(), 'public', 'images')
      : path.join(process.cwd(), 'public', 'images', 'Oilimages');
      
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = isQR ? 'qr-payment.png' : `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = isQR 
      ? `/images/${filename}`
      : `/images/Oilimages/${filename}`;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to upload file' }, { status: 500 });
  }
}
