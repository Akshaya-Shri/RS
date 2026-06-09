"use client";

import React, { useEffect, useState } from 'react';

interface ProductSummary {
  id: number;
  name: string;
  sku: string;
  stock: number;
  reserved: number;
  incoming: number;
  stock_status: string;
  low_stock_threshold: number;
}

interface AuditEntry {
  id: number;
  product_id: number;
  change: number;
  reason?: string;
  user?: string;
  at: string;
}

export default function InventoryDashboard() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        fetch('/api/admin/inventory'),
        fetch('/api/admin/inventory/history?limit=500')
      ]);
      const pJson = await pRes.json();
      const aJson = await aRes.json();
      if (pJson.success) setProducts(pJson.data || []);
      if (aJson.success) setAudit(aJson.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const totalSKUs = products.length;
  const totalAvailable = products.reduce((sum, p) => sum + Math.max(0, p.stock - p.reserved), 0);
  const totalReserved = products.reduce((sum, p) => sum + (p.reserved || 0), 0);

  const lowStock = products.filter(p => (p.stock - (p.reserved || 0)) <= (p.low_stock_threshold || 0));

  const historyFor = (productId: number) => audit.filter(a => a.product_id === productId).slice(0, 100);

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Inventory Dashboard</h1>
        <div>
          <button onClick={fetchData} className="px-4 py-2 bg-primary text-white rounded">Refresh</button>
        </div>
      </div>

      {loading ? <div>Loading...</div> : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded shadow">
              <div className="text-sm text-neutral-500">Total SKUs</div>
              <div className="text-2xl font-bold">{totalSKUs}</div>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <div className="text-sm text-neutral-500">Total Available</div>
              <div className="text-2xl font-bold">{totalAvailable}</div>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <div className="text-sm text-neutral-500">Total Reserved</div>
              <div className="text-2xl font-bold">{totalReserved}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded p-4">
              <h2 className="font-bold mb-3">Low Stock Alerts ({lowStock.length})</h2>
              {lowStock.length === 0 ? (
                <div className="text-neutral-500">No low-stock items.</div>
              ) : (
                <ul className="space-y-2">
                  {lowStock.map(p => (
                    <li key={p.id} className="flex justify-between items-center border p-2 rounded">
                      <div>
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-xs text-neutral-500">Available: {p.stock - (p.reserved||0)} · Threshold: {p.low_stock_threshold}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedProduct(p)} className="px-3 py-1 bg-primary text-white rounded">View History</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded p-4">
              <h2 className="font-bold mb-3">Recent Stock Movements</h2>
              <div className="max-h-[60vh] overflow-y-auto text-sm">
                {audit.length === 0 ? (
                  <div className="text-neutral-500">No movements yet.</div>
                ) : (
                  audit.slice(0, 100).map(a => (
                    <div key={a.id} className="border-b py-2">
                      <div className="text-xs text-neutral-500">{new Date(a.at).toLocaleString()}</div>
                      <div>Product #{a.product_id} &middot; Change: {a.change} &middot; {a.reason}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* History modal */}
          {selectedProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">History for #{selectedProduct.id} — {selectedProduct.name}</h3>
                  <button onClick={() => setSelectedProduct(null)} className="text-neutral-500">Close</button>
                </div>
                <div>
                  {historyFor(selectedProduct.id).length === 0 ? (
                    <div className="text-neutral-500">No history for this product.</div>
                  ) : (
                    <div className="space-y-3">
                      {historyFor(selectedProduct.id).map(h => (
                        <div key={h.id} className="border p-2 rounded">
                          <div className="text-xs text-neutral-500">{new Date(h.at).toLocaleString()}</div>
                          <div>Change: {h.change} — {h.reason} — {h.user}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
