import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-neutral-100 font-inter">
      <aside className="w-64 bg-white border-r border-neutral-200 hidden md:flex flex-col z-20">
         <div className="p-6 border-b border-neutral-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold">R</div>
            <span className="font-bold text-lg text-foreground">Admin Panel</span>
         </div>
         <nav className="flex-1 p-4 space-y-2">
            <Link href="/admin" className="flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary font-bold rounded-xl">Dashboard</Link>
            <Link href="/admin/orders" className="flex items-center gap-3 px-4 py-3 text-neutral-600 hover:bg-neutral-50 rounded-xl transition-colors">Orders</Link>
            <Link href="/admin/products" className="flex items-center gap-3 px-4 py-3 text-neutral-600 hover:bg-neutral-50 rounded-xl transition-colors">Products</Link>
            <Link href="/admin/leads" className="flex items-center gap-3 px-4 py-3 text-neutral-600 hover:bg-neutral-50 rounded-xl transition-colors">Wholesale Leads</Link>
         </nav>
      </aside>
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
         {/* Top Header */}
         <header className="h-16 bg-white border-b border-neutral-200 flex items-center px-6 justify-between shrink-0">
            <h1 className="font-bold text-xl text-foreground md:hidden">Revathi Admin</h1>
            <div className="hidden md:block"></div> {/* Spacer */}
            <div className="flex items-center gap-4">
               <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center text-sm font-bold">SA</div>
            </div>
         </header>
         {children}
      </div>
    </div>
  );
}
