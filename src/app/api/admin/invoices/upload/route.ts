import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const invoiceNumber = formData.get('invoice_number') as string;

    if (!file || !invoiceNumber) {
      return NextResponse.json({ success: false, message: 'File and invoice number are required' }, { status: 400 });
    }

    // Ensure public/invoices folder exists
    const uploadDir = path.join(process.cwd(), 'public', 'invoices');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save PDF file
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    
    fs.writeFileSync(filePath, buffer);
    const pdfUrl = `/invoices/${fileName}`;

    // Update pdf_url in invoices table
    await pool.query(
      'UPDATE invoices SET pdf_url = $1 WHERE invoice_number = $2',
      [pdfUrl, invoiceNumber]
    );

    return NextResponse.json({ success: true, pdfUrl });
  } catch (error) {
    console.error('Invoice upload failed:', error);
    return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
  }
}
