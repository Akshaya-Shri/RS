"use client";

import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState([
    { title: "Total Orders", value: 0, color: "bg-blue-50 text-blue-600 dot-blue-500" },
    { title: "Revenue (₹)", value: 0, color: "bg-green-50 text-green-600 dot-green-500" },
    { title: "Products", value: 5, color: "bg-orange-50 text-orange-600 dot-orange-500" },
    { title: "Pending Approvals", value: 0, color: "bg-red-50 text-red-600 dot-red-500" }
  ]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/orders');
        const json = await res.json();
        if (json.success) {
          const orders = json.data;
          const totalOrders = orders.length;
          const revenue = orders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
          const pendingApprovals = orders.filter((order: any) => order.status === 'pending').length;

          setStats([
            { title: "Total Orders", value: totalOrders, color: "bg-blue-50 text-blue-600 dot-blue-500" },
            { title: "Revenue (₹)", value: revenue, color: "bg-green-50 text-green-600 dot-green-500" },
            { title: "Products", value: 5, color: "bg-orange-50 text-orange-600 dot-orange-500" },
            { title: "Pending Approvals", value: pendingApprovals, color: "bg-red-50 text-red-600 dot-red-500" }
          ]);

          // Set recent orders (last 4)
          setRecentOrders(orders.slice(0, 4));
        }
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      }
    };

    fetchStats();
  }, []);

  return (
    <main className="p-6 md:p-10 flex-1 overflow-y-auto bg-neutral-50">
      <h2 className="text-2xl font-bold mb-8 text-foreground">Overview</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => {
           // Safely extract dot color class (quick hack since tailwind needs full class names)
           const dotColor = stat.color.split(' ').find(c => c.startsWith('dot-'))?.replace('dot-', 'bg-') || 'bg-gray-500';
           
           return (
             <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex flex-col gap-2 lift-effect">
                <span className="text-sm font-medium text-neutral-500">{stat.title}</span>
                <div className={`text-4xl font-extrabold flex items-center gap-3`}>
                   <span className={`w-3 h-3 rounded-full ${dotColor}`}></span>
                   <AnimatedCounter end={stat.value} />
                </div>
             </div>
           );
        })}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-foreground">Recent Orders</h3>
          <a href="/admin/orders" className="text-primary font-bold hover:underline">View All</a>
        </div>
        {recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-neutral-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-neutral-600 mb-2">No orders yet</h4>
            <p className="text-neutral-500">Orders will appear here once customers start placing them.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 text-sm">
                  <th className="pb-4 font-medium">Order ID</th>
                  <th className="pb-4 font-medium">Customer</th>
                  <th className="pb-4 font-medium">Amount</th>
                  <th className="pb-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <td className="py-4 font-bold text-foreground">#ORD-{order.id.toString().padStart(4, '0')}</td>
                    <td className="py-4 text-neutral-600">{order.customer_name || 'Walk-in Customer'}</td>
                    <td className="py-4 font-bold">₹{order.total_amount}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                        order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        order.status === 'verified' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {order.status}
                      </span>
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
