"use client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 bg-neutral-100 flex pb-12 w-full h-full min-h-[calc(100vh-80px)]">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-neutral-200 hidden md:block">
        <div className="p-6">
          <h2 className="text-xl font-bold text-primary">Admin Control</h2>
        </div>
        <nav className="flex flex-col gap-2 px-4">
          <a href="/admin" className="px-4 py-3 rounded-lg text-neutral-600 font-medium hover:bg-neutral-50 hover:text-primary transition-colors">
            Dashboard Overview
          </a>
          <a href="/admin/products" className="px-4 py-3 rounded-lg text-neutral-600 font-medium hover:bg-neutral-50 hover:text-primary transition-colors">
            Manage Products
          </a>
          <a href="/admin/settings" className="px-4 py-3 rounded-lg text-neutral-600 font-medium hover:bg-neutral-50 hover:text-primary transition-colors">
            QR & Settings
          </a>
        </nav>
        <div className="p-4 mt-auto border-t border-neutral-200 mt-12">
          <button 
            onClick={async () => {
              await fetch('/api/admin/login', { method: 'POST', body: JSON.stringify({ action: 'logout' }) });
              window.location.href = '/admin/login';
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto w-full">
         {/* Mobile Nav Header */}
         <div className="md:hidden bg-white border-b border-neutral-200 p-4 mb-4 flex gap-4 overflow-x-auto items-center">
            <a href="/admin" className="px-4 py-2 bg-neutral-100 rounded-full whitespace-nowrap font-bold text-sm">Overview</a>
            <a href="/admin/products" className="px-4 py-2 bg-neutral-100 rounded-full whitespace-nowrap font-bold text-sm">Products</a>
            <a href="/admin/settings" className="px-4 py-2 bg-neutral-100 rounded-full whitespace-nowrap font-bold text-sm">Settings</a>
            <button 
               onClick={async () => {
                 await fetch('/api/admin/login', { method: 'POST', body: JSON.stringify({ action: 'logout' }) });
                 window.location.href = '/admin/login';
               }}
               className="ml-auto px-4 py-2 bg-red-50 text-red-600 rounded-full whitespace-nowrap font-bold text-sm"
            >
               Sign Out
            </button>
         </div>
         {children}
      </div>
    </div>
  );
}
