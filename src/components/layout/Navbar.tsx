'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function Navbar() {
  const { t } = useLanguage();

  return (
    <nav className="sticky top-0 z-50 bg-brand-white/90 backdrop-blur-md shadow-sm border-b border-primary-light/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 group">
             <div className="relative w-12 h-12 flex items-center justify-center bg-primary rounded-full shadow-lg group-hover:shadow-primary/50 transition-shadow overflow-hidden">
                <Image
                  src="/images/RSlogo.png"
                  alt="Revathi Store Logo"
                  width={48}
                  height={48}
                  className="object-cover group-hover:scale-110 transition-transform"
                />
             </div>
             <div className="flex flex-col">
                <span className="text-xl font-bold text-primary leading-tight">REVATHI</span>
                <span className="text-sm font-semibold tracking-widest text-secondary uppercase leading-none">Store</span>
             </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link href="/" className="text-foreground hover:text-primary font-medium transition-colors">{t('nav.home')}</Link>
            <Link href="/products" className="text-foreground hover:text-primary font-medium transition-colors">{t('nav.products')}</Link>
            <Link href="/wholesale" className="text-foreground hover:text-primary font-medium transition-colors">{t('nav.wholesale')}</Link>
            <Link href="/about" className="text-foreground hover:text-primary font-medium transition-colors">{t('nav.about')}</Link>
            <Link href="/contact" className="text-foreground hover:text-primary font-medium transition-colors">{t('nav.contact')}</Link>
          </div>

          {/* Cart Icon and Language Switcher */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <Link href="/cart" className="relative p-2 text-primary hover:text-secondary transition-colors group">
               <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                 <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                 <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
               </svg>
               <span className="absolute -top-1 -right-1 bg-secondary text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow">0</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
