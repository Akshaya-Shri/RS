"use client";

import { useState, useEffect } from 'react';

interface Order {
  id: number;
  user_id: number | null;
  total_amount: number;
  status: 'pending' | 'verified' | 'shipped' | 'delivered' | 'cancelled';
  payment_img_url?: string;
  transaction_id?: string;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  items?: OrderItem[];
}

interface OrderItem {
  id: number;
  product_name: string;
  size: string;
  quantity: number;
  price: number;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId: number, newStatus: Order['status']) => {
    setUpdatingStatus(orderId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        setOrders(orders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      } else {
        alert('Failed to update order status');
      }
    } catch (e) {
      alert('Error updating order status');
    }
    setUpdatingStatus(null);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'verified': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 md:p-10 flex-1 w-full bg-white sm:bg-transparent">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">Manage Orders</h1>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition shadow-md"
        >
          Refresh Orders
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-neutral-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-600 mb-2">No orders yet</h3>
          <p className="text-neutral-500">Orders will appear here once customers start placing them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Orders Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="text-left py-4 px-6 font-bold text-neutral-700">Order ID</th>
                    <th className="text-left py-4 px-6 font-bold text-neutral-700">Customer</th>
                    <th className="text-left py-4 px-6 font-bold text-neutral-700">Amount</th>
                    <th className="text-left py-4 px-6 font-bold text-neutral-700">Status</th>
                    <th className="text-left py-4 px-6 font-bold text-neutral-700">Date</th>
                    <th className="text-left py-4 px-6 font-bold text-neutral-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                      <td className="py-4 px-6 font-bold text-foreground">#ORD-{order.id.toString().padStart(4, '0')}</td>
                      <td className="py-4 px-6 text-neutral-600">
                        {order.customer_name || 'Walk-in Customer'}
                        {order.customer_phone && <div className="text-sm text-neutral-500">{order.customer_phone}</div>}
                      </td>
                      <td className="py-4 px-6 font-bold text-secondary">₹{order.total_amount}</td>
                      <td className="py-4 px-6">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                          disabled={updatingStatus === order.id}
                          className={`px-3 py-1 rounded-full text-xs font-bold border-0 ${getStatusColor(order.status)} ${updatingStatus === order.id ? 'opacity-50' : ''}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="verified">Verified</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-4 px-6 text-neutral-600 text-sm">{formatDate(order.created_at)}</td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-primary font-bold hover:underline"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Details Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-neutral-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-foreground">Order #ORD-{selectedOrder.id.toString().padStart(4, '0')}</h2>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Order Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-bold text-neutral-700 mb-2">Customer Details</h3>
                      <p className="text-sm text-neutral-600">
                        <strong>Name:</strong> {selectedOrder.customer_name || 'Walk-in Customer'}<br />
                        {selectedOrder.customer_email && <><strong>Email:</strong> {selectedOrder.customer_email}<br /></>}
                        {selectedOrder.customer_phone && <><strong>Phone:</strong> {selectedOrder.customer_phone}<br /></>}
                        <strong>Order Date:</strong> {formatDate(selectedOrder.created_at)}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-700 mb-2">Order Summary</h3>
                      <p className="text-sm text-neutral-600">
                        <strong>Total Amount:</strong> ₹{selectedOrder.total_amount}<br />
                        <strong>Status:</strong> <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span><br />
                        {selectedOrder.transaction_id && <><strong>Transaction ID:</strong> {selectedOrder.transaction_id}<br /></>}
                      </p>
                    </div>
                  </div>

                  {/* Payment Proof */}
                  {selectedOrder.payment_img_url && (
                    <div>
                      <h3 className="font-bold text-neutral-700 mb-2">Payment Proof</h3>
                      <div className="border border-neutral-200 rounded-lg p-4">
                        <img
                          src={selectedOrder.payment_img_url}
                          alt="Payment Proof"
                          className="max-w-full h-auto rounded"
                        />
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  {selectedOrder.items && selectedOrder.items.length > 0 && (
                    <div>
                      <h3 className="font-bold text-neutral-700 mb-2">Order Items</h3>
                      <div className="border border-neutral-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-neutral-50">
                            <tr>
                              <th className="text-left py-2 px-4 font-bold text-neutral-700 text-sm">Product</th>
                              <th className="text-left py-2 px-4 font-bold text-neutral-700 text-sm">Size</th>
                              <th className="text-left py-2 px-4 font-bold text-neutral-700 text-sm">Qty</th>
                              <th className="text-left py-2 px-4 font-bold text-neutral-700 text-sm">Price</th>
                              <th className="text-left py-2 px-4 font-bold text-neutral-700 text-sm">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrder.items.map((item) => (
                              <tr key={item.id} className="border-t border-neutral-100">
                                <td className="py-2 px-4 text-sm">{item.product_name}</td>
                                <td className="py-2 px-4 text-sm">{item.size}</td>
                                <td className="py-2 px-4 text-sm">{item.quantity}</td>
                                <td className="py-2 px-4 text-sm">₹{item.price}</td>
                                <td className="py-2 px-4 text-sm font-bold">₹{item.price * item.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}