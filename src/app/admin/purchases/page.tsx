"use client";

import { useState, useEffect } from 'react';

interface PurchaseItemInput {
  product_id: string;
  quantity: number;
  purchase_rate: number;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<PurchaseItemInput[]>([{ product_id: '', quantity: 1, purchase_rate: 0 }]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [purchasesRes, suppliersRes, productsRes] = await Promise.all([
        fetch('/api/admin/purchases'),
        fetch('/api/admin/suppliers'),
        fetch('/api/admin/products')
      ]);

      const [purchasesJson, suppliersJson, productsJson] = await Promise.all([
        purchasesRes.json(),
        suppliersRes.json(),
        productsRes.json()
      ]);

      if (purchasesJson.success) setPurchases(purchasesJson.data);
      if (suppliersJson.success) setSuppliers(suppliersJson.data);
      if (productsJson.success) setProducts(productsJson.data);
    } catch (e) {
      console.error('Failed to load purchases details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItemRow = () => {
    setItems([...items, { product_id: '', quantity: 1, purchase_rate: 0 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof PurchaseItemInput, value: any) => {
    const updated = [...items];
    if (field === 'product_id') {
      updated[index].product_id = value;
      // Auto-fill purchase rate using product cost_price if available
      const prod = products.find(p => p.id.toString() === value);
      if (prod) {
        updated[index].purchase_rate = parseFloat(prod.cost_price || 0);
      }
    } else if (field === 'quantity') {
      updated[index].quantity = parseInt(value, 10) || 0;
    } else if (field === 'purchase_rate') {
      updated[index].purchase_rate = parseFloat(value) || 0;
    }
    setItems(updated);
  };

  // Calculate totals
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.purchase_rate), 0);

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId) {
      alert('Please select a supplier');
      return;
    }

    const invalidItem = items.find(item => !item.product_id || item.quantity <= 0 || item.purchase_rate <= 0);
    if (invalidItem) {
      alert('Please fill out all product rows with positive quantities and purchase rates');
      return;
    }

    try {
      const res = await fetch('/api/admin/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: parseInt(supplierId, 10),
          purchase_date: purchaseDate,
          total_amount: totalAmount,
          items: items.map(item => ({
            product_id: parseInt(item.product_id, 10),
            quantity: item.quantity,
            purchase_rate: item.purchase_rate
          }))
        })
      });

      const json = await res.json();
      if (json.success) {
        setShowAddForm(false);
        setSupplierId('');
        setItems([{ product_id: '', quantity: 1, purchase_rate: 0 }]);
        fetchData();
      } else {
        alert(json.message || 'Failed to log purchase');
      }
    } catch (e) {
      alert('Error saving purchase');
    }
  };

  const handleCancelPurchase = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this purchase? This will revert stock levels and reduce the supplier ledger balance.')) return;

    try {
      const res = await fetch('/api/admin/purchases', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
      } else {
        alert(json.message || 'Failed to cancel purchase');
      }
    } catch (e) {
      alert('Error cancelling purchase');
    }
  };

  return (
    <main className="p-6 md:p-10 bg-neutral-50 min-h-[calc(100vh-80px)] space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-800">Inventory Purchases</h1>
          <p className="text-sm text-neutral-500 mt-1">Record inbound vendor deliveries, restock warehouse volumes, and issue ledger credits.</p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/95 transition-all"
          >
            + Log New Purchase
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-6 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex justify-between items-center border-b pb-4">
            <h3 className="text-lg font-bold text-neutral-800">Log Delivery Invoice</h3>
            <button onClick={() => setShowAddForm(false)} className="text-neutral-400 hover:text-neutral-600">Cancel</button>
          </div>

          <form onSubmit={handleSubmitPurchase} className="space-y-6">
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
                    <option key={s.id} value={s.id}>{s.company_name} {s.agency_name ? `(${s.agency_name})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Purchase Date *</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={e => setPurchaseDate(e.target.value)}
                  required
                  className="w-full border p-2.5 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Purchase Items List */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Item Details</label>
              
              {items.map((item, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-3 items-end md:items-center bg-neutral-50 p-4 rounded-xl border border-neutral-100 relative group">
                  <div className="w-full md:flex-1">
                    <label className="block md:hidden text-[10px] font-bold text-neutral-400 uppercase mb-1">Product</label>
                    <select
                      value={item.product_id}
                      onChange={e => handleItemChange(index, 'product_id', e.target.value)}
                      required
                      className="w-full border p-2 rounded-lg text-sm bg-white"
                    >
                      <option value="">-- Select Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full md:w-32">
                    <label className="block md:hidden text-[10px] font-bold text-neutral-400 uppercase mb-1">Quantity (L)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                      required
                      className="w-full border p-2 rounded-lg text-sm"
                    />
                  </div>
                  <div className="w-full md:w-36">
                    <label className="block md:hidden text-[10px] font-bold text-neutral-400 uppercase mb-1">Rate per unit (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Rate"
                      value={item.purchase_rate}
                      onChange={e => handleItemChange(index, 'purchase_rate', e.target.value)}
                      required
                      className="w-full border p-2 rounded-lg text-sm font-bold"
                    />
                  </div>
                  <div className="w-full md:w-28 text-right font-black text-neutral-700 text-sm py-2">
                    ₹{(item.quantity * item.purchase_rate).toFixed(2)}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(index)}
                    disabled={items.length === 1}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddItemRow}
                className="px-4 py-2 border border-dashed border-primary text-primary font-bold text-xs rounded-xl hover:bg-primary/5 transition-colors"
              >
                + Add Another Product
              </button>
            </div>

            <div className="flex justify-between items-center border-t pt-4">
              <div className="text-neutral-500 text-sm">
                Total Invoiced Amount: <strong className="text-xl text-neutral-800 font-black">₹{totalAmount.toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 border rounded-xl text-neutral-500 font-bold hover:bg-neutral-50 text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 text-sm">Save & Credit Balance</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Purchases List */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <h3 className="text-lg font-bold text-neutral-800 mb-6">Delivery Invoices Registry</h3>
        
        {loading ? (
          <div className="text-center py-12 text-neutral-400">Loading registry...</div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">No purchases logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-500 font-bold">
                  <th className="pb-3">Invoice ID</th>
                  <th className="pb-3">Vendor / Supplier</th>
                  <th className="pb-3">Delivery Date</th>
                  <th className="pb-3 text-right">Invoiced Amount</th>
                  <th className="pb-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id} className="border-b border-neutral-50 hover:bg-neutral-50/30 transition-colors">
                    <td className="py-3.5 font-bold text-neutral-800">#PUR-{p.id.toString().padStart(4, '0')}</td>
                    <td className="py-3.5 font-semibold text-neutral-800">{p.supplier_name}</td>
                    <td className="py-3.5 text-neutral-500">{new Date(p.purchase_date).toLocaleDateString()}</td>
                    <td className="py-3.5 text-right font-black text-neutral-800">₹{parseFloat(p.total_amount).toFixed(2)}</td>
                    <td className="py-3.5 text-center">
                      <button
                        onClick={() => handleCancelPurchase(p.id)}
                        className="px-2.5 py-1 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors"
                      >
                        Cancel
                      </button>
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
