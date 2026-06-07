'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/components/cart/CartProvider';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function Navbar() {
  const { t } = useLanguage();
  const { cartItems } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const displayCount = mounted ? cartCount : 0;

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

          {/* Cart Icon, Language Switcher, and Mobile Toggle */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            
            <Link href="/cart" className="relative p-2 text-primary hover:text-secondary transition-colors group" aria-label="Cart">
               <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                 <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                 <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
               </svg>
               {displayCount > 0 && (
                 <span className="absolute -top-1 -right-1 bg-secondary text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow">
                   {displayCount}
                 </span>
               )}
            </Link>

            {/* Mobile Hamburger Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-primary hover:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg transition-colors"
              aria-label="Toggle Navigation Menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Side Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-primary-light/25 px-4 pt-2 pb-6 space-y-1 absolute top-20 left-0 w-full shadow-lg z-40 animate-in slide-in-from-top duration-200">
          <Link 
            href="/" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-xl text-foreground hover:bg-primary/5 hover:text-primary font-bold transition-colors"
          >
            {t('nav.home')}
          </Link>
          <Link 
            href="/products" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-xl text-foreground hover:bg-primary/5 hover:text-primary font-bold transition-colors"
          >
            {t('nav.products')}
          </Link>
          <Link 
            href="/wholesale" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-xl text-foreground hover:bg-primary/5 hover:text-primary font-bold transition-colors"
          >
            {t('nav.wholesale')}
          </Link>
          <Link 
            href="/about" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-xl text-foreground hover:bg-primary/5 hover:text-primary font-bold transition-colors"
          >
            {t('nav.about')}
          </Link>
          <Link 
            href="/contact" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-xl text-foreground hover:bg-primary/5 hover:text-primary font-bold transition-colors"
          >
            {t('nav.contact')}
          </Link>
        </div>
      )}
    </nav>
  );
}
