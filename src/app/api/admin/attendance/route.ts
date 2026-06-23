import { NextResponse } from 'next/server';
import pool from '@/lib/db';

function calculateHours(checkIn: string | null, checkOut: string | null): number {
  if (!checkIn || !checkOut) return 0;
  try {
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    
    if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) return 0;
    
    const diffMins = (outH * 60 + outM) - (inH * 60 + inM);
    return Math.max(0, parseFloat((diffMins / 60).toFixed(2)));
  } catch (e) {
    return 0;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date'); // 'YYYY-MM-DD'
    const month = searchParams.get('month'); // 'YYYY-MM'

    let query = 'SELECT * FROM attendance';
    const params: any[] = [];

    if (date) {
      query += ' WHERE date = $1';
      params.push(date);
    } else if (month) {
      query += " WHERE TO_CHAR(date, 'YYYY-MM') = $1";
      params.push(month);
    }

    query += ' ORDER BY date DESC, employee_name ASC';

    const result = await pool.query(query, params);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Failed to fetch attendance:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch attendance' }, { status: 500 });
  }
}

async function logAudit(action: string, entityType: string, entityId: number, performedBy: string) {
  try {
    await pool.query(
      'INSERT INTO audit_logs (action, entity_type, entity_id, performed_by) VALUES ($1, $2, $3, $4)',
      [action, entityType, entityId, performedBy]
    );
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

export async function POST(req: Request) {
  try {
    const { employee_name, date, check_in, check_out } = await req.json();

    if (!employee_name || !date) {
      return NextResponse.json({ success: false, message: 'Employee name and date are required' }, { status: 400 });
    }

    // Check if record already exists for this employee on this date
    const checkRes = await pool.query(
      'SELECT id, check_in, check_out FROM attendance WHERE employee_name = $1 AND date = $2',
      [employee_name, date]
    );

    let result;
    const workingHours = calculateHours(check_in, check_out);

    if (checkRes.rows.length > 0) {
      // Update existing record
      const record = checkRes.rows[0];
      const updatedCheckIn = check_in !== undefined ? check_in : record.check_in;
      const updatedCheckOut = check_out !== undefined ? check_out : record.check_out;
      const updatedWorkingHours = calculateHours(updatedCheckIn, updatedCheckOut);

      result = await pool.query(
        `UPDATE attendance 
         SET check_in = $1, check_out = $2, working_hours = $3
         WHERE id = $4 RETURNING *`,
        [updatedCheckIn, updatedCheckOut, updatedWorkingHours, record.id]
      );
      await logAudit('Update Attendance', 'attendance', record.id, 'admin');
      console.log(`Updated attendance for ${employee_name} on ${date}`);
    } else {
      // Insert new record
      result = await pool.query(
        `INSERT INTO attendance (employee_name, date, check_in, check_out, working_hours)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [employee_name, date, check_in || null, check_out || null, workingHours]
      );
      await logAudit('Insert Attendance', 'attendance', result.rows[0].id, 'admin');
      console.log(`Inserted attendance for ${employee_name} on ${date}`);
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Failed to log attendance:', error);
    return NextResponse.json({ success: false, message: 'Failed to log attendance' }, { status: 500 });
  }
}
