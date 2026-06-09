import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_/]/g, '');
}

export async function POST(req: Request) {
  try {
    const contentType = String(req.headers.get('content-type') || '');

    // Handle multipart/form-data uploads (File object)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const isQR = formData.get('isQR') === 'true';

      if (!file) {
        return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = isQR
        ? path.join(process.cwd(), 'public', 'images')
        : path.join(process.cwd(), 'public', 'images', 'Oilimages');

      ensureDir(uploadDir);

      const filename = isQR ? 'qr-payment.png' : `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const filePath = path.join(uploadDir, filename);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = isQR ? `/images/${filename}` : `/images/Oilimages/${filename}`;
      return NextResponse.json({ success: true, url: publicUrl });
    }

    // Otherwise expect JSON with base64 data
    const body = await req.json().catch(() => ({}));
    const { filename, data, isQR } = body as { filename?: string; data?: string; isQR?: boolean };
    if (!filename || !data) {
      return NextResponse.json({ success: false, message: 'filename and data required' }, { status: 400 });
    }

    // If isQR flag is provided, save to images, otherwise to uploads
    if (isQR) {
      const uploadDir = path.join(process.cwd(), 'public', 'images');
      ensureDir(uploadDir);
      const safeName = `qr-${sanitizeFilename(path.basename(filename))}`;
      const filePath = path.join(uploadDir, safeName);

      const match = String(data).match(/^data:(.+);base64,(.*)$/);
      const base64 = match ? match[2] : data;
      fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
      return NextResponse.json({ success: true, url: `/images/${safeName}` });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    ensureDir(uploadsDir);
    const match = String(data).match(/^data:(.+);base64,(.*)$/);
    const base64 = match ? match[2] : data;
    const safeName = `${Date.now()}-${sanitizeFilename(path.basename(filename))}`;
    const filePath = path.join(uploadsDir, safeName);
    fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
    return NextResponse.json({ success: true, url: `/uploads/${safeName}` });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to upload file' }, { status: 500 });
  }
}
