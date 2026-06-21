import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { validateUploadFile } from '@/lib/upload';

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function POST(req: Request) {
  try {
    const contentType = String(req.headers.get('content-type') || '');

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ success: false, message: 'Multipart/form-data expected' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    // Validate using shared upload validator
    const validation = validateUploadFile(file);
    if (!validation.valid || !validation.sanitizedName) {
      return NextResponse.json({ success: false, message: validation.message || 'Invalid file format' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save strictly to the public/uploads directory (never product images or payment QR directory)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    ensureDir(uploadsDir);

    // Force unique random suffix to prevent file collisions or malicious overwrites
    const randomSuffix = crypto.randomBytes(6).toString('hex');
    const filename = `payment-${Date.now()}-${randomSuffix}-${validation.sanitizedName}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;
    return NextResponse.json({ success: true, url: publicUrl });

  } catch (error) {
    console.error('Payment upload error:', error);
    return NextResponse.json({ success: false, message: 'Failed to upload payment proof' }, { status: 500 });
  }
}
