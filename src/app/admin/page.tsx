import AnimatedCounter from "@/components/ui/AnimatedCounter";

export default function AdminDashboard() {
  const stats = [
    { title: "Total Orders", value: 1284, color: "bg-blue-50 text-blue-600 dot-blue-500" },
    { title: "Revenue (₹)", value: 450200, color: "bg-green-50 text-green-600 dot-green-500" },
    { title: "Products", value: 24, color: "bg-orange-50 text-orange-600 dot-orange-500" },
    { title: "Pending Approvals", value: 12, color: "bg-red-50 text-red-600 dot-red-500" }
  ];

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
        <h3 className="text-lg font-bold mb-6 text-foreground">Recent Orders</h3>
        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead>
                 <tr className="border-b border-neutral-200 text-neutral-500 text-sm">
                    <th className="pb-4 font-medium">Order ID</th>
                    <th className="pb-4 font-medium">Customer</th>
                    <th className="pb-4 font-medium">Amount</th>
                    <th className="pb-4 font-medium">Status</th>
                    <th className="pb-4 font-medium text-right">Action</th>
                 </tr>
              </thead>
              <tbody className="text-sm">
                 {[1, 2, 3, 4].map(row => (
                    <tr key={row} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                       <td className="py-5 font-bold text-foreground">#ORD-20260{row}</td>
                       <td className="py-5 text-neutral-600">Shanmugam {row}</td>
                       <td className="py-5 font-bold">₹{620 * row}</td>
                       <td className="py-5">
                          <span className={`px-3 py-1.5 text-xs rounded-full font-bold ${row === 1 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                             {row === 1 ? 'Pending Verification' : 'Verified'}
                          </span>
                       </td>
                       <td className="py-5 text-right">
                          <button className="text-primary font-bold hover:underline">View Details</button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </main>
  );
}
