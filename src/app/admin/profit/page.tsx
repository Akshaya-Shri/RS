"use client";

import { useState, useEffect } from 'react';

export default function ProfitPage() {
  const [data, setData] = useState<any>(null);
  const [range, setRange] = useState('daily');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfitData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/profit?range=${range}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (e) {
        console.error('Failed to load profit reports:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchProfitData();
  }, [range]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const cards = data?.cards || {
    todayProfit: 0,
    todayRevenue: 0,
    monthlyProfit: 0,
    monthlyRevenue: 0,
    topProducts: []
  };

  const trends = data?.trends || [];

  // SVG Chart Helper
  const chartHeight = 150;
  const chartWidth = 500;
  const padding = 20;

  const maxVal = Math.max(
    ...trends.map((t: any) => Math.max(parseFloat(t.revenue || 0), parseFloat(t.profit || 0))),
    1000
  );

  const getPoints = (key: 'revenue' | 'profit') => {
    if (trends.length < 2) return '';
    return trends
      .map((t: any, index: number) => {
        const x = padding + (index * (chartWidth - padding * 2)) / (trends.length - 1);
        const y = chartHeight - padding - (parseFloat(t[key] || 0) * (chartHeight - padding * 2)) / maxVal;
        return `${x},${y}`;
      })
      .join(' ');
  };

  const revenuePoints = getPoints('revenue');
  const profitPoints = getPoints('profit');

  return (
    <main className="p-6 md:p-10 bg-neutral-50 min-h-[calc(100vh-80px)] space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-800">Profit Insights</h1>
          <p className="text-sm text-neutral-500 mt-1">Analyze store profit margins, track top selling products, and audit earnings history.</p>
        </div>

        {/* Filter Range */}
        <div className="flex border bg-white rounded-xl p-1 shadow-sm">
          {['daily', 'weekly', 'monthly', 'product'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-lg font-bold text-xs capitalize transition-colors ${
                range === r ? 'bg-primary text-white' : 'text-neutral-500 hover:text-primary'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Today's Profit Margin</span>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-emerald-600">₹{cards.todayProfit.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-neutral-400 mt-1">On sales of ₹{cards.todayRevenue.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Monthly Cumulative Profit</span>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-primary">₹{cards.monthlyProfit.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-neutral-400 mt-1">On sales of ₹{cards.monthlyRevenue.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Average Profitability</span>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-neutral-800">
              {cards.monthlyRevenue > 0 ? `${((cards.monthlyProfit / cards.monthlyRevenue) * 100).toFixed(1)}%` : '0%'}
            </h3>
            <p className="text-xs text-neutral-400 mt-1">Net profit margin percentage this month</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-neutral-800 text-lg">Profitability Growth curve</h3>
            <p className="text-xs text-neutral-400">Comparing gross revenue vs net margins ({range} trend)</p>
          </div>

          <div className="my-8 flex justify-center">
            {loading ? (
              <div className="h-[150px] flex items-center justify-center text-neutral-400 animate-pulse">Loading trend mapping...</div>
            ) : trends.length < 2 ? (
              <div className="h-[150px] flex items-center justify-center text-neutral-400">Not enough data to map trends</div>
            ) : (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[180px]">
                <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#f0f0f0" strokeDasharray="3" />
                <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#f0f0f0" strokeDasharray="3" />
                <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#e5e5e5" />
                <polyline fill="none" stroke="#3b82f6" strokeWidth="3" points={revenuePoints} />
                <polyline fill="none" stroke="#10b981" strokeWidth="3" points={profitPoints} />
                {trends.map((t: any, idx: number) => {
                  const x = padding + (idx * (chartWidth - padding * 2)) / (trends.length - 1);
                  const revY = chartHeight - padding - (parseFloat(t.revenue || 0) * (chartHeight - padding * 2)) / maxVal;
                  const profY = chartHeight - padding - (parseFloat(t.profit || 0) * (chartHeight - padding * 2)) / maxVal;
                  return (
                    <g key={idx}>
                      <circle cx={x} cy={revY} r="3.5" fill="#3b82f6" stroke="white" strokeWidth="1" />
                      <circle cx={x} cy={profY} r="3.5" fill="#10b981" stroke="white" strokeWidth="1" />
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          <div className="flex gap-6 text-xs font-bold border-t pt-4">
            <span className="flex items-center gap-2 text-blue-600">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              Gross Revenue
            </span>
            <span className="flex items-center gap-2 text-emerald-600">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              Net Profit
            </span>
            <span className="ml-auto text-neutral-400">Max Scale: ₹{Math.round(maxVal)}</span>
          </div>
        </div>

        {/* Top profit products card */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col gap-4">
          <h3 className="font-bold text-neutral-800 text-lg">Top Earning Products</h3>
          <p className="text-xs text-neutral-400 -mt-2">Products generating maximum profits</p>

          <div className="space-y-4 flex-1">
            {cards.topProducts.length === 0 ? (
              <div className="text-center py-12 text-neutral-400 text-sm">No sales data logged yet.</div>
            ) : (
              cards.topProducts.map((p: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100/60 transition-colors">
                  <div>
                    <h4 className="font-bold text-sm text-neutral-800">{p.name}</h4>
                    <p className="text-xs text-neutral-500">Quantity Sold: {p.quantity_sold}L</p>
                  </div>
                  <div className="text-right font-black text-emerald-600 text-sm">
                    +₹{parseFloat(p.profit).toLocaleString('en-IN')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Historical profit ledger */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <h3 className="font-bold text-neutral-800 text-lg mb-6">Historical profit margins ledger</h3>
        
        {trends.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">No records found.</div>
        ) : (
          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-500 font-bold">
                <tr>
                  <th className="p-3">Timeline Range</th>
                  <th className="p-3 text-right">Gross revenue (₹)</th>
                  <th className="p-3 text-right">Net Profit (₹)</th>
                  <th className="p-3 text-right">Margin percentage</th>
                </tr>
              </thead>
              <tbody>
                {[...trends].reverse().map((t: any, index: number) => {
                  const profitAmt = parseFloat(t.profit || 0);
                  const revAmt = parseFloat(t.revenue || 0);
                  const percent = revAmt > 0 ? ((profitAmt / revAmt) * 100).toFixed(1) : '0';
                  return (
                    <tr key={index} className="border-b border-neutral-50 hover:bg-neutral-50/20">
                      <td className="p-3 font-semibold text-neutral-800">
                        {range === 'daily' ? new Date(t.label).toLocaleDateString() :
                         range === 'weekly' ? `Week of ${new Date(t.label).toLocaleDateString()}` :
                         range === 'monthly' ? new Date(t.label).toLocaleDateString([], { year: 'numeric', month: 'long' }) :
                         t.label}
                      </td>
                      <td className="p-3 text-right font-bold text-neutral-700">₹{revAmt.toFixed(2)}</td>
                      <td className="p-3 text-right font-black text-emerald-600">₹{profitAmt.toFixed(2)}</td>
                      <td className="p-3 text-right text-xs font-bold text-neutral-500">{percent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
