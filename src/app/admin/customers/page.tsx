"use client";

import { useState, useEffect } from 'react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Forms
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async (search = '') => {
    setLoading(true);
    try {
      const url = search ? `/api/admin/customers?query=${encodeURIComponent(search)}` : '/api/admin/customers';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data);
      }
    } catch (e) {
      console.error('Failed to load customers:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (id: number) => {
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/admin/customers?id=${id}`);
      const json = await res.json();
      if (json.success) {
        setCustomerDetails(json.data);
      }
    } catch (e) {
      console.error('Failed to load customer details:', e);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    fetchCustomers(val);
  };

  const handleSelectCustomer = (c: any) => {
    setSelectedCustomer(c);
    fetchCustomerDetails(c.id);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile) return;

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile, address, gst_number: gstNumber })
      });
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setName('');
        setMobile('');
        setAddress('');
        setGstNumber('');
        fetchCustomers(searchQuery);
      } else {
        alert(json.message || 'Failed to add customer');
      }
    } catch (e) {
      alert('Error adding customer');
    }
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !name || !mobile) return;

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedCustomer.id, name, mobile, address, gst_number: gstNumber })
      });
      const json = await res.json();
      if (json.success) {
        setShowEditModal(false);
        fetchCustomers(searchQuery);
        fetchCustomerDetails(selectedCustomer.id);
      } else {
        alert(json.message || 'Failed to update customer');
      }
    } catch (e) {
      alert('Error updating customer');
    }
  };

  const openEditModal = () => {
    if (!selectedCustomer) return;
    setName(selectedCustomer.name);
    setMobile(selectedCustomer.mobile);
    setAddress(selectedCustomer.address || '');
    setGstNumber(selectedCustomer.gst_number || '');
    setShowEditModal(true);
  };

  return (
    <main className="p-6 md:p-10 bg-neutral-50 min-h-[calc(100vh-80px)] flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-800">Customers CRM</h1>
          <p className="text-sm text-neutral-500 mt-1">Search consumer directory, review buyer loyalty analytics, and track bills.</p>
        </div>
        <button
          onClick={() => {
            setName('');
            setMobile('');
            setAddress('');
            setGstNumber('');
            setShowAddModal(true);
          }}
          className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/95 transition-all"
        >
          + Register Customer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-stretch">
        {/* Customer list sidebar */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 flex flex-col gap-4 lg:col-span-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />
            <svg className="w-5 h-5 absolute left-3 top-2.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[60vh] space-y-2 pr-1">
            {loading ? (
              <div className="text-center py-8 text-sm text-neutral-400">Loading customers...</div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8 text-sm text-neutral-400">No customers found.</div>
            ) : (
              customers.map((c) => {
                const isSelected = selectedCustomer?.id === c.id;
                const isRepeat = parseInt(c.total_orders) > 1;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center ${
                      isSelected 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'border-neutral-100 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-neutral-800">{c.name}</h4>
                        {isRepeat && (
                          <span className="bg-emerald-50 text-emerald-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Repeat</span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">{c.mobile}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-neutral-400">Spent</span>
                      <p className="text-sm font-black text-neutral-800">₹{parseFloat(c.total_spent || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Customer details Main Panel */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 lg:col-span-2 flex flex-col justify-between">
          {!selectedCustomer ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-neutral-400">
              <svg className="w-16 h-16 opacity-30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857" /></svg>
              <h3 className="font-bold text-lg text-neutral-600">Select a Customer</h3>
              <p className="text-sm max-w-sm mt-1">Select a consumer profile from the sidebar to review purchase history, repeat metrics, and contact registries.</p>
            </div>
          ) : detailsLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6 flex-1">
              {/* Profile Card Header */}
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-800">{customerDetails?.customer.name}</h2>
                  <p className="text-sm text-neutral-500 mt-1">Mobile: {customerDetails?.customer.mobile}</p>
                  {customerDetails?.customer.gst_number && <p className="text-xs text-neutral-400 mt-1">GSTIN: <strong className="text-neutral-700">{customerDetails.customer.gst_number}</strong></p>}
                  <p className="text-xs text-neutral-400 mt-1">Address: {customerDetails?.customer.address || 'N/A'}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={openEditModal} className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-lg transition-colors">
                    Edit Profile
                  </button>
                </div>
              </div>

              {/* Loyalty Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                  <span className="text-xs font-bold text-neutral-400 uppercase">Total Orders</span>
                  <h4 className="text-xl font-extrabold text-neutral-800 mt-1">{customerDetails?.customer.total_orders || 0}</h4>
                </div>
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                  <span className="text-xs font-bold text-neutral-400 uppercase">Total Value spent</span>
                  <h4 className="text-xl font-extrabold text-neutral-800 mt-1">₹{parseFloat(customerDetails?.customer.total_spent || 0).toLocaleString('en-IN')}</h4>
                </div>
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                  <span className="text-xs font-bold text-neutral-400 uppercase">Last Purchase Date</span>
                  <h4 className="text-sm font-extrabold text-neutral-800 mt-2">
                    {selectedCustomer.last_purchase_date ? new Date(selectedCustomer.last_purchase_date).toLocaleDateString() : 'N/A'}
                  </h4>
                </div>
              </div>

              {/* Invoice Lists */}
              <div className="space-y-3">
                <h3 className="font-bold text-neutral-800 text-base">Bills & Invoices History</h3>
                
                <div className="overflow-x-auto border border-neutral-100 rounded-xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 text-neutral-500 font-bold">
                      <tr>
                        <th className="p-3">Invoice Number</th>
                        <th className="p-3">Purchase Date</th>
                        <th className="p-3">Payment Channel</th>
                        <th className="p-3 text-right">Invoice Amount</th>
                        <th className="p-3 text-center">Invoice PDF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerDetails?.sales.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-neutral-400">No purchases found for this customer.</td>
                        </tr>
                      ) : (
                        customerDetails?.sales.map((s: any) => (
                          <tr key={s.id} className="border-b border-neutral-50 hover:bg-neutral-50/20">
                            <td className="p-3 font-bold text-neutral-800">{s.invoice_number}</td>
                            <td className="p-3 text-xs text-neutral-500">{new Date(s.created_at).toLocaleDateString()}</td>
                            <td className="p-3 text-xs uppercase font-bold text-neutral-600">{s.payment_type}</td>
                            <td className="p-3 text-right font-black text-neutral-800">₹{parseFloat(s.total_amount).toFixed(2)}</td>
                            <td className="p-3 text-center">
                              {s.pdf_url ? (
                                <a
                                  href={s.pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 text-primary bg-primary/10 hover:bg-primary/20 rounded-lg text-xs font-bold transition-colors"
                                >
                                  View / Print
                                </a>
                              ) : (
                                <span className="text-xs text-neutral-400">Not Uploaded</span>
                              )}
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

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-neutral-800 mb-4">Register Customer</h3>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Customer Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Rajesh Kumar" className="w-full border p-2.5 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Mobile / Phone *</label>
                <input type="text" value={mobile} onChange={e => setMobile(e.target.value)} required placeholder="e.g. 9876543210" className="w-full border p-2.5 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">GSTIN (Optional)</label>
                <input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value)} placeholder="e.g. 33AAAAA1111A1Z1" className="w-full border p-2.5 rounded-xl text-sm uppercase" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Delivery Address</label>
                <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Residential or commercial billing address" className="w-full border p-2.5 rounded-xl text-sm h-20 resize-none" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg text-sm text-neutral-500 font-bold hover:bg-neutral-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/95">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border">
            <h3 className="text-lg font-bold text-neutral-800 mb-4">Edit Customer Profile</h3>
            <form onSubmit={handleEditCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Customer Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full border p-2.5 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Mobile / Phone *</label>
                <input type="text" value={mobile} onChange={e => setMobile(e.target.value)} required className="w-full border p-2.5 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">GSTIN (Optional)</label>
                <input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm uppercase" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Delivery Address</label>
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
    </main>
  );
}
