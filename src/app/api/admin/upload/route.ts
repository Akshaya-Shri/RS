import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { verifySession } from '@/lib/auth';
import { validateUploadFile } from '@/lib/upload';
import { put } from '@vercel/blob';
import { pool } from '@/lib/db';

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function GET() {
  try {
    const res = await pool.query("SELECT value FROM settings WHERE key = 'qr_payment_url'");
    if (res.rowCount && res.rowCount > 0) {
      return NextResponse.json({ success: true, url: res.rows[0].value });
    }
    return NextResponse.json({ success: true, url: '/images/qr-payment.png' });
  } catch (error) {
    console.error('Failed to fetch payment QR setting:', error);
    return NextResponse.json({ success: true, url: '/images/qr-payment.png' });
  }
}

export async function POST(req: Request) {
  try {
    // 1. Session verification (defense in depth)
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('revathi_admin_auth');
    const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'default_super_secret_key_for_revathi_store_admin_portal';
    const session = authCookie ? await verifySession(authCookie.value, ADMIN_JWT_SECRET) : null;
    
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 401 });
    }

    const contentType = String(req.headers.get('content-type') || '');

    // Handle multipart/form-data uploads (File object)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const isQR = formData.get('isQR') === 'true';

      if (!file) {
        return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
      }

      // Validate the file
      const validation = validateUploadFile(file);
      if (!validation.valid || !validation.sanitizedName) {
        return NextResponse.json({ success: false, message: validation.message || 'Invalid file' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) {
        // Vercel Blob Upload
        const pathname = isQR
          ? `images/qr-payment.png`
          : `images/Oilimages/${Date.now()}-${validation.sanitizedName}`;

        const blob = await put(pathname, buffer, {
          access: 'public',
          contentType: file.type || 'image/png'
        });

        if (isQR) {
          await pool.query(
            "INSERT INTO settings (key, value) VALUES ('qr_payment_url', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
            [blob.url]
          );
        }

        return NextResponse.json({ success: true, url: blob.url });
      } else {
        // Local fallback
        const uploadDir = isQR
          ? path.join(process.cwd(), 'public', 'images')
          : path.join(process.cwd(), 'public', 'images', 'Oilimages');

        ensureDir(uploadDir);

        const finalFilename = isQR ? 'qr-payment.png' : `${Date.now()}-${validation.sanitizedName}`;
        const filePath = path.join(uploadDir, finalFilename);

        fs.writeFileSync(filePath, buffer);

        const publicUrl = isQR ? `/images/${finalFilename}` : `/images/Oilimages/${finalFilename}`;
        
        if (isQR) {
          await pool.query(
            "INSERT INTO settings (key, value) VALUES ('qr_payment_url', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
            [publicUrl]
          );
        }

        return NextResponse.json({ success: true, url: publicUrl });
      }
    }

    // JSON base64 data upload
    const body = await req.json().catch(() => ({}));
    const { filename, data, isQR } = body as { filename?: string; data?: string; isQR?: boolean };
    
    if (!filename || !data) {
      return NextResponse.json({ success: false, message: 'filename and data required' }, { status: 400 });
    }

    const match = String(data).match(/^data:(.+);base64,(.*)$/);
    const mimeType = match ? match[1] : 'application/octet-stream';
    const base64 = match ? match[2] : data;
    const buffer = Buffer.from(base64, 'base64');
    
    const file = new File([buffer], filename, { type: mimeType });
    const validation = validateUploadFile(file);
    if (!validation.valid || !validation.sanitizedName) {
      return NextResponse.json({ success: false, message: validation.message || 'Invalid file' }, { status: 400 });
    }

    if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) {
      // Vercel Blob Upload
      const pathname = isQR
        ? `images/qr-payment.png`
        : `uploads/${Date.now()}-${validation.sanitizedName}`;

      const blob = await put(pathname, buffer, {
        access: 'public',
        contentType: mimeType
      });

      if (isQR) {
        await pool.query(
          "INSERT INTO settings (key, value) VALUES ('qr_payment_url', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
          [blob.url]
        );
      }

      return NextResponse.json({ success: true, url: blob.url });
    } else {
      // Local fallback
      const uploadDir = isQR
        ? path.join(process.cwd(), 'public', 'images')
        : path.join(process.cwd(), 'public', 'uploads');

      ensureDir(uploadDir);

      const finalFilename = isQR ? 'qr-payment.png' : `${Date.now()}-${validation.sanitizedName}`;
      const filePath = path.join(uploadDir, finalFilename);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = isQR ? `/images/${finalFilename}` : `/uploads/${finalFilename}`;
      
      if (isQR) {
        await pool.query(
          "INSERT INTO settings (key, value) VALUES ('qr_payment_url', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
          [publicUrl]
        );
      }

      return NextResponse.json({ success: true, url: publicUrl });
    }

  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to upload file' }, { status: 500 });
  }
}

