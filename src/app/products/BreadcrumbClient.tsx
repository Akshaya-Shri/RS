"use client";

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function BreadcrumbClient({ productName }: { productName?: string }) {
  const { t } = useLanguage();

  return (
    <nav className="text-sm font-medium text-neutral-500 mb-8">
      <Link href="/" className="hover:text-primary transition-colors">{t('nav.home')}</Link>
      <span className="mx-2">/</span>
      <Link href="/products" className="hover:text-primary transition-colors">{t('nav.products')}</Link>
      {productName && (
        <>
          <span className="mx-2">/</span>
          <span className="text-foreground">{productName}</span>
        </>
      )}
    </nav>
  );
}
