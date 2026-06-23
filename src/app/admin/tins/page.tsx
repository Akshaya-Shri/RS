"use client";

import { useState, useEffect } from 'react';

export default function TinManagementPage() {
  const [data, setData] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [transactionType, setTransactionType] = useState<'issue' | 'return'>('issue');
  const [quantity, setQuantity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Fetch Tins data
  const fetchTinsData = async () => {
    try {
      const res = await fetch('/api/admin/tins');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error('Failed to load tins data:', e);
    }
  };

  // Fetch Customers for select
  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/admin/customers');
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data);
      }
    } catch (e) {
      console.error('Failed to load customers:', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchTinsData(), fetchCustomers()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleLogTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !transactionType || !quantity) return;

    const qtyVal = parseInt(quantity);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      alert('Please enter a valid quantity greater than 0');
      return;
    }

    // Validate returns
    if (transactionType === 'return') {
      const customerBal = data?.customerBalances?.find(
        (cb: any) => cb.customer_id === parseInt(selectedCustomerId)
      );
      const currentBalance = customerBal ? customerBal.balance : 0;
      if (qtyVal > currentBalance) {
        alert(`Cannot return ${qtyVal} tins. Customer only has a pending balance of ${currentBalance} tins.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/tins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: parseInt(selectedCustomerId),
          transaction_type: transactionType,
          quantity: qtyVal
        })
      });
      const json = await res.json();
      if (json.success) {
        setQuantity('');
        setSelectedCustomerId('');
        await fetchTinsData();
      } else {
        alert(json.message || 'Failed to log tin transaction');
      }
    } catch (error) {
      console.error('Error logging transaction:', error);
      alert('Error logging tin transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter customers for dropdown/selection autocomplete
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    c.mobile.includes(customerSearchQuery)
  );

  // Filter active balances in display table
  const filteredBalances = data?.customerBalances?.filter((cb: any) =>
    cb.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cb.customer_mobile.includes(searchQuery)
  ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalPending = data?.totalPending || 0;
  const recentTransactions = data?.recentTransactions || [];

  return (
    <main className="p-6 md:p-10 bg-neutral-50 min-h-[calc(100vh-80px)] flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-800">Tin Management</h1>
          <p className="text-sm text-neutral-500 mt-1">Track full tin distributions and empty returns for oil containers.</p>
        </div>
        <div className="bg-amber-50 border border-amber-200/80 px-5 py-3 rounded-2xl flex items-center gap-3">
          <div className="p-2 bg-amber-500 text-white rounded-xl">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14v14m0-14L4 7m0 0v10l8 4" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-amber-600 tracking-wider">Total Pending Returns</span>
            <h2 className="text-2xl font-black text-amber-700">{totalPending} tins</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Log Transaction Panel */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 flex flex-col gap-4 lg:col-span-1">
          <h3 className="text-lg font-bold text-neutral-800 border-b pb-2">Log Tin Transaction</h3>
          
          <form onSubmit={handleLogTransaction} className="space-y-4">
            {/* Customer Selection */}
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Select Customer *</label>
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Filter customers list..."
                  value={customerSearchQuery}
                  onChange={e => setCustomerSearchQuery(e.target.value)}
                  className="w-full border p-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <select
                required
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full border p-2.5 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/20"
              >
                <option value="">-- Choose Customer --</option>
                {filteredCustomers.map(c => {
                  const customerBalObj = data?.customerBalances?.find((cb: any) => cb.customer_id === c.id);
                  const bal = customerBalObj ? customerBalObj.balance : 0;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.mobile}) - Current Pending: {bal}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Transaction Type */}
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Transaction Type *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTransactionType('issue')}
                  className={`py-3 font-bold rounded-xl text-sm transition-all border ${
                    transactionType === 'issue'
                      ? 'bg-amber-500 border-amber-600 text-white shadow-md shadow-amber-500/20'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  Issue Full Tin
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionType('return')}
                  className={`py-3 font-bold rounded-xl text-sm transition-all border ${
                    transactionType === 'return'
                      ? 'bg-emerald-600 border-emerald-700 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  Return Empty Tin
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Quantity (Tins) *</label>
              <input
                type="number"
                min="1"
                required
                placeholder="e.g. 5"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full border p-2.5 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 text-white font-bold rounded-xl text-sm shadow-md transition-all ${
                transactionType === 'issue'
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              {submitting ? 'Processing...' : transactionType === 'issue' ? 'Log Tin Issuance' : 'Log Empty Return'}
            </button>
          </form>
        </div>

        {/* Balances & Log Panel */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 lg:col-span-2 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
            <h3 className="text-lg font-bold text-neutral-800">Customer Pending Balances</h3>
            <input
              type="text"
              placeholder="Search by customer name or mobile..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="border pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full md:w-64"
            />
          </div>

          {/* Balance Table */}
          <div className="overflow-x-auto border border-neutral-100 rounded-xl flex-1 max-h-[40vh]">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-500 font-bold sticky top-0">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3 text-center">Issued</th>
                  <th className="p-3 text-center">Returned</th>
                  <th className="p-3 text-right">Balance Pending</th>
                </tr>
              </thead>
              <tbody>
                {filteredBalances.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-neutral-400">No active balances found.</td>
                  </tr>
                ) : (
                  filteredBalances.map((cb: any) => (
                    <tr key={cb.customer_id} className="border-b border-neutral-50 hover:bg-neutral-50/20">
                      <td className="p-3">
                        <div className="font-bold text-neutral-800">{cb.customer_name}</div>
                        <div className="text-xs text-neutral-400">{cb.customer_mobile}</div>
                      </td>
                      <td className="p-3 text-center text-neutral-600">{cb.issued}</td>
                      <td className="p-3 text-center text-neutral-600">{cb.returned}</td>
                      <td className={`p-3 text-right font-black ${cb.balance > 0 ? 'text-amber-600' : 'text-neutral-500'}`}>
                        {cb.balance} tins
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Recent transactions log */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-bold text-neutral-700 mb-3">Recent Tin Movements</h4>
            <div className="space-y-2 max-h-[25vh] overflow-y-auto">
              {recentTransactions.length === 0 ? (
                <p className="text-xs text-neutral-400">No tin transaction history logged.</p>
              ) : (
                recentTransactions.map((tx: any) => (
                  <div key={tx.id} className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-neutral-50 hover:bg-neutral-100/50">
                    <div>
                      <strong className="text-neutral-800">{tx.customer_name}</strong>
                      <span className="text-neutral-400 mx-1.5">&middot;</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.transaction_type === 'issue' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {tx.transaction_type.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-neutral-800">{tx.quantity} tins</span>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
