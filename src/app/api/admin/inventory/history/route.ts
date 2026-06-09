import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const AUDIT_FILE = path.join(process.cwd(), 'src/data/inventory_audit.json');

function readAudit() {
  try {
    const data = fs.readFileSync(AUDIT_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    const audit = readAudit();
    // newest first
    audit.sort((a: any, b: any) => new Date(b.at).getTime() - new Date(a.at).getTime());

    const items = Number.isFinite(limit) && limit > 0 ? audit.slice(0, limit) : audit;

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error('Failed to read inventory audit:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch audit history' }, { status: 500 });
  }
}
