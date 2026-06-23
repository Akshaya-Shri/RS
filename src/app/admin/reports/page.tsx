"use client";

import { useState, useEffect } from 'react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'supplier' | 'tin'>('daily');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    // Clear previous report data to prevent rendering mismatches when changing reportTypes
    setReportData(null);
    try {
      const query = `type=${reportType}&startDate=${startDate}&endDate=${endDate}`;
      const res = await fetch(`/api/admin/reports?${query}`);
      const json = await res.json();
      if (json.success) {
        setReportData(json.data);
      }
    } catch (e) {
      console.error('Failed to generate report:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, startDate, endDate]);

  // Client-side CSV Exporter
  const exportToCSV = (dataset: any[], filename: string) => {
    if (!dataset || dataset.length === 0) {
      alert('No data available to export.');
      return;
    }
    
    // Extract headers
    const headers = Object.keys(dataset[0]);
    const csvContent = [
      headers.join(','), // Header row
      ...dataset.map(item => 
        headers.map(header => {
          let val = item[header];
          if (val === null || val === undefined) return '""';
          if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
          return val;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="p-6 md:p-10 bg-neutral-50 min-h-[calc(100vh-80px)] flex flex-col gap-6 print:bg-white print:p-0">
      {/* Header Panel (Hidden on print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-800">Centralized Reports</h1>
          <p className="text-sm text-neutral-500 mt-1">Audit transaction logs, margins, inventory movements, and payables.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-sm flex items-center gap-2 border transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print Template
          </button>
        </div>
      </div>

      {/* Tabs list (Hidden on print) */}
      <div className="flex border-b border-neutral-200 gap-1 overflow-x-auto pb-1 print:hidden">
        {[
          { key: 'daily', label: 'Daily Logs' },
          { key: 'weekly', label: 'Weekly Summaries' },
          { key: 'monthly', label: 'Monthly Performance' },
          { key: 'supplier', label: 'Vendor Payables' },
          { key: 'tin', label: 'Container Tins' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setReportType(tab.key as any)}
            className={`px-4 py-2.5 font-bold text-sm border-b-2 whitespace-nowrap transition-all ${
              reportType === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-500 hover:text-primary hover:border-neutral-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter panel (Hidden on print) */}
      {['daily', 'weekly', 'monthly'].includes(reportType) && (
        <div className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-wrap gap-4 items-center print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-500 uppercase">From</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="border p-2 rounded-xl text-sm font-bold text-neutral-700"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-500 uppercase">To</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="border p-2 rounded-xl text-sm font-bold text-neutral-700"
            />
          </div>
          <button
            onClick={fetchReport}
            className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary/95 transition-all"
          >
            Refresh
          </button>
        </div>
      )}

      {/* Main Content Report Layout */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 flex-1 flex flex-col gap-6 print:border-none print:p-0 print:shadow-none">
        {/* Printable Header */}
        <div className="hidden print:block border-b pb-4">
          <h1 className="text-2xl font-black uppercase text-neutral-800">Revathi Store Oil Mill</h1>
          <p className="text-xs text-neutral-500">Centralized Audit Log &middot; Report Type: {reportType.toUpperCase()}</p>
          {['daily', 'weekly', 'monthly'].includes(reportType) && (
            <p className="text-xs text-neutral-500">Duration Range: {startDate} to {endDate}</p>
          )}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : !reportData ? (
          <div className="text-center py-16 text-neutral-400">No report data generated.</div>
        ) : (
          <div className="space-y-8 flex-1">
            {/* Daily Report Tables */}
            {reportType === 'daily' && (
              <>
                {/* Daily Sales */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center print:hidden">
                    <h3 className="text-base font-bold text-neutral-800">Sales Transactions</h3>
                    <button
                      onClick={() => exportToCSV(reportData?.sales || [], 'daily_sales')}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Export CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-neutral-50 text-neutral-500 font-bold">
                        <tr>
                          <th className="p-3">Invoice #</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Method</th>
                          <th className="p-3 text-right">Total Amount</th>
                          <th className="p-3 text-right">Logged At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!reportData?.sales || reportData.sales.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="text-center py-4 text-neutral-400">No sales transactions found.</td>
                          </tr>
                        ) : (
                          reportData.sales.map((s: any) => (
                            <tr key={s.id} className="border-b border-neutral-50 hover:bg-neutral-50/10">
                              <td className="p-3 font-bold text-neutral-800">{s.invoice_number}</td>
                              <td className="p-3">{s.customer_name}</td>
                              <td className="p-3 uppercase text-xs font-bold">{s.payment_type}</td>
                              <td className="p-3 text-right font-black">₹{parseFloat(s.total_amount).toFixed(2)}</td>
                              <td className="p-3 text-right text-xs text-neutral-400">{new Date(s.created_at).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Daily Profits (Margins) */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center print:hidden">
                    <h3 className="text-base font-bold text-neutral-800">Margin Breakdown (Profitability)</h3>
                    <button
                      onClick={() => exportToCSV(reportData?.profits || [], 'daily_profits')}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Export CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-neutral-50 text-neutral-500 font-bold">
                        <tr>
                          <th className="p-3">Invoice #</th>
                          <th className="p-3">Date</th>
                          <th className="p-3 text-right">Revenue</th>
                          <th className="p-3 text-right">Margin / Profit</th>
                          <th className="p-3 text-right">Margin %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!reportData?.profits || reportData.profits.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="text-center py-4 text-neutral-400">No profit logs found.</td>
                          </tr>
                        ) : (
                          reportData.profits.map((p: any, idx: number) => {
                            const rev = parseFloat(p.revenue || 0);
                            const prof = parseFloat(p.profit || 0);
                            const marginPercent = rev > 0 ? ((prof / rev) * 100).toFixed(1) : '0.0';
                            return (
                              <tr key={idx} className="border-b border-neutral-50 hover:bg-neutral-50/10">
                                <td className="p-3 font-bold text-neutral-800">{p.invoice_number}</td>
                                <td className="p-3">{p.date}</td>
                                <td className="p-3 text-right">₹{rev.toFixed(2)}</td>
                                <td className="p-3 text-right text-emerald-600 font-bold">₹{prof.toFixed(2)}</td>
                                <td className="p-3 text-right font-black text-neutral-600">{marginPercent}%</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Daily Stock movement */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center print:hidden">
                    <h3 className="text-base font-bold text-neutral-800">Inventory Stock Ledgers</h3>
                    <button
                      onClick={() => exportToCSV(reportData?.stockMovement || [], 'daily_stock_movement')}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Export CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-neutral-50 text-neutral-500 font-bold">
                        <tr>
                          <th className="p-3">Product Name</th>
                          <th className="p-3">Type</th>
                          <th className="p-3 text-right">Adjustment Quantity</th>
                          <th className="p-3">Reference</th>
                          <th className="p-3 text-right">Logged At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!reportData?.stockMovement || reportData.stockMovement.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="text-center py-4 text-neutral-400">No stock movement logged.</td>
                          </tr>
                        ) : (
                          reportData.stockMovement.map((m: any) => (
                            <tr key={m.id} className="border-b border-neutral-50 hover:bg-neutral-50/10">
                              <td className="p-3 font-semibold">{m.product_name}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  m.transaction_type === 'purchase' ? 'bg-green-50 text-green-700' :
                                  m.transaction_type === 'sale' ? 'bg-blue-50 text-blue-700' :
                                  'bg-amber-50 text-amber-700'
                                }`}>
                                  {m.transaction_type.toUpperCase()}
                                </span>
                              </td>
                              <td className={`p-3 text-right font-bold ${m.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                              </td>
                              <td className="p-3 text-xs text-neutral-500">
                                {m.reference_type} #{m.reference_id}
                              </td>
                              <td className="p-3 text-right text-xs text-neutral-400">{new Date(m.created_at).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Weekly Summaries */}
            {reportType === 'weekly' && (
              <>
                {/* Sales Summary */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center print:hidden">
                    <h3 className="text-base font-bold text-neutral-800">Weekly Revenue summaries</h3>
                    <button
                      onClick={() => exportToCSV(reportData?.salesSummary || [], 'weekly_sales_summary')}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Export CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-neutral-50 text-neutral-500 font-bold">
                        <tr>
                          <th className="p-3">Week Commencing</th>
                          <th className="p-3 text-center">Bills Count</th>
                          <th className="p-3 text-right">Aggregate Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!reportData?.salesSummary || reportData.salesSummary.length === 0) ? (
                          <tr>
                            <td colSpan={3} className="text-center py-4 text-neutral-400">No weekly logs found.</td>
                          </tr>
                        ) : (
                          reportData.salesSummary.map((w: any, idx: number) => (
                            <tr key={idx} className="border-b border-neutral-50 hover:bg-neutral-50/10">
                              <td className="p-3 font-bold text-neutral-800">{w.label}</td>
                              <td className="p-3 text-center">{w.total_sales}</td>
                              <td className="p-3 text-right font-black">₹{parseFloat(w.revenue).toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Suppliers purchases summary */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center print:hidden">
                    <h3 className="text-base font-bold text-neutral-800">Supplier Ledger Actions</h3>
                    <button
                      onClick={() => exportToCSV(reportData?.supplierSummary || [], 'weekly_supplier_summary')}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Export CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-neutral-50 text-neutral-500 font-bold">
                        <tr>
                          <th className="p-3">Vendor / Company</th>
                          <th className="p-3 text-right">Total Purchases</th>
                          <th className="p-3 text-right">Total Payments Made</th>
                          <th className="p-3 text-right">Net Flow change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!reportData?.supplierSummary || reportData.supplierSummary.length === 0) ? (
                          <tr>
                            <td colSpan={4} className="text-center py-4 text-neutral-400">No vendor activities logged.</td>
                          </tr>
                        ) : (
                          reportData.supplierSummary.map((s: any) => {
                            const purchases = parseFloat(s.total_purchases || 0);
                            const payments = parseFloat(s.total_payments || 0);
                            const diff = purchases - payments;
                            return (
                              <tr key={s.id} className="border-b border-neutral-50 hover:bg-neutral-50/10">
                                <td className="p-3 font-bold text-neutral-800">{s.company_name}</td>
                                <td className="p-3 text-right">₹{purchases.toFixed(2)}</td>
                                <td className="p-3 text-right text-emerald-600">₹{payments.toFixed(2)}</td>
                                <td className={`p-3 text-right font-black ${diff > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                  {diff > 0 ? `+₹${diff.toFixed(2)}` : `-₹${Math.abs(diff).toFixed(2)}`}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Monthly Reports */}
            {reportType === 'monthly' && (
              <>
                {/* Monthly Summary */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center print:hidden">
                    <h3 className="text-base font-bold text-neutral-800">Monthly Revenue & Profits</h3>
                    <button
                      onClick={() => exportToCSV(reportData?.monthlySummary || [], 'monthly_revenue_profits')}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Export CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-neutral-50 text-neutral-500 font-bold">
                        <tr>
                          <th className="p-3">Month</th>
                          <th className="p-3 text-center">Bills Count</th>
                          <th className="p-3 text-right">Total Revenue</th>
                          <th className="p-3 text-right">Net Profit Margin</th>
                          <th className="p-3 text-right">Net Margin %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!reportData?.monthlySummary || reportData.monthlySummary.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="text-center py-4 text-neutral-400">No monthly summaries.</td>
                          </tr>
                        ) : (
                          reportData.monthlySummary.map((m: any, idx: number) => {
                            const rev = parseFloat(m.revenue || 0);
                            const prof = parseFloat(m.profit || 0);
                            const marginPercent = rev > 0 ? ((prof / rev) * 100).toFixed(1) : '0.0';
                            return (
                              <tr key={idx} className="border-b border-neutral-50 hover:bg-neutral-50/10">
                                <td className="p-3 font-bold text-neutral-800">{new Date(m.label).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</td>
                                <td className="p-3 text-center">{m.total_sales}</td>
                                <td className="p-3 text-right font-semibold">₹{rev.toFixed(2)}</td>
                                <td className="p-3 text-right text-emerald-600 font-black">₹{prof.toFixed(2)}</td>
                                <td className="p-3 text-right font-black text-neutral-600">{marginPercent}%</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Monthly Product Sales levels */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center print:hidden">
                    <h3 className="text-base font-bold text-neutral-800">Product Sales Volume Metrics</h3>
                    <button
                      onClick={() => exportToCSV(reportData?.stockSummary || [], 'monthly_product_metrics')}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Export CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-neutral-50 text-neutral-500 font-bold">
                        <tr>
                          <th className="p-3">Product Name</th>
                          <th className="p-3">SKU</th>
                          <th className="p-3 text-center">Current Stock</th>
                          <th className="p-3 text-center">Quantity Sold</th>
                          <th className="p-3 text-right">Revenue Generated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!reportData?.stockSummary || reportData.stockSummary.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="text-center py-4 text-neutral-400">No product sales logged.</td>
                          </tr>
                        ) : (
                          reportData.stockSummary.map((p: any) => (
                            <tr key={p.id} className="border-b border-neutral-50 hover:bg-neutral-50/10">
                              <td className="p-3 font-bold text-neutral-800">{p.name}</td>
                              <td className="p-3 font-mono text-xs">{p.sku || 'N/A'}</td>
                              <td className={`p-3 text-center font-bold ${p.stock <= 5 ? 'text-red-500' : 'text-neutral-600'}`}>{p.stock}</td>
                              <td className="p-3 text-center font-bold text-neutral-700">{p.quantity_sold}</td>
                              <td className="p-3 text-right font-black">₹{parseFloat(p.revenue || 0).toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Supplier Payables Report */}
            {reportType === 'supplier' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center print:hidden">
                  <h3 className="text-base font-bold text-neutral-800">Outstanding Vendor Payables</h3>
                  <button
                    onClick={() => exportToCSV(reportData || [], 'supplier_payables')}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 text-neutral-500 font-bold">
                      <tr>
                        <th className="p-3">Vendor / Company</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3 text-right">Total purchases (₹)</th>
                        <th className="p-3 text-right">Total Payments (₹)</th>
                        <th className="p-3 text-right">Outstanding Payable Balance (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!reportData || reportData.length === 0) ? (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-neutral-400">No active vendor payables.</td>
                        </tr>
                      ) : (
                        reportData.map((s: any) => (
                          <tr key={s.id} className="border-b border-neutral-50 hover:bg-neutral-50/10">
                            <td className="p-3 font-bold text-neutral-800">{s.company_name}</td>
                            <td className="p-3 text-xs text-neutral-500">{s.phone || 'N/A'}</td>
                            <td className="p-3 text-right">₹{parseFloat(s.total_purchases || 0).toFixed(2)}</td>
                            <td className="p-3 text-right text-emerald-600">₹{parseFloat(s.total_payments || 0).toFixed(2)}</td>
                            <td className={`p-3 text-right font-black ${parseFloat(s.outstanding_balance) > 0 ? 'text-red-500' : 'text-green-600'}`}>
                              ₹{parseFloat(s.outstanding_balance).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Containers Tin Report */}
            {reportType === 'tin' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center print:hidden">
                  <h3 className="text-base font-bold text-neutral-800">Pending Customer Container Tins</h3>
                  <button
                    onClick={() => exportToCSV(reportData || [], 'customer_tin_report')}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 text-neutral-500 font-bold">
                      <tr>
                        <th className="p-3">Customer Name</th>
                        <th className="p-3">Mobile Contact</th>
                        <th className="p-3 text-center">Issued</th>
                        <th className="p-3 text-center">Returned</th>
                        <th className="p-3 text-right">Pending Returns (Tins)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!reportData || reportData.length === 0) ? (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-neutral-400">No pending returns found.</td>
                        </tr>
                      ) : (
                        reportData.map((t: any, idx: number) => (
                          <tr key={idx} className="border-b border-neutral-50 hover:bg-neutral-50/10">
                            <td className="p-3 font-bold text-neutral-800">{t.customer_name}</td>
                            <td className="p-3 text-xs text-neutral-500">{t.customer_mobile || 'N/A'}</td>
                            <td className="p-3 text-center">{t.issued}</td>
                            <td className="p-3 text-center text-emerald-600">{t.returned}</td>
                            <td className="p-3 text-right font-black text-amber-600">{t.balance} tins</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
