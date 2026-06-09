"use client";

import React, { useEffect, useState } from 'react';

interface ProductSummary {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  stock: number;
  reserved: number;
  incoming: number;
  stock_status: string;
  low_stock_threshold: number;
  imageUrl?: string | null;
}

interface AuditEntry {
  id: number;
  product_id: number;
  type: string;
  change: number;
  reason?: string;
  user?: string;
  before?: any;
  after?: any;
  at: string;
}

export default function InventoryAdminPage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [selected, setSelected] = useState<ProductSummary | null>(null);
  const [change, setChange] = useState<number>(0);
  const [type, setType] = useState<'stock' | 'reserved' | 'incoming'>('stock');
  const [reason, setReason] = useState<string>('manual adjustment');
  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/inventory');
      const json = await res.json();
      if (json.success) setProducts(json.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchAudit = async (limit = 50) => {
    try {
      const res = await fetch(`/api/admin/inventory/history?limit=${limit}`);
      const json = await res.json();
      if (json.success) setAudit(json.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchAudit();
  }, []);

  const openAdjust = (p: ProductSummary) => {
    setSelected(p);
    setChange(0);
    setType('stock');
    setReason('manual adjustment');
  };

  const submitAdjust = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: selected.id, change, type, reason, user: 'admin' })
      });
      const json = await res.json();
      if (json.success) {
        // refresh inventory and audit
        await fetchInventory();
        await fetchAudit();
        setSelected(null);
      } else {
        alert(json.message || 'Failed to adjust inventory');
      }
    } catch (e) {
      alert('Error adjusting inventory');
      console.error(e);
    }
    setSubmitting(false);
  };

  return (
    <div className="p-6 md:p-10 flex-1 w-full bg-white sm:bg-transparent">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <div className="flex gap-2">
          <button onClick={() => { fetchInventory(); fetchAudit(); }} className="px-4 py-2 bg-primary text-white rounded">Refresh</button>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-lg border p-4">
            <h2 className="font-bold mb-4">Products</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Product</th>
                    <th className="text-left p-2">Stock</th>
                    <th className="text-left p-2">Reserved</th>
                    <th className="text-left p-2">Incoming</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-t">
                      <td className="p-2">{p.id}</td>
                      <td className="p-2">
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-xs text-neutral-500">{p.sku || p.barcode}</div>
                      </td>
                      <td className="p-2">{p.stock}</td>
                      <td className="p-2">{p.reserved}</td>
                      <td className="p-2">{p.incoming}</td>
                      <td className="p-2">{p.stock_status}</td>
                      <td className="p-2">
                        <button onClick={() => openAdjust(p)} className="px-3 py-1 bg-primary text-white rounded">Adjust</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <h2 className="font-bold mb-4">Inventory Audit (recent)</h2>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto text-sm">
              {audit.length === 0 ? (
                <div className="text-neutral-500">No audit entries yet.</div>
              ) : (
                audit.map(a => (
                  <div key={a.id} className="border p-2 rounded">
                    <div className="text-xs text-neutral-500">{new Date(a.at).toLocaleString()}</div>
                    <div><strong>Product:</strong> #{a.product_id} &middot; <strong>Change:</strong> {a.change}</div>
                    <div className="text-neutral-600 text-xs">{a.reason} — {a.user}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="font-bold mb-4">Adjust Inventory — #{selected.id} {selected.name}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Type</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="mt-1 w-full border rounded px-2 py-1">
                  <option value="stock">Stock</option>
                  <option value="reserved">Reserved</option>
                  <option value="incoming">Incoming</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Change (use negative to reduce)</label>
                <input type="number" value={change} onChange={e => setChange(parseInt(e.target.value || '0', 10))} className="mt-1 w-full border rounded px-2 py-1" />
              </div>

              <div>
                <label className="block text-sm font-medium">Reason</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)} className="mt-1 w-full border rounded px-2 py-1" />
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => setSelected(null)} className="px-4 py-2 bg-neutral-100 rounded">Cancel</button>
                <button onClick={submitAdjust} disabled={submitting} className="px-4 py-2 bg-primary text-white rounded">{submitting ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
