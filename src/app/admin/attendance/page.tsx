"use client";

import { useState, useEffect } from 'react';

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // 'YYYY-MM'
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [monthlyList, setMonthlyList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [employeeName, setEmployeeName] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Suggest list from unique employee names in historical attendance
  const [knownEmployees, setKnownEmployees] = useState<string[]>([]);

  const fetchDailyAttendance = async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/attendance?date=${dateStr}`);
      const json = await res.json();
      if (json.success) {
        setAttendanceList(json.data);
      }
    } catch (e) {
      console.error('Failed to load daily attendance:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyAttendance = async (monthStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/attendance?month=${monthStr}`);
      const json = await res.json();
      if (json.success) {
        setMonthlyList(json.data);
      }
    } catch (e) {
      console.error('Failed to load monthly attendance:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchKnownEmployees = async () => {
    try {
      const res = await fetch('/api/admin/attendance');
      const json = await res.json();
      if (json.success) {
        const names: string[] = Array.from(new Set(json.data.map((r: any) => r.employee_name)));
        setKnownEmployees(names);
      }
    } catch (e) {
      console.error('Failed to load historical employees:', e);
    }
  };

  useEffect(() => {
    fetchKnownEmployees();
  }, []);

  useEffect(() => {
    if (viewMode === 'daily') {
      fetchDailyAttendance(selectedDate);
    } else {
      fetchMonthlyAttendance(selectedMonth);
    }
  }, [selectedDate, selectedMonth, viewMode]);

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_name: employeeName.trim(),
          date: selectedDate,
          check_in: checkInTime || null,
          check_out: checkOutTime || null
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setEmployeeName('');
        setCheckInTime('');
        setCheckOutTime('');
        fetchDailyAttendance(selectedDate);
        fetchKnownEmployees();
      } else {
        alert(json.message || 'Failed to record attendance');
      }
    } catch (err) {
      console.error('Error logging attendance:', err);
      alert('Error saving attendance record');
    } finally {
      setSubmitting(false);
    }
  };

  // Group monthly logs for summary view (total hours, total days worked)
  const getMonthlySummary = () => {
    const summary: { [key: string]: { days: number; hours: number } } = {};
    monthlyList.forEach((r: any) => {
      if (!summary[r.employee_name]) {
        summary[r.employee_name] = { days: 0, hours: 0 };
      }
      summary[r.employee_name].days += 1;
      summary[r.employee_name].hours += parseFloat(r.working_hours || 0);
    });
    return Object.entries(summary).map(([name, stats]) => ({
      name,
      days: stats.days,
      hours: parseFloat(stats.hours.toFixed(2))
    }));
  };

  return (
    <main className="p-6 md:p-10 bg-neutral-50 min-h-[calc(100vh-80px)] flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-800">Employee Attendance</h1>
          <p className="text-sm text-neutral-500 mt-1">Track worker check-ins, check-outs, and total working hours.</p>
        </div>

        {/* View Mode Switcher */}
        <div className="bg-white p-1 rounded-xl border border-neutral-200 flex self-start">
          <button
            onClick={() => setViewMode('daily')}
            className={`px-4 py-2 font-bold text-xs rounded-lg transition-all ${
              viewMode === 'daily' ? 'bg-primary text-white shadow-sm' : 'text-neutral-500 hover:text-primary'
            }`}
          >
            Daily Sheet
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-4 py-2 font-bold text-xs rounded-lg transition-all ${
              viewMode === 'monthly' ? 'bg-primary text-white shadow-sm' : 'text-neutral-500 hover:text-primary'
            }`}
          >
            Monthly Payroll Summary
          </button>
        </div>
      </div>

      {/* Daily Mode View */}
      {viewMode === 'daily' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Controls & Actions Sidebar */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 flex flex-col gap-4 lg:col-span-1">
            <h3 className="text-lg font-bold text-neutral-800 border-b pb-2">Daily Sheet Controls</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Selected Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full border p-2.5 rounded-xl text-sm font-bold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <button
                onClick={() => {
                  setEmployeeName('');
                  setCheckInTime('09:00');
                  setCheckOutTime('18:00');
                  setShowAddModal(true);
                }}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl text-sm shadow-md hover:bg-primary/95 transition-all flex justify-center items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Log Attendance / Clock-In
              </button>
            </div>

            {/* Quick tips */}
            <div className="mt-auto bg-neutral-50 p-4 rounded-xl text-xs text-neutral-500 border border-neutral-100">
              <h5 className="font-bold text-neutral-700 mb-1">Tip:</h5>
              <p className="leading-relaxed">Adding a record with the same name on the same date will automatically overwrite/update the check-in & check-out times and recalculate the total hours.</p>
            </div>
          </div>

          {/* Daily Table Panel */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 lg:col-span-2 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-neutral-800">
                Attendance List: <span className="text-neutral-500">{new Date(selectedDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
              </h3>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : attendanceList.length === 0 ? (
              <div className="text-center py-16 text-neutral-400">
                <svg className="w-16 h-16 mx-auto opacity-30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h4 className="font-bold text-neutral-600">No records found</h4>
                <p className="text-xs text-neutral-400 mt-1">No attendance logs have been recorded for this date yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-neutral-100 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 text-neutral-500 font-bold">
                    <tr>
                      <th className="p-3">Employee Name</th>
                      <th className="p-3 text-center">Check-In</th>
                      <th className="p-3 text-center">Check-Out</th>
                      <th className="p-3 text-right">Working Hours</th>
                      <th className="p-3 text-center print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceList.map((log: any) => (
                      <tr key={log.id} className="border-b border-neutral-50 hover:bg-neutral-50/20">
                        <td className="p-3 font-bold text-neutral-800">{log.employee_name}</td>
                        <td className="p-3 text-center font-semibold text-neutral-600">
                          {log.check_in ? log.check_in.substring(0, 5) : '—'}
                        </td>
                        <td className="p-3 text-center font-semibold text-neutral-600">
                          {log.check_out ? log.check_out.substring(0, 5) : '—'}
                        </td>
                        <td className="p-3 text-right font-black text-emerald-600">
                          {parseFloat(log.working_hours || 0)} hrs
                        </td>
                        <td className="p-3 text-center print:hidden">
                          <button
                            onClick={() => {
                              setEmployeeName(log.employee_name);
                              setCheckInTime(log.check_in ? log.check_in.substring(0, 5) : '');
                              setCheckOutTime(log.check_out ? log.check_out.substring(0, 5) : '');
                              setShowAddModal(true);
                            }}
                            className="text-xs font-bold text-primary hover:underline"
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Monthly Mode View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Controls Sidebar */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 flex flex-col gap-4 lg:col-span-1">
            <h3 className="text-lg font-bold text-neutral-800 border-b pb-2">Monthly Selector</h3>
            
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Selected Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full border p-2.5 rounded-xl text-sm font-bold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="bg-neutral-50 p-4 rounded-xl text-xs text-neutral-500 border border-neutral-100 mt-auto">
              <h5 className="font-bold text-neutral-700 mb-1">Payroll Tip:</h5>
              <p className="leading-relaxed">This totals up the daily logs within the month to show the sum of working hours and total active days. Great for computing hourly or daily wages.</p>
            </div>
          </div>

          {/* Monthly Summary Table Panel */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 lg:col-span-2 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-neutral-800">
                Summary for Month: <span className="text-neutral-500">{selectedMonth}</span>
              </h3>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : getMonthlySummary().length === 0 ? (
              <div className="text-center py-16 text-neutral-400">
                <h4 className="font-bold text-neutral-600">No monthly summary</h4>
                <p className="text-xs text-neutral-400 mt-1">No attendance records were logged in this month.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-neutral-100 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 text-neutral-500 font-bold">
                    <tr>
                      <th className="p-3">Employee Name</th>
                      <th className="p-3 text-center">Days Worked</th>
                      <th className="p-3 text-right">Aggregate Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getMonthlySummary().map((emp: any, idx: number) => (
                      <tr key={idx} className="border-b border-neutral-50 hover:bg-neutral-50/20">
                        <td className="p-3 font-bold text-neutral-800">{emp.name}</td>
                        <td className="p-3 text-center font-bold text-neutral-600">{emp.days} days</td>
                        <td className="p-3 text-right font-black text-emerald-600">
                          {emp.hours} hrs
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Update Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-neutral-800 mb-2">Record Daily Attendance</h3>
            <p className="text-xs text-neutral-400 mb-4">Date: <strong>{selectedDate}</strong></p>
            
            <form onSubmit={handleSubmitAttendance} className="space-y-4">
              {/* Employee Name */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Employee Name *</label>
                <input
                  type="text"
                  required
                  list="employeesList"
                  placeholder="e.g. Ramesh Kumar"
                  value={employeeName}
                  onChange={e => setEmployeeName(e.target.value)}
                  className="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
                />
                <datalist id="employeesList">
                  {knownEmployees.map(name => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              {/* Check-In */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Check-In Time</label>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={e => setCheckInTime(e.target.value)}
                  className="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 font-mono"
                />
              </div>

              {/* Check-Out */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Check-Out Time</label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={e => setCheckOutTime(e.target.value)}
                  className="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 font-mono"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-neutral-500 font-bold hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/95"
                >
                  {submitting ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
