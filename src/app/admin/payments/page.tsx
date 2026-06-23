"use client";

import { useState, useEffect } from 'react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [collectorName, setCollectorName] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, suppliersRes] = await Promise.all([
        fetch('/api/admin/payments'),
        fetch('/api/admin/suppliers')
      ]);

      const [paymentsJson, suppliersJson] = await Promise.all([
        paymentsRes.json(),
        suppliersRes.json()
      ]);

      if (paymentsJson.success) setPayments(paymentsJson.data);
      if (suppliersJson.success) setSuppliers(suppliersJson.data);
    } catch (e) {
      console.error('Failed to load payments details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId || !amountPaid) {
      alert('Please fill out all fields');
      return;
    }

    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: parseInt(supplierId, 10),
          amount_paid: parseFloat(amountPaid),
          payment_method: paymentMethod,
          collector_name: collectorName
        })
      });

      const json = await res.json();
      if (json.success) {
        setShowAddForm(false);
        setSupplierId('');
        setAmountPaid('');
        setCollectorName('');
        fetchData();
      } else {
        alert(json.message || 'Failed to record payment');
      }
    } catch (e) {
      alert('Error recording payment');
    }
  };

  // Find selected supplier outstanding for UX context
  const selectedSupplierObj = suppliers.find(s => s.id.toString() === supplierId);
  const selectedOutstanding = selectedSupplierObj ? parseFloat(selectedSupplierObj.outstanding_balance) : 0;

  return (
    <main className="p-6 md:p-10 bg-neutral-50 min-h-[calc(100vh-80px)] space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-800">Supplier Payments</h1>
          <p className="text-sm text-neutral-500 mt-1">Record supplier payout transactions, update balances, and print receipt entries.</p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-xl shadow-md hover:bg-green-700 transition-all"
          >
            + Record New Payment
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-6 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex justify-between items-center border-b pb-4">
            <h3 className="text-lg font-bold text-neutral-800">Record Vendor Disbursement</h3>
            <button onClick={() => setShowAddForm(false)} className="text-neutral-400 hover:text-neutral-600">Cancel</button>
          </div>

          <form onSubmit={handleSubmitPayment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Select Supplier *</label>
                <select
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  required
                  className="w-full border p-2.5 rounded-xl text-sm bg-white"
                >
                  <option value="">-- Choose Vendor --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.company_name} (O/S: ₹{parseFloat(s.outstanding_balance).toFixed(2)})</option>
                  ))}
                </select>
                {supplierId && (
                  <p className="text-xs text-neutral-500 mt-1">
                    Current Outstanding Balance: <strong className="text-red-500">₹{selectedOutstanding.toFixed(2)}</strong>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Amount Paid (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  required
                  placeholder="e.g. 10000"
                  className="w-full border p-2.5 rounded-xl text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  required
                  className="w-full border p-2.5 rounded-xl text-sm bg-white"
                >
                  <option value="upi">UPI (GPay/PhonePe/Paytm)</option>
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer (NEFT/IMPS)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Collector Name / Note</label>
                <input
                  type="text"
                  value={collectorName}
                  onChange={e => setCollectorName(e.target.value)}
                  placeholder="Name of agent who received payment"
                  className="w-full border p-2.5 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end border-t pt-4">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 border rounded-xl text-neutral-500 font-bold hover:bg-neutral-50 text-sm">Cancel</button>
              <button type="submit" className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 text-sm">Record Payment & Debit Balance</button>
            </div>
          </form>
        </div>
      )}

      {/* Payments History List */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <h3 className="text-lg font-bold text-neutral-800 mb-6">Payment Registry History</h3>
        
        {loading ? (
          <div className="text-center py-12 text-neutral-400">Loading history...</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">No payments recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-500 font-bold">
                  <th className="pb-3">Payment ID</th>
                  <th className="pb-3">Vendor / Supplier</th>
                  <th className="pb-3">Disbursement Date</th>
                  <th className="pb-3">Channel / Method</th>
                  <th className="pb-3">Collector Name</th>
                  <th className="pb-3 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-neutral-50 hover:bg-neutral-50/30 transition-colors">
                    <td className="py-3.5 font-bold text-neutral-800">#PAY-{p.id.toString().padStart(4, '0')}</td>
                    <td className="py-3.5 font-semibold text-neutral-800">{p.supplier_name}</td>
                    <td className="py-3.5 text-neutral-500">{new Date(p.created_at).toLocaleString()}</td>
                    <td className="py-3.5">
                      <span className="px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-xs font-bold uppercase">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="py-3.5 text-neutral-600">{p.collector_name || 'N/A'}</td>
                    <td className="py-3.5 text-right font-black text-green-600">₹{parseFloat(p.amount_paid).toFixed(2)}</td>
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
