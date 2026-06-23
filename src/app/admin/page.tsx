"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/admin/dashboard');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (e) {
        console.error('Failed to load dashboard metrics:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const widgets = data?.widgets || {
    todaySales: 0,
    todayBills: 0,
    todayProfit: 0,
    currentStockValue: 0,
    lowStockCount: 0,
    supplierOutstanding: 0,
    pendingTins: 0
  };

  const trends = data?.trends || [];
  const stockMovement = data?.stockMovement || [];
  const recentBills = data?.recentBills || [];

  // SVG Chart Helper Calculations
  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 20;

  // Find max value for chart scaling
  const maxVal = Math.max(
    ...trends.map((t: any) => Math.max(parseFloat(t.revenue || 0), parseFloat(t.profit || 0))),
    1000
  );

  const getPoints = (key: 'revenue' | 'profit') => {
    if (trends.length < 2) return '';
    return trends
      .map((t: any, index: number) => {
        const x = padding + (index * (chartWidth - padding * 2)) / (trends.length - 1);
        const y = chartHeight - 25 - (parseFloat(t[key] || 0) * (chartHeight - padding - 25)) / maxVal;
        return `${x},${y}`;
      })
      .join(' ');
  };

  const getAreaPoints = (key: 'revenue' | 'profit') => {
    if (trends.length < 2) return '';
    const pointsStr = getPoints(key);
    if (!pointsStr) return '';
    const startX = padding;
    const startY = chartHeight - 25;
    const endX = padding + ((trends.length - 1) * (chartWidth - padding * 2)) / (trends.length - 1);
    const endY = chartHeight - 25;
    return `${startX},${startY} ${pointsStr} ${endX},${endY}`;
  };

  const revenuePoints = getPoints('revenue');
  const profitPoints = getPoints('profit');
  const revenueAreaPoints = getAreaPoints('revenue');
  const profitAreaPoints = getAreaPoints('profit');

  return (
    <main className="p-6 md:p-10 flex-1 bg-neutral-50 space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-800">ERP Control Center</h1>
          <p className="text-sm text-neutral-500 mt-1">Real-time store metrics, profit summaries, and ledger statuses.</p>
        </div>
        <Link href="/admin/sales/new" className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-primary/95 transition-all">
          + Create New Bill
        </Link>
      </div>

      {/* Grid of Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Sales */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider">Today's Sales</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-neutral-800">₹{widgets.todaySales.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-neutral-500 mt-1">{widgets.todayBills} bills generated today</p>
          </div>
        </div>

        {/* Today's Profit */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider">Today's Profit</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-emerald-600">₹{widgets.todayProfit.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-neutral-500 mt-1">Margin calculated on cost rate</p>
          </div>
        </div>

        {/* Current Stock Value */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider">Stock Valuation</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14v14m0-14L4 7m0 0v10l8 4" /></svg>
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-neutral-800">₹{widgets.currentStockValue.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-red-500 font-bold mt-1">{widgets.lowStockCount} items in low stock</p>
          </div>
        </div>

        {/* Supplier Outstanding */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider">Payables Outstanding</span>
            <span className="p-1.5 bg-red-50 text-red-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-red-600">₹{widgets.supplierOutstanding.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-neutral-500 mt-1">{widgets.pendingTins} pending return tins</p>
          </div>
        </div>
      </div>

      {/* Main Charts & History Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-800">Sales & Profit Trends</h3>
            <p className="text-xs text-neutral-400">Daily business overview (Last 10 days)</p>
          </div>
          
          <div className="my-6 flex justify-center w-full">
            {trends.length < 2 ? (
              <div className="h-[160px] flex items-center justify-center text-neutral-400">Not enough data to map trends</div>
            ) : (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[200px]">
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Lines */}
                <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#f5f5f5" strokeDasharray="3" />
                <line x1={padding} y1={(chartHeight - 25) / 2} x2={chartWidth - padding} y2={(chartHeight - 25) / 2} stroke="#f5f5f5" strokeDasharray="3" />
                <line x1={padding} y1={chartHeight - 25} x2={chartWidth - padding} y2={chartHeight - 25} stroke="#e5e5e5" strokeWidth="1.5" />

                {/* Filled Areas under lines */}
                {revenueAreaPoints && <polygon fill="url(#colorRevenue)" points={revenueAreaPoints} />}
                {profitAreaPoints && <polygon fill="url(#colorProfit)" points={profitAreaPoints} />}

                {/* Revenue Polyline (Blue) */}
                <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" points={revenuePoints} />
                
                {/* Profit Polyline (Green) */}
                <polyline fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" points={profitPoints} />

                {/* Markers & Grid Labels */}
                {trends.map((t: any, idx: number) => {
                  const x = padding + (idx * (chartWidth - padding * 2)) / (trends.length - 1);
                  const revY = chartHeight - 25 - (parseFloat(t.revenue || 0) * (chartHeight - padding - 25)) / maxVal;
                  const profY = chartHeight - 25 - (parseFloat(t.profit || 0) * (chartHeight - padding - 25)) / maxVal;
                  const dateStr = new Date(t.date_label).toLocaleDateString([], { month: 'short', day: 'numeric' });
                  
                  return (
                    <g key={idx}>
                      <circle cx={x} cy={revY} r="3" fill="#3b82f6" stroke="white" strokeWidth="1" />
                      <circle cx={x} cy={profY} r="3" fill="#10b981" stroke="white" strokeWidth="1" />
                      {/* X-axis labels */}
                      <text x={x} y={chartHeight - 6} textAnchor="middle" className="text-[9px] fill-neutral-400 font-bold font-sans">
                        {dateStr}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          <div className="flex gap-6 text-xs font-bold border-t pt-4">
            <span className="flex items-center gap-2 text-blue-600">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              Revenue Trend
            </span>
            <span className="flex items-center gap-2 text-emerald-600">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              Profit Trend
            </span>
            <span className="ml-auto text-neutral-400">Max Scale: ₹{Math.round(maxVal)}</span>
          </div>
        </div>

        {/* Recent Bills */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-neutral-800">Recent Bills</h3>
            <Link href="/admin/reports" className="text-xs text-primary font-bold hover:underline">View All</Link>
          </div>

          {recentBills.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 text-sm">No bills generated today.</div>
          ) : (
            <div className="space-y-4">
              {recentBills.map((b: any) => (
                <div key={b.id} className="flex justify-between items-center p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100/60 transition-colors">
                  <div>
                    <h4 className="font-bold text-sm text-neutral-800">{b.invoice_number}</h4>
                    <p className="text-xs text-neutral-500">{b.customer_name} &middot; {b.payment_type.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-neutral-800 text-sm">₹{parseFloat(b.total_amount).toFixed(2)}</span>
                    <p className="text-[10px] text-neutral-400">{new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stock Ledger History */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
        <h3 className="text-lg font-bold text-neutral-800 mb-6">Recent Stock Movement (Audit Log)</h3>
        
        {stockMovement.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-sm">No inventory updates logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-500 font-bold">
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Transaction</th>
                  <th className="pb-3 text-right">Quantity</th>
                  <th className="pb-3">Reference</th>
                  <th className="pb-3 text-right">Date / Time</th>
                </tr>
              </thead>
              <tbody>
                {stockMovement.map((log: any) => (
                  <tr key={log.id} className="border-b border-neutral-50/50 hover:bg-neutral-50/30 transition-colors">
                    <td className="py-3 font-semibold text-neutral-800">{log.product_name}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        log.transaction_type === 'purchase' ? 'bg-green-50 text-green-700' :
                        log.transaction_type === 'sale' ? 'bg-blue-50 text-blue-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {log.transaction_type.toUpperCase()}
                      </span>
                    </td>
                    <td className={`py-3 text-right font-bold ${log.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                    </td>
                    <td className="py-3 text-neutral-600 text-xs">
                      {log.reference_type === 'sale' ? `Invoice #${log.reference_id}` :
                       log.reference_type === 'purchase' ? `Purchase #${log.reference_id}` :
                       'Manual Adjustment'}
                    </td>
                    <td className="py-3 text-right text-xs text-neutral-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
