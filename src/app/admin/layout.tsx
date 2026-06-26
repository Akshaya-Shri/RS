"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Lock scroll when drawer is open on mobile
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  const isLoginPage = pathname === '/admin/login';
  if (isLoginPage) {
    return <>{children}</>;
  }

  const links = [
    { href: '/admin', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z' },
    { href: '/admin/sales/new', label: 'Sales Billing', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { href: '/admin/customers', label: 'Customers CRM', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { href: '/admin/suppliers', label: 'Suppliers', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { href: '/admin/purchases', label: 'Purchases', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    { href: '/admin/payments', label: 'Payments', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { href: '/admin/profit', label: 'Profit Analysis', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { href: '/admin/tins', label: 'Tin Management', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14v14m0-14L4 7m0 0v10l8 4' },
    { href: '/admin/attendance', label: 'Attendance', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { href: '/admin/reports', label: 'Reports Hub', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { href: '/admin/inventory', label: 'Stock Manager', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { href: '/admin/orders', label: 'Web Orders', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
    { href: '/admin/products', label: 'Products Edit', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { href: '/admin/settings', label: 'QR Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' }
  ];

  return (
    <div className="flex-1 bg-neutral-50 flex flex-col lg:flex-row pb-12 w-full h-full min-h-[calc(100vh-80px)]">
      {/* Desktop Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-neutral-200 hidden lg:flex flex-col shrink-0">
        <div className="p-6 border-b border-neutral-100">
          <h2 className="text-xl font-extrabold text-primary flex items-center gap-2">
            <Image
              src="/images/RSFavicon.png"
              alt="Revathi Stores Logo"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
            Revathi ERP
          </h2>
        </div>
        <nav className="flex-1 flex flex-col gap-1 px-4 py-6 overflow-y-auto max-h-[calc(100vh-230px)]">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href} 
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]' 
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-primary'
                }`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                </svg>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-neutral-100">
          <button 
            onClick={async () => {
              await fetch('/api/admin/login', { method: 'POST', body: JSON.stringify({ action: 'logout' }) });
              window.location.href = '/admin/login';
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col">
         {/* Mobile Nav Header */}
         <div className="lg:hidden bg-white border-b border-neutral-200 p-4 sticky top-0 z-35 flex items-center justify-between shadow-sm">
            <h2 className="text-lg font-extrabold text-primary flex items-center gap-2">
              <Image
                src="/images/RSFavicon.png"
                alt="Revathi Stores Logo"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
              Revathi ERP
            </h2>
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 text-neutral-600 hover:bg-neutral-50 rounded-xl border border-neutral-200/60 transition-colors"
              aria-label="Open navigation menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
         </div>

         {/* Mobile Side Drawer Menu */}
         {isDrawerOpen && (
           <div className="fixed inset-0 z-50 lg:hidden flex">
             {/* Backdrop overlay */}
             <div 
               className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs transition-opacity duration-300"
               onClick={() => setIsDrawerOpen(false)}
             />

             {/* Slide-out side drawer */}
             <aside className="relative flex flex-col w-72 max-w-[85vw] h-full bg-white shadow-2xl z-50 animate-in slide-in-from-left duration-300">
               {/* Drawer Brand Header */}
               <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                 <h2 className="text-lg font-extrabold text-primary flex items-center gap-2">
                   <Image
                     src="/images/RSFavicon.png"
                     alt="Revathi Stores Logo"
                     width={32}
                     height={32}
                     className="object-contain"
                     priority
                   />
                   Revathi ERP
                 </h2>
                 <button
                   onClick={() => setIsDrawerOpen(false)}
                   className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors"
                   aria-label="Close menu"
                 >
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>

               {/* Drawer Menu Links */}
               <nav className="flex-1 flex flex-col gap-1 px-4 py-6 overflow-y-auto">
                 {links.map((link) => {
                   const isActive = pathname === link.href;
                   return (
                     <Link 
                       key={link.href} 
                       href={link.href}
                       onClick={() => setIsDrawerOpen(false)}
                       className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                         isActive 
                           ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]' 
                           : 'text-neutral-500 hover:bg-neutral-50 hover:text-primary'
                       }`}
                     >
                       <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                         <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                       </svg>
                       {link.label}
                     </Link>
                   );
                 })}
               </nav>

               {/* Drawer Footer Sign Out */}
               <div className="p-4 border-t border-neutral-100 bg-neutral-50/50">
                 <button 
                   onClick={async () => {
                     setIsDrawerOpen(false);
                     await fetch('/api/admin/login', { method: 'POST', body: JSON.stringify({ action: 'logout' }) });
                     window.location.href = '/admin/login';
                   }}
                   className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
                 >
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                   </svg>
                   Sign Out
                 </button>
               </div>
             </aside>
           </div>
         )}

         <div className="flex-1">
            {children}
         </div>
      </div>
    </div>
  );
}
