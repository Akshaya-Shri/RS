"use client";

import { useState, useEffect } from 'react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [supplierDetails, setSupplierDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Forms
  const [companyName, setCompanyName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  // Payment Form
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [collectorName, setCollectorName] = useState('');

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/suppliers');
      const json = await res.json();
      if (json.success) {
        setSuppliers(json.data);
      }
    } catch (e) {
      console.error('Failed to load suppliers:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierDetails = async (id: number) => {
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/admin/suppliers?id=${id}`);
      const json = await res.json();
      if (json.success) {
        setSupplierDetails(json.data);
      }
    } catch (e) {
      console.error('Failed to load supplier details:', e);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSelectSupplier = (s: any) => {
    setSelectedSupplier(s);
    fetchSupplierDetails(s.id);
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) return;

    try {
      const res = await fetch('/api/admin/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: companyName, agency_name: agencyName, address, phone })
      });
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setCompanyName('');
        setAgencyName('');
        setAddress('');
        setPhone('');
        fetchSuppliers();
      } else {
        alert(json.message || 'Failed to add supplier');
      }
    } catch (e) {
      alert('Error adding supplier');
    }
  };

  const handleEditSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !companyName) return;

    try {
      const res = await fetch('/api/admin/suppliers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedSupplier.id, company_name: companyName, agency_name: agencyName, address, phone })
      });
      const json = await res.json();
      if (json.success) {
        setShowEditModal(false);
        fetchSuppliers();
        fetchSupplierDetails(selectedSupplier.id);
      } else {
        alert(json.message || 'Failed to update supplier');
      }
    } catch (e) {
      alert('Error updating supplier');
    }
  };

  const handleSoftDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this supplier? (Soft delete only, transactions remain in audit)')) return;

    try {
      const res = await fetch('/api/admin/suppliers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const json = await res.json();
      if (json.success) {
        setSelectedSupplier(null);
        setSupplierDetails(null);
        fetchSuppliers();
      } else {
        alert(json.message || 'Failed to delete supplier');
      }
    } catch (e) {
      alert('Error deleting supplier');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !amountPaid) return;

    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: selectedSupplier.id,
          amount_paid: parseFloat(amountPaid),
          payment_method: paymentMethod,
          collector_name: collectorName
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowPaymentModal(false);
        setAmountPaid('');
        setCollectorName('');
        fetchSuppliers();
        fetchSupplierDetails(selectedSupplier.id);
      } else {
        alert(json.message || 'Failed to record payment');
      }
    } catch (e) {
      alert('Error recording payment');
    }
  };

  const openEditModal = () => {
    if (!selectedSupplier) return;
    setCompanyName(selectedSupplier.company_name);
    setAgencyName(selectedSupplier.agency_name || '');
    setAddress(selectedSupplier.address || '');
    setPhone(selectedSupplier.phone || '');
    setShowEditModal(true);
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.agency_name && s.agency_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getFilteredLedger = () => {
    if (!supplierDetails?.ledger) return [];
    let ledger = [...supplierDetails.ledger];
    if (ledgerStartDate) {
      ledger = ledger.filter(l => new Date(l.created_at) >= new Date(ledgerStartDate));
    }
    if (ledgerEndDate) {
      ledger = ledger.filter(l => new Date(l.created_at) <= new Date(ledgerEndDate + 'T23:59:59'));
    }
    return ledger;
  };

  const handlePrintLedger = () => {
    window.print();
  };

  return (
    <main className="p-6 md:p-10 bg-neutral-50 min-h-[calc(100vh-80px)] flex flex-col gap-6 print:bg-white print:p-0">
      {/* Header (hidden in print) */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-800">Suppliers Manager</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage vendor credentials, track purchases, and check ledger payables.</p>
        </div>
        <button
          onClick={() => {
            setCompanyName('');
            setAgencyName('');
            setAddress('');
            setPhone('');
            setShowAddModal(true);
          }}
          className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/95 transition-all"
        >
          + Add New Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-stretch">
        {/* Suppliers Sidebar List (hidden in print) */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 flex flex-col gap-4 print:hidden lg:col-span-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search vendor..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />
            <svg className="w-5 h-5 absolute left-3 top-2.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[60vh] space-y-2 pr-1">
            {loading ? (
              <div className="text-center py-8 text-sm text-neutral-400">Loading vendors...</div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="text-center py-8 text-sm text-neutral-400">No vendors found.</div>
            ) : (
              filteredSuppliers.map((s) => {
                const isSelected = selectedSupplier?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSupplier(s)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center ${
                      isSelected 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'border-neutral-100 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-neutral-800">{s.company_name}</h4>
                      {s.agency_name && <p className="text-xs text-neutral-400 mt-0.5">{s.agency_name}</p>}
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${parseFloat(s.outstanding_balance) > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        ₹{parseFloat(s.outstanding_balance).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main Details Panel */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 lg:col-span-2 flex flex-col justify-between print:border-none print:p-0">
          {!selectedSupplier ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-neutral-400">
              <svg className="w-16 h-16 opacity-30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              <h3 className="font-bold text-lg text-neutral-600">Select a Supplier</h3>
              <p className="text-sm max-w-sm mt-1">Select a vendor from the left sidebar to view contact profiles, outstanding payables, and ledger transactions.</p>
            </div>
          ) : detailsLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6 flex-1">
              {/* Supplier Header */}
              <div className="flex justify-between items-start border-b pb-4 print:pb-2">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-800">{supplierDetails?.supplier.company_name}</h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    {supplierDetails?.supplier.agency_name && <span>Agency: {supplierDetails.supplier.agency_name} &middot; </span>}
                    Phone: {supplierDetails?.supplier.phone || 'N/A'}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">Address: {supplierDetails?.supplier.address || 'N/A'}</p>
                </div>
                <div className="flex flex-col items-end gap-2 print:hidden">
                  <div className="text-right">
                    <span className="text-xs font-bold text-neutral-400 uppercase">Outstanding Balance</span>
                    <h3 className={`text-xl font-extrabold ${supplierDetails?.supplier.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{parseFloat(supplierDetails?.supplier.outstanding_balance || 0).toLocaleString('en-IN')}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={openEditModal} className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-lg transition-colors">Edit</button>
                    <button onClick={() => setShowPaymentModal(true)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-lg transition-colors">Record Payment</button>
                    <button onClick={() => handleSoftDelete(selectedSupplier.id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-lg transition-colors">Delete</button>
                  </div>
                </div>
              </div>

              {/* Print Only Header */}
              <div className="hidden print:block mb-4">
                <h2 className="text-xl font-bold">Ledger Balance Summary</h2>
                <div className="grid grid-cols-3 gap-4 border p-4 rounded mt-2 text-sm">
                  <div><strong>Total Purchases:</strong> ₹{parseFloat(supplierDetails?.supplier.total_purchases).toFixed(2)}</div>
                  <div><strong>Total Payments:</strong> ₹{parseFloat(supplierDetails?.supplier.total_payments).toFixed(2)}</div>
                  <div><strong>Outstanding Payable:</strong> ₹{parseFloat(supplierDetails?.supplier.outstanding_balance).toFixed(2)}</div>
                </div>
              </div>

              {/* Ledger Table Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center print:hidden">
                  <h3 className="font-bold text-neutral-800 text-base">Running Ledger Statements</h3>
                  <div className="flex items-center gap-2">
                    <input type="date" value={ledgerStartDate} onChange={e => setLedgerStartDate(e.target.value)} className="border p-1.5 rounded-lg text-xs" />
                    <span className="text-neutral-400 text-xs">to</span>
                    <input type="date" value={ledgerEndDate} onChange={e => setLedgerEndDate(e.target.value)} className="border p-1.5 rounded-lg text-xs" />
                    <button onClick={handlePrintLedger} className="p-1.5 bg-neutral-100 rounded-lg hover:bg-neutral-200" title="Print Ledger / Export PDF">
                      <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-neutral-100 rounded-xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 text-neutral-500 font-bold">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Reference</th>
                        <th className="p-3">Type</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3 text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredLedger().length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-neutral-400">No ledger transactions logged for this range.</td>
                        </tr>
                      ) : (
                        getFilteredLedger().map((l: any) => (
                          <tr key={l.id} className="border-b border-neutral-50 hover:bg-neutral-50/20">
                            <td className="p-3 text-xs text-neutral-500">{new Date(l.created_at).toLocaleString()}</td>
                            <td className="p-3 font-semibold">
                              {l.transaction_type.startsWith('purchase') ? `Purchase #${l.reference_id}` : `Payment #${l.reference_id}`}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                l.transaction_type.includes('cancel') ? 'bg-orange-50 text-orange-700' :
                                l.transaction_type === 'purchase' ? 'bg-red-50 text-red-700' :
                                'bg-green-50 text-green-700'
                              }`}>
                                {l.transaction_type.toUpperCase()}
                              </span>
                            </td>
                            <td className={`p-3 text-right font-bold ${l.transaction_type === 'purchase' ? 'text-red-500' : 'text-green-600'}`}>
                              ₹{parseFloat(l.amount).toFixed(2)}
                            </td>
                            <td className="p-3 text-right font-black text-neutral-800">
                              ₹{parseFloat(l.balance_after).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-neutral-800 mb-4">Add New Vendor</h3>
            <form onSubmit={handleAddSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Company Name *</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="e.g. ABC Oils Pvt Ltd" className="w-full border p-2.5 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Agency Name</label>
                <input type="text" value={agencyName} onChange={e => setAgencyName(e.target.value)} placeholder="e.g. Chennai Distributor" className="w-full border p-2.5 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Mobile / Phone</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 9876543210" className="w-full border p-2.5 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Office Address</label>
                <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Full office address details" className="w-full border p-2.5 rounded-xl text-sm h-20 resize-none" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg text-sm text-neutral-500 font-bold hover:bg-neutral-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/95">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border">
            <h3 className="text-lg font-bold text-neutral-800 mb-4">Edit Vendor details</h3>
            <form onSubmit={handleEditSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Company Name *</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required className="w-full border p-2.5 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Agency Name</label>
                <input type="text" value={agencyName} onChange={e => setAgencyName(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Mobile / Phone</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Office Address</label>
                <textarea value={address} onChange={e => setAddress(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm h-20 resize-none" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-lg text-sm text-neutral-500 font-bold hover:bg-neutral-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/95">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border">
            <h3 className="text-lg font-bold text-neutral-800 mb-2">Record Supplier Payment</h3>
            <p className="text-xs text-neutral-500 mb-4">Payable Outstanding: <strong className="text-red-500">₹{parseFloat(supplierDetails?.supplier.outstanding_balance || 0).toFixed(2)}</strong></p>
            
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Amount Paid (₹) *</label>
                <input type="number" step="0.01" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} required placeholder="e.g. 5000" className="w-full border p-2.5 rounded-xl text-sm font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Payment Method *</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm bg-white">
                  <option value="upi">UPI (GPay/PhonePe)</option>
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer (NEFT/IMPS)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Collector Name / Note</label>
                <input type="text" value={collectorName} onChange={e => setCollectorName(e.target.value)} placeholder="Name of person who collected payment" className="w-full border p-2.5 rounded-xl text-sm" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 border rounded-lg text-sm text-neutral-500 font-bold hover:bg-neutral-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg text-sm hover:bg-green-700">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
